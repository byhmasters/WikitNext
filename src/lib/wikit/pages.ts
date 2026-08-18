import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { page, revision } from '@/lib/db/schema';
import { getCurrentAccount } from '@/lib/auth/session';
import { loadSiteConfig } from './config';
import { parseFullname, type PageRef } from './names';
import { renderWikitext } from './render';

// site settings live in the committed config file, not the DB
export async function getSite() {
  return loadSiteConfig();
}

export async function getPage(ref: PageRef) {
  const rows = await db
    .select()
    .from(page)
    .where(and(eq(page.category, ref.category), eq(page.name, ref.name)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getHeadRevision(headRevisionId: number | null) {
  if (headRevisionId == null) return null;
  const rows = await db.select().from(revision).where(eq(revision.id, headRevisionId)).limit(1);
  return rows[0] ?? null;
}

export async function getPageWithHead(ref: PageRef) {
  const p = await getPage(ref);
  if (!p) return null;
  const head = await getHeadRevision(p.headRevisionId);
  return { page: p, head };
}

export async function listRevisions(pageId: number) {
  return db
    .select({
      id: revision.id,
      ordinal: revision.ordinal,
      comment: revision.comment,
      changeKind: revision.changeKind,
      authorId: revision.authorId,
      createdAt: revision.createdAt,
    })
    .from(revision)
    .where(eq(revision.pageId, pageId))
    .orderBy(desc(revision.ordinal));
}

export async function getRevisionByOrdinal(pageId: number, ordinal: number) {
  const rows = await db
    .select()
    .from(revision)
    .where(and(eq(revision.pageId, pageId), eq(revision.ordinal, ordinal)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getExistingFullnames(fullnames: string[]): Promise<Set<string>> {
  const unique = [...new Set(fullnames)];
  if (unique.length === 0) return new Set();
  const rows = await db
    .select({ fullname: page.fullname })
    .from(page)
    .where(inArray(page.fullname, unique));
  return new Set(rows.map((r) => r.fullname).filter((x): x is string => !!x));
}

// 写操作的作者 = 当前登录用户；未登录返回 null（调用方据此拒绝）
export async function getDefaultAuthor() {
  return getCurrentAccount();
}

// nav:top / nav:side are re-rendered from source in nav mode at request time
export async function renderNav(name: string, siteSlug: string): Promise<string> {
  const ref = parseFullname(name);
  const withHead = await getPageWithHead(ref);
  if (!withHead?.head) return '';
  const result = await renderWikitext(
    withHead.head.source,
    { ref, site: siteSlug, title: withHead.page.title || ref.name },
    'nav',
  );
  // ftml emits a nested list's <ul> as a sibling of its parent <li>; pull it
  // back inside so the theme's `#top-bar li:hover ul` dropdown works.
  return result.body.replace(/<\/li>\s*<ul>/g, '<ul>');
}
