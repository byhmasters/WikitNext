'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { page, pageAuthor, revision } from '@/lib/db/schema';
import { pagePath, type PageRef } from '@/lib/wikit/names';
import { renderWikitext } from '@/lib/wikit/render';
import { getDefaultAuthor, getPage } from '@/lib/wikit/pages';
import { canEdit, canManagePage, isMember } from '@/lib/auth/perms';

export interface SaveInput {
  category: string;
  name: string;
  title: string;
  source: string;
  comment?: string;
  tags?: string[];
}

async function writeRevision(input: SaveInput, changeKindWhenExisting: string) {
  const ref: PageRef = { category: input.category, name: input.name };
  const author = await getDefaultAuthor();
  const rendered = await renderWikitext(
    input.source,
    { ref, site: 'wikit', title: input.title || ref.name, tags: input.tags ?? [] },
    'page',
  );

  await db.transaction(async (tx) => {
    let target = (
      await tx
        .select()
        .from(page)
        .where(and(eq(page.category, ref.category), eq(page.name, ref.name)))
        .limit(1)
    )[0];

    let isNew = false;
    if (!target) {
      isNew = true;
      target = (
        await tx
          .insert(page)
          .values({
            category: ref.category,
            name: ref.name,
            title: input.title,
            tags: input.tags ?? [],
          })
          .returning()
      )[0];
    }

    const maxRow = (
      await tx
        .select({ m: sql<number>`coalesce(max(${revision.ordinal}), -1)::int` })
        .from(revision)
        .where(eq(revision.pageId, target.id))
    )[0];
    const nextOrdinal = Number(maxRow?.m ?? -1) + 1;

    const rev = (
      await tx
        .insert(revision)
        .values({
          pageId: target.id,
          ordinal: nextOrdinal,
          source: input.source,
          renderedHtml: rendered.body,
          meta: rendered.meta,
          backlinks: rendered.backlinks,
          comment: input.comment ?? '',
          authorId: author?.id ?? null,
          changeKind: isNew ? 'new' : changeKindWhenExisting,
        })
        .returning()
    )[0];

    await tx
      .update(page)
      .set({
        title: input.title,
        tags: input.tags ?? [],
        headRevisionId: rev.id,
        updatedAt: new Date(),
      })
      .where(eq(page.id, target.id));

    // a new page starts with its creator as the sole author
    if (isNew && author) {
      await tx.insert(pageAuthor).values({ pageId: target.id, accountId: author.id });
    }
  });

  revalidatePath(pagePath(ref));
  // nav pages show on every page, so a change must refresh the whole layout
  if (ref.category === 'nav') revalidatePath('/', 'layout');
  return { ok: true as const, path: pagePath(ref) };
}

export async function savePage(input: SaveInput) {
  const me = await getDefaultAuthor();
  if (!isMember(me)) return { ok: false as const, error: '请先登录' };
  const existing = await getPage({ category: input.category, name: input.name });
  if (existing && !canEdit(me, existing)) {
    return { ok: false as const, error: '页面已锁定，只有管理员可编辑' };
  }
  return writeRevision(input, 'source');
}

// records a history entry for a change that doesn't touch the source (tags, rename);
// reuses the current head's rendered snapshot so the version stays viewable
export async function logRevision(pageId: number, changeKind: string, comment: string) {
  const author = await getDefaultAuthor();
  await db.transaction(async (tx) => {
    const target = (await tx.select().from(page).where(eq(page.id, pageId)).limit(1))[0];
    if (!target) return;
    const head = (
      await tx
        .select()
        .from(revision)
        .where(eq(revision.pageId, pageId))
        .orderBy(desc(revision.ordinal))
        .limit(1)
    )[0];
    const maxRow = (
      await tx
        .select({ m: sql<number>`coalesce(max(${revision.ordinal}), -1)::int` })
        .from(revision)
        .where(eq(revision.pageId, pageId))
    )[0];
    const nextOrdinal = Number(maxRow?.m ?? -1) + 1;

    const rev = (
      await tx
        .insert(revision)
        .values({
          pageId,
          ordinal: nextOrdinal,
          source: head?.source ?? '',
          renderedHtml: head?.renderedHtml ?? '',
          meta: head?.meta ?? null,
          backlinks: head?.backlinks ?? null,
          comment,
          authorId: author?.id ?? null,
          changeKind,
        })
        .returning()
    )[0];

    await tx
      .update(page)
      .set({ headRevisionId: rev.id, updatedAt: new Date() })
      .where(eq(page.id, pageId));
  });
}

export async function revertToOrdinal(pageId: number, ordinal: number) {
  // 回退相当于用旧版内容重写，权限按“管理页面”（作者或 admin）判定
  const me = await getDefaultAuthor();
  if (!(await canManagePage(me, pageId))) return { ok: false as const };
  const target = (await db.select().from(page).where(eq(page.id, pageId)).limit(1))[0];
  if (!target) return { ok: false as const };

  const src = (
    await db
      .select()
      .from(revision)
      .where(and(eq(revision.pageId, pageId), eq(revision.ordinal, ordinal)))
      .limit(1)
  )[0];
  if (!src) return { ok: false as const };

  return writeRevision(
    {
      category: target.category,
      name: target.name,
      title: target.title,
      source: src.source,
      comment: `回退到 #${ordinal}`,
      tags: target.tags,
    },
    'revert',
  );
}
