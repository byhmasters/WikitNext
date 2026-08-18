'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema';
import { getCurrentAccount } from '@/lib/auth/session';
import { canManageMembers, isAdmin } from '@/lib/auth/perms';
import { canWriteConfig, loadSiteConfig, saveSiteConfig, type SiteConfig } from '@/lib/wikit/config';

type Result = { ok: true } | { ok: false; error: string };

export async function setMemberFlag(accountId: number, canManage: boolean): Promise<Result> {
  const me = await getCurrentAccount();
  if (!isAdmin(me)) return { ok: false, error: '无权限' };
  await db.update(account).set({ canManageMembers: canManage }).where(eq(account.id, accountId));
  revalidatePath('/_admin');
  return { ok: true };
}

export async function setBanned(accountId: number, banned: boolean): Promise<Result> {
  const me = await getCurrentAccount();
  if (!canManageMembers(me)) return { ok: false, error: '无权限' };
  const target = (await db.select().from(account).where(eq(account.id, accountId)).limit(1))[0];
  if (!target) return { ok: false, error: '用户不存在' };
  if (target.kind === 'admin' || target.id === me!.id) return { ok: false, error: '不可封禁该用户' };
  await db.update(account).set({ banned }).where(eq(account.id, accountId));
  revalidatePath('/_admin');
  return { ok: true };
}

export async function saveSiteSettings(input: {
  title: string;
  headline: string;
  homePage: string;
  themeMode: string;
  themeCss: string;
  themeExternalUrl: string;
}): Promise<Result> {
  const me = await getCurrentAccount();
  if (!isAdmin(me)) return { ok: false, error: '无权限' };
  if (!canWriteConfig()) {
    return { ok: false, error: '线上环境为只读，请在本地修改配置文件后重新部署' };
  }
  const current = await loadSiteConfig();
  const next: SiteConfig = {
    ...current,
    title: input.title.trim() || current.title,
    headline: input.headline,
    homePage: input.homePage.trim() || current.homePage,
    theme: {
      mode: input.themeMode === 'inline' ? 'inline' : 'external',
      css: input.themeCss,
      externalUrl: input.themeExternalUrl.trim(),
    },
  };
  await saveSiteConfig(next);
  revalidatePath('/', 'layout');
  return { ok: true };
}
