import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// 自建认证，不引第三方库：scrypt + 每账号随机盐，存成 "salt:hash"（都是 hex）。
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), KEYLEN);
  // 长度不等时 timingSafeEqual 会抛错，先挡一下
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
