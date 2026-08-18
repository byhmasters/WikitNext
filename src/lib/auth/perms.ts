import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pageAuthor } from '@/lib/db/schema';
import type { Account } from '@/lib/db/schema';

export type Role = 'visitor' | 'member' | 'admin';

export function roleOf(acct: Account | null): Role {
  if (!acct) return 'visitor';
  return acct.kind === 'admin' ? 'admin' : 'member';
}

export function isAdmin(acct: Account | null): boolean {
  return !!acct && acct.kind === 'admin';
}

export function isMember(acct: Account | null): boolean {
  return !!acct && !acct.banned;
}

// locked 页面只有 admin 能编辑；否则任意登录成员可编辑
export function canEdit(acct: Account | null, pg: { locked: boolean }): boolean {
  if (!isMember(acct)) return false;
  if (pg.locked) return isAdmin(acct);
  return true;
}

export function canComment(acct: Account | null): boolean {
  return isMember(acct);
}

export function canVote(acct: Account | null): boolean {
  return isMember(acct);
}

// admin 或有“成员管理”授权者
export function canManageMembers(acct: Account | null): boolean {
  return isAdmin(acct) || (!!acct && acct.canManageMembers && !acct.banned);
}

export async function isPageAuthor(pageId: number, accountId: number): Promise<boolean> {
  const rows = await db
    .select({ id: pageAuthor.id })
    .from(pageAuthor)
    .where(and(eq(pageAuthor.pageId, pageId), eq(pageAuthor.accountId, accountId)))
    .limit(1);
  return rows.length > 0;
}

// 删除/重命名/改标签：admin 或该页作者
export async function canManagePage(acct: Account | null, pageId: number): Promise<boolean> {
  if (!isMember(acct)) return false;
  if (isAdmin(acct)) return true;
  return isPageAuthor(pageId, acct!.id);
}
