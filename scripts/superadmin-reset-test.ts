// 超级管理员凭据重置 + 密码安全存储 冒烟测试（Node 22 + Web Crypto）
import assert from 'node:assert';
import { hashPassword, verifyPassword, isHashedPassword } from '../src/utils/passwordSecurity';
import {
  computeSuperAdminReset,
  migrateUsersPasswords,
  verifyUserPassword,
} from '../src/utils/accountReset';
import type { UserAccount } from '../src/types';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      console.error(`  ✗ ${name}\n    ${err.message}`);
      process.exitCode = 1;
    });
}

const superAdmin: UserAccount = {
  id: 'usr-super-admin',
  username: 'oldadmin',
  password: 'legacy123',
  name: '超级管理员',
  role: 'super_admin',
  roleTitle: '超级管理员',
  department: '总部',
  phone: '138',
  status: 'active',
  createdAt: '2026-08-16',
};
const consultant: UserAccount = {
  id: 'usr-consultant-1',
  username: 'zhangqiang',
  password: '123456',
  name: '张强',
  role: 'consultant',
  roleTitle: '顾问',
  department: '销售',
  phone: '139',
  status: 'active',
  createdAt: '2026-08-16',
};

async function main() {
  console.log('== 1. 密码哈希与校验 ==');
  await test('hashPassword 生成 pbkdf2$sha256$ 格式', async () => {
    const h = await hashPassword('a1988624');
    assert.ok(h.startsWith('pbkdf2$sha256$'), `格式不符: ${h}`);
    assert.ok(isHashedPassword(h));
  });
  await test('相同明文两次哈希结果不同（随机盐）', async () => {
    const a = await hashPassword('a1988624');
    const b = await hashPassword('a1988624');
    assert.notStrictEqual(a, b);
  });
  await test('verifyPassword 正确密码返回 true', async () => {
    const h = await hashPassword('a1988624');
    assert.strictEqual(await verifyPassword('a1988624', h), true);
  });
  await test('verifyPassword 错误密码返回 false', async () => {
    const h = await hashPassword('a1988624');
    assert.strictEqual(await verifyPassword('wrongpwd', h), false);
  });
  await test('verifyPassword 对明文/非法输入安全返回 false', async () => {
    assert.strictEqual(await verifyPassword('x', undefined), false);
    assert.strictEqual(await verifyPassword('x', 'plaintext'), false);
  });

  console.log('== 2. 超级管理员重置（核心交付） ==');
  let resetUsers: UserAccount[] = [];
  await test('重置成功：用户名 himax、密码哈希存储、明文清除、角色不变', async () => {
    const { result, nextUsers } = await computeSuperAdminReset([superAdmin, consultant], {
      username: 'himax',
      newPassword: 'a1988624',
      executorRole: 'super_admin',
      requireChangePassword: false,
    });
    resetUsers = nextUsers;
    assert.strictEqual(result.ok, true, result.message);
    assert.strictEqual(result.affected, 1);
    const sa = nextUsers.find((u) => u.role === 'super_admin')!;
    assert.strictEqual(sa.username, 'himax');
    assert.ok(sa.passwordHash && isHashedPassword(sa.passwordHash), '未生成哈希');
    assert.strictEqual(sa.password, undefined, '明文密码未清除');
    assert.strictEqual(sa.role, 'super_admin');
    assert.strictEqual(sa.mustChangePassword, false);
  });
  await test('重置后可用新密码登录（verifyUserPassword 通过）', async () => {
    const sa = resetUsers.find((u) => u.role === 'super_admin')!;
    assert.strictEqual(await verifyUserPassword(sa, 'a1988624'), true);
    assert.strictEqual(await verifyUserPassword(sa, 'wrong'), false);
  });
  await test('非超管账号不被重置（仅作用于超管）', async () => {
    const { result, nextUsers } = await computeSuperAdminReset([superAdmin, consultant], {
      username: 'himax',
      newPassword: 'a1988624',
    });
    assert.strictEqual(result.ok, true);
    const c = nextUsers.find((u) => u.id === consultant.id)!;
    assert.strictEqual(c.username, 'zhangqiang', '顾问账号被错误改名');
    assert.ok(!c.passwordHash, '顾问账号不应被重置密码');
  });

  console.log('== 3. 身份校验（越权拒绝） ==');
  await test('executorRole 非 super_admin 时拒绝执行', async () => {
    const { result } = await computeSuperAdminReset([superAdmin], {
      username: 'himax',
      newPassword: 'a1988624',
      executorRole: 'consultant',
    });
    assert.strictEqual(result.ok, false);
    assert.match(result.message, /仅具备超级管理员/);
  });
  await test('系统中无超管账号时返回失败', async () => {
    const { result } = await computeSuperAdminReset([consultant], {
      username: 'himax',
      newPassword: 'a1988624',
      executorRole: 'super_admin',
    });
    assert.strictEqual(result.ok, false);
    assert.match(result.message, /不存在超级管理员/);
  });
  await test('新密码过短被拦截', async () => {
    const { result } = await computeSuperAdminReset([superAdmin], {
      username: 'himax',
      newPassword: '123',
      executorRole: 'super_admin',
    });
    assert.strictEqual(result.ok, false);
  });

  console.log('== 4. 明文迁移 ==');
  await test('migrateUsersPasswords 将明文转为哈希并清除明文', async () => {
    const migrated = await migrateUsersPasswords([superAdmin, consultant]);
    for (const u of migrated) {
      assert.ok(u.passwordHash && isHashedPassword(u.passwordHash), `${u.username} 未迁移`);
      assert.strictEqual(u.password, undefined, `${u.username} 明文未清除`);
    }
    const sa = migrated.find((u) => u.role === 'super_admin')!;
    assert.strictEqual(await verifyUserPassword(sa, 'legacy123'), true);
  });
  await test('verifyUserPassword 兼容遗留明文', async () => {
    assert.strictEqual(await verifyUserPassword(superAdmin, 'legacy123'), true);
    assert.strictEqual(await verifyUserPassword(superAdmin, 'bad'), false);
  });

  console.log(`\n全部通过: ${passed} 项 ✓`);
}

main();
