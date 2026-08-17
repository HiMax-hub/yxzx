// 账号凭据重置与明文迁移工具
// 核心交付：将超级管理员账号重置为指定用户名/密码，并以加盐哈希安全存储，
// 仅对具备超级管理员权限的账号生效，返回结构化操作结果。

import type { UserAccount, UserRole } from '../types';
import { hashPassword, isHashedPassword, verifyPassword } from './passwordSecurity';

export interface SuperAdminResetParams {
  /** 重置后的目标用户名 */
  username: string;
  /** 重置后的新密码（明文，仅在本函数内做一次哈希后即丢弃） */
  newPassword: string;
  /** 调用者角色；若提供则仅允许 super_admin 执行，拒绝越权 */
  executorRole?: UserRole;
  /** 重置后是否要求首次登录强制改密（默认 false，保证可正常登录） */
  requireChangePassword?: boolean;
  /** 新密码最小长度（默认 8） */
  minPasswordLength?: number;
}

export interface SuperAdminResetResult {
  ok: boolean;
  message: string;
  affected: number;
  account?: { id: string; username: string; role: UserRole };
}

export interface SuperAdminResetOutcome {
  result: SuperAdminResetResult;
  nextUsers: UserAccount[];
}

/**
 * 重置超级管理员账号（纯函数，不触碰存储）。
 * 安全约束：
 *  1) 仅当 executorRole 为 super_admin 时允许执行（越权直接拒绝）；
 *  2) 仅对 role === 'super_admin' 的账号生效，不改变其他角色；
 *  3) 新密码以 PBKDF2+盐值哈希存储，明文 password 字段被清除；
 *  4) 返回结构化结果，便于上层提示「操作成功」。
 */
export async function computeSuperAdminReset(
  users: UserAccount[],
  params: SuperAdminResetParams
): Promise<SuperAdminResetOutcome> {
  const {
    username,
    newPassword,
    executorRole,
    requireChangePassword = false,
    minPasswordLength = 8,
  } = params;

  // 1) 身份校验：越权拒绝
  if (executorRole && executorRole !== 'super_admin') {
    return {
      result: {
        ok: false,
        message: '操作被拒绝：仅具备超级管理员权限的账号可执行超级管理员凭据重置。',
        affected: 0,
      },
      nextUsers: users,
    };
  }

  // 2) 新密码强度保底校验（显式管理员重置，复杂度由改密弹窗另行约束，此处仅校验长度下限）
  if (!newPassword || newPassword.length < minPasswordLength) {
    return {
      result: {
        ok: false,
        message: `新密码长度不足，至少需 ${minPasswordLength} 位。`,
        affected: 0,
      },
      nextUsers: users,
    };
  }

  // 3) 仅作用于超级管理员账号
  const targets = users.filter((u) => u.role === 'super_admin');
  if (targets.length === 0) {
    return {
      result: {
        ok: false,
        message: '系统中不存在超级管理员账号，无法执行重置。',
        affected: 0,
      },
      nextUsers: users,
    };
  }

  const passwordHash = await hashPassword(newPassword);

  const nextUsers = users.map((u) => {
    if (u.role !== 'super_admin') return u;
    // 清除明文密码，仅保留哈希；用户名按目标设置
    const { password: _plain, ...rest } = u;
    return {
      ...rest,
      username,
      passwordHash,
      mustChangePassword: requireChangePassword,
    };
  });

  const primary = nextUsers.find((u) => u.role === 'super_admin')!;
  return {
    nextUsers,
    result: {
      ok: true,
      message: `超级管理员账号重置成功：用户名「${username}」已生效，密码已采用 PBKDF2+盐值哈希安全存储。`,
      affected: targets.length,
      account: { id: primary.id, username: primary.username, role: primary.role },
    },
  };
}

/**
 * 明文密码迁移：将仍存储明文 password 的账号转换为 passwordHash，并清除明文。
 * 幂等：无明文则返回原数组引用。
 */
export async function migrateUsersPasswords(users: UserAccount[]): Promise<UserAccount[]> {
  let changed = false;
  const next = await Promise.all(
    users.map(async (u) => {
      if (u.password && !isHashedPassword(u.password)) {
        changed = true;
        const passwordHash = await hashPassword(u.password);
        const { password: _plain, ...rest } = u;
        return { ...rest, passwordHash };
      }
      return u;
    })
  );
  return changed ? next : users;
}

/** 校验某账号当前密码是否正确（兼容哈希存储与明文遗留两种形态） */
export async function verifyUserPassword(user: UserAccount, input: string): Promise<boolean> {
  if (user.passwordHash && isHashedPassword(user.passwordHash)) {
    return verifyPassword(input, user.passwordHash);
  }
  if (user.password) {
    return input === user.password;
  }
  return false;
}
