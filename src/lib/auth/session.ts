import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account, session } from '@/lib/db/schema';
import type { Account } from '@/lib/db/schema';

const COOKIE = 'wkt_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 天

// cache(): 同一次请求里多处调用只查一次库
export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ acct: account })
    .from(session)
    .innerJoin(account, eq(account.id, session.accountId))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
    .limit(1);
  const acct = rows[0]?.acct ?? null;
  if (!acct || acct.banned) return null;
  return acct;
});

export async function createSession(accountId: number): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await db.insert(session).values({ token, accountId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(session).where(eq(session.token, token));
  jar.delete(COOKIE);
}
