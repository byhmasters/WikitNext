import { and, asc, count, desc, eq, max, min, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account, comment, page, revision, vote } from '@/lib/db/schema';
import { parseFullname } from './names';

export async function resolvePageId(idOrName: string): Promise<number | null> {
  const decoded = decodeURIComponent(idOrName);
  if (/^\d+$/.test(decoded)) {
    const rows = await db.select({ id: page.id }).from(page).where(eq(page.id, Number(decoded))).limit(1);
    return rows[0]?.id ?? null;
  }
  const ref = parseFullname(decoded);
  const rows = await db
    .select({ id: page.id })
    .from(page)
    .where(and(eq(page.category, ref.category), eq(page.name, ref.name)))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function getPageMeta(pageId: number) {
  const rows = await db
    .select({ id: page.id, fullname: page.fullname, title: page.title })
    .from(page)
    .where(eq(page.id, pageId))
    .limit(1);
  return rows[0] ?? null;
}

export interface HistoryRow {
  ordinal: number;
  createdAt: string;
  comment: string;
  changeKind: string;
  author: string;
  handle: string;
}

export async function listHistory(pageId: number): Promise<HistoryRow[]> {
  const rows = await db
    .select({
      ordinal: revision.ordinal,
      createdAt: revision.createdAt,
      comment: revision.comment,
      changeKind: revision.changeKind,
      author: account.displayName,
      handle: account.handle,
    })
    .from(revision)
    .leftJoin(account, eq(account.id, revision.authorId))
    .where(eq(revision.pageId, pageId))
    .orderBy(desc(revision.ordinal));

  return rows.map((r) => ({
    ordinal: r.ordinal,
    createdAt: new Date(r.createdAt).toISOString(),
    comment: r.comment,
    changeKind: r.changeKind,
    author: r.author ?? '',
    handle: r.handle ?? '',
  }));
}

export async function getSource(pageId: number, ordinal: number | null): Promise<string> {
  const where =
    ordinal == null
      ? eq(revision.pageId, pageId)
      : and(eq(revision.pageId, pageId), eq(revision.ordinal, ordinal));
  const rows = await db
    .select({ source: revision.source })
    .from(revision)
    .where(where)
    .orderBy(desc(revision.ordinal))
    .limit(1);
  return rows[0]?.source ?? '';
}

export async function getRendered(pageId: number, ordinal: number): Promise<string> {
  const rows = await db
    .select({ html: revision.renderedHtml })
    .from(revision)
    .where(and(eq(revision.pageId, pageId), eq(revision.ordinal, ordinal)))
    .limit(1);
  return rows[0]?.html ?? '';
}

export interface AuthorRow {
  author: string;
  handle: string;
  revisions: number;
  firstAt: string;
  lastAt: string;
}

export async function listAuthors(pageId: number): Promise<AuthorRow[]> {
  const rows = await db
    .select({
      author: account.displayName,
      handle: account.handle,
      revisions: count(revision.id),
      firstAt: min(revision.createdAt),
      lastAt: max(revision.createdAt),
    })
    .from(revision)
    .leftJoin(account, eq(account.id, revision.authorId))
    .where(eq(revision.pageId, pageId))
    .groupBy(account.displayName, account.handle)
    .orderBy(desc(count(revision.id)));

  return rows.map((r) => ({
    author: r.author ?? '（匿名）',
    handle: r.handle ?? '',
    revisions: Number(r.revisions),
    firstAt: r.firstAt ? new Date(r.firstAt).toISOString() : '',
    lastAt: r.lastAt ? new Date(r.lastAt).toISOString() : '',
  }));
}

export async function getRating(pageId: number) {
  const rows = await db
    .select({
      up: sql<number>`coalesce(sum(case when ${vote.value} > 0 then 1 else 0 end), 0)::int`,
      down: sql<number>`coalesce(sum(case when ${vote.value} < 0 then 1 else 0 end), 0)::int`,
      score: sql<number>`coalesce(sum(${vote.value}), 0)::int`,
    })
    .from(vote)
    .where(eq(vote.pageId, pageId));
  const r = rows[0] ?? { up: 0, down: 0, score: 0 };
  return { up: Number(r.up), down: Number(r.down), score: Number(r.score) };
}

export interface VoterRow {
  name: string;
  handle: string;
  value: number;
  createdAt: string;
}

export async function listVoters(pageId: number): Promise<VoterRow[]> {
  const rows = await db
    .select({ name: account.displayName, handle: account.handle, value: vote.value, createdAt: vote.createdAt })
    .from(vote)
    .leftJoin(account, eq(account.id, vote.accountId))
    .where(eq(vote.pageId, pageId))
    .orderBy(desc(vote.createdAt));
  return rows.map((r) => ({
    name: r.name ?? '（匿名）',
    handle: r.handle ?? '',
    value: r.value,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export async function countComments(pageId: number): Promise<number> {
  const rows = await db.select({ n: count(comment.id) }).from(comment).where(eq(comment.pageId, pageId));
  return Number(rows[0]?.n ?? 0);
}

export interface CommentNode {
  id: number;
  author: string;
  handle: string;
  body: string;
  createdAt: string;
  replyToName: string | null;
  replies: CommentNode[];
}

export async function listComments(pageId: number): Promise<CommentNode[]> {
  const rows = await db
    .select({
      id: comment.id,
      parentId: comment.parentId,
      replyToName: comment.replyToName,
      author: account.displayName,
      handle: account.handle,
      body: comment.body,
      createdAt: comment.createdAt,
    })
    .from(comment)
    .leftJoin(account, eq(account.id, comment.accountId))
    .where(eq(comment.pageId, pageId))
    .orderBy(asc(comment.createdAt));

  const nodes = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const r of rows) {
    nodes.set(r.id, {
      id: r.id,
      author: r.author ?? '（匿名）',
      handle: r.handle ?? '',
      body: r.body,
      createdAt: new Date(r.createdAt).toISOString(),
      replyToName: r.replyToName,
      replies: [],
    });
  }
  for (const r of rows) {
    const node = nodes.get(r.id)!;
    const parent = r.parentId != null ? nodes.get(r.parentId) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

