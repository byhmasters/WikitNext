'use server';

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';

export type AuthResult = { ok: true } | { ok: false; error: string };

function normHandle(raw: string): string {
  return raw.trim();
}

export async function register(handleRaw: string, password: string): Promise<AuthResult> {
  const handle = normHandle(handleRaw);
  if (handle.length < 2) return { ok: false, error: '用户名至少 2 个字符' };
  if (password.length < 6) return { ok: false, error: '密码至少 6 个字符' };

  const taken = await db
    .select({ id: account.id })
    .from(account)
    .where(sql`lower(${account.handle}) = lower(${handle})`)
    .limit(1);
  if (taken.length) return { ok: false, error: '该用户名已被占用' };

  // 数据库里还没有 admin 时，第一个注册者即管理员
  const admins = await db
    .select({ id: account.id })
    .from(account)
    .where(sql`${account.kind} = 'admin'`)
    .limit(1);
  const kind = admins.length ? 'member' : 'admin';

  const rows = await db
    .insert(account)
    .values({ handle, displayName: handle, kind, passwordHash: hashPassword(password) })
    .returning({ id: account.id });

  await createSession(rows[0].id);
  return { ok: true };
}

export async function login(handleRaw: string, password: string): Promise<AuthResult> {
  const handle = normHandle(handleRaw);
  const rows = await db
    .select()
    .from(account)
    .where(sql`lower(${account.handle}) = lower(${handle})`)
    .limit(1);
  const acct = rows[0];
  if (!acct || !acct.passwordHash || !verifyPassword(password, acct.passwordHash)) {
    return { ok: false, error: '用户名或密码错误' };
  }
  if (acct.banned) return { ok: false, error: '该账号已被封禁' };
  await createSession(acct.id);
  return { ok: true };
}

export async function logout(): Promise<void> {
  await destroySession();
}
