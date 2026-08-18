'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';
import { getCurrentAccount } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export type ProfileInput = {
  displayName: string;
  gender: string;
  website: string;
  bio: string;
  email: string;
};

export async function updateProfile(input: ProfileInput): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentAccount();
  if (!me) return { ok: false, error: '请先登录' };
  const displayName = input.displayName.trim() || me.handle;
  await db
    .update(account)
    .set({
      displayName,
      gender: input.gender.trim(),
      website: input.website.trim(),
      bio: input.bio,
      email: input.email.trim(),
    })
    .where(eq(account.id, me.id));
  return { ok: true };
}

export async function changePassword(
  current: string,
  next: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentAccount();
  if (!me) return { ok: false, error: '请先登录' };
  if (next.length < 6) return { ok: false, error: '新密码至少 6 个字符' };
  if (me.passwordHash && !verifyPassword(current, me.passwordHash)) {
    return { ok: false, error: '当前密码不正确' };
  }
  await db.update(account).set({ passwordHash: hashPassword(next) }).where(eq(account.id, me.id));
  return { ok: true };
}
