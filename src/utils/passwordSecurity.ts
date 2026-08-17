// 密码安全存储模块
// 采用 Web Crypto 原生 PBKDF2-HMAC-SHA256 + 随机盐值，浏览器与 Node 18+ 通用。
// 存储格式（单行字符串，自带盐与参数，便于校验与未来升级算法）：
//   pbkdf2$sha256$<iterations>$<saltBase64>$<hashBase64>
// 明文密码绝不落库；校验采用定长时间比较，防御时序攻击。

const PBKDF2_ITERATIONS = 210_000; // OWASP 2023 对 SHA-256 的推荐下限
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function getCrypto(): Crypto {
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (!c || !c.subtle) {
    throw new Error('当前运行环境不支持 Web Crypto，无法执行安全密码处理');
  }
  return c;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** 判断给定字符串是否为本模块生成的哈希格式（用于区分明文遗留数据） */
export function isHashedPassword(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith('pbkdf2$');
}

/** 对明文密码进行加盐哈希，返回可持久化字符串 */
export async function hashPassword(password: string): Promise<string> {
  const crypto = getCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const enc = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );
  const hash = new Uint8Array(bits);
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** 校验明文密码是否匹配已存储的哈希；任何异常均按不匹配处理（不泄露原因） */
export async function verifyPassword(
  password: string,
  stored: string | undefined | null
): Promise<boolean> {
  if (!stored || !isHashedPassword(stored)) return false;
  const parts = stored.split('$');
  if (parts.length !== 5) return false;
  const [, algo, iterStr, saltB64, hashB64] = parts;
  if (algo !== 'sha256') return false;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  let expected: Uint8Array;
  let salt: Uint8Array;
  try {
    expected = fromBase64(hashB64);
    salt = fromBase64(saltB64);
  } catch {
    return false;
  }

  const crypto = getCrypto();
  const enc = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    expected.length * 8
  );
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;

  // 定长时间比较，防御时序侧信道攻击
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
