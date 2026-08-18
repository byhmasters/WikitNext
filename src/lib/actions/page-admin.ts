'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comment, page, vote } from '@/lib/db/schema';
import { displayFullname, pagePath, parseFullname, type PageRef } from '@/lib/wikit/names';
import { getDefaultAuthor } from '@/lib/wikit/pages';
import { canComment, canManagePage, canVote, isAdmin } from '@/lib/auth/perms';
import { logRevision } from './save-page';

async function refOf(pageId: number): Promise<PageRef | null> {
  const p = (await db.select().from(page).where(eq(page.id, pageId)).limit(1))[0];
  return p ? { category: p.category, name: p.name } : null;
}

export async function setTags(pageId: number, tags: string[]) {
  const me = await getDefaultAuthor();
  if (!(await canManagePage(me, pageId))) return { ok: false as const };
  const clean = tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const before = (await db.select({ tags: page.tags }).from(page).where(eq(page.id, pageId)).limit(1))[0]?.tags ?? [];
  await db.update(page).set({ tags: clean, updatedAt: new Date() }).where(eq(page.id, pageId));

  const added = clean.filter((t) => !before.includes(t));
  const removed = before.filter((t) => !clean.includes(t));
  const parts: string[] = [];
  if (added.length) parts.push(`+${added.join(' ')}`);
  if (removed.length) parts.push(`−${removed.join(' ')}`);
  if (parts.length) await logRevision(pageId, 'tags', parts.join('  '));

  const ref = await refOf(pageId);
  if (ref) revalidatePath(pagePath(ref));
  return { ok: true as const };
}

export async function toggleLock(pageId: number) {
  const me = await getDefaultAuthor();
  if (!(await canManagePage(me, pageId))) return { ok: false as const };
  const p = (await db.select().from(page).where(eq(page.id, pageId)).limit(1))[0];
  if (!p) return { ok: false as const };
  const locked = !p.locked;
  await db.update(page).set({ locked }).where(eq(page.id, pageId));
  revalidatePath(pagePath({ category: p.category, name: p.name }));
  return { ok: true as const, locked };
}

export async function renamePage(pageId: number, fullname: string) {
  const me = await getDefaultAuthor();
  if (!(await canManagePage(me, pageId))) return { ok: false as const, path: '/' };
  const ref = parseFullname(fullname);
  const before = await refOf(pageId);
  await db
    .update(page)
    .set({ category: ref.category, name: ref.name, updatedAt: new Date() })
    .where(eq(page.id, pageId));
  if (before && (before.category !== ref.category || before.name !== ref.name)) {
    await logRevision(pageId, 'rename', `${displayFullname(before)} → ${displayFullname(ref)}`);
  }
  revalidatePath('/', 'layout');
  return { ok: true as const, path: pagePath(ref) };
}

export async function deletePage(pageId: number) {
  const me = await getDefaultAuthor();
  if (!(await canManagePage(me, pageId))) return { ok: false as const, path: '/' };
  await db.delete(page).where(eq(page.id, pageId));
  revalidatePath('/', 'layout');
  return { ok: true as const, path: '/' };
}

export async function castVote(pageId: number, value: number) {
  const acct = await getDefaultAuthor();
  if (!canVote(acct) || !acct) return { ok: false as const };
  if (value === 0) {
    await db.delete(vote).where(and(eq(vote.pageId, pageId), eq(vote.accountId, acct.id)));
  } else {
    await db
      .insert(vote)
      .values({ pageId, accountId: acct.id, value })
      .onConflictDoUpdate({ target: [vote.pageId, vote.accountId], set: { value } });
  }
  return { ok: true as const };
}

export async function addComment(
  pageId: number,
  body: string,
  parentId: number | null = null,
  replyToName: string | null = null,
) {
  const text = body.trim();
  if (!text) return { ok: false as const };
  const acct = await getDefaultAuthor();
  if (!canComment(acct) || !acct) return { ok: false as const };
  await db
    .insert(comment)
    .values({ pageId, parentId, replyToName, accountId: acct.id, body: text });
  return { ok: true as const };
}

export async function deleteComment(commentId: number) {
  const me = await getDefaultAuthor();
  if (!me) return { ok: false as const };
  const c = (await db.select().from(comment).where(eq(comment.id, commentId)).limit(1))[0];
  if (!c) return { ok: false as const };
  // 评论删除：本人或 admin
  if (c.accountId !== me.id && !isAdmin(me)) return { ok: false as const };
  // top-level delete cascades to its replies (self-ref FK); replies have no children so they go alone
  await db.delete(comment).where(eq(comment.id, commentId));
  return { ok: true as const };
}
