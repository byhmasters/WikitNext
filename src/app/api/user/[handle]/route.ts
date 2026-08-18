import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account, comment, page, pageAuthor, revision } from '@/lib/db/schema';
import { displayFullname, pagePath } from '@/lib/wikit/names';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  const acct = (
    await db
      .select()
      .from(account)
      .where(sql`lower(${account.handle}) = lower(${handle})`)
      .limit(1)
  )[0];
  if (!acct) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const pages = await db
    .select({ category: page.category, name: page.name, title: page.title })
    .from(pageAuthor)
    .innerJoin(page, eq(pageAuthor.pageId, page.id))
    .where(eq(pageAuthor.accountId, acct.id))
    .orderBy(desc(page.createdAt));

  const comments = await db
    .select({
      body: comment.body,
      createdAt: comment.createdAt,
      category: page.category,
      name: page.name,
      title: page.title,
    })
    .from(comment)
    .innerJoin(page, eq(comment.pageId, page.id))
    .where(eq(comment.accountId, acct.id))
    .orderBy(desc(comment.createdAt))
    .limit(50);

  const edits = await db
    .select({
      ordinal: revision.ordinal,
      changeKind: revision.changeKind,
      comment: revision.comment,
      createdAt: revision.createdAt,
      category: page.category,
      name: page.name,
      title: page.title,
    })
    .from(revision)
    .innerJoin(page, eq(revision.pageId, page.id))
    .where(eq(revision.authorId, acct.id))
    .orderBy(desc(revision.createdAt))
    .limit(50);

  return NextResponse.json({
    handle: acct.handle,
    displayName: acct.displayName || acct.handle,
    gender: acct.gender,
    website: acct.website,
    bio: acct.bio,
    createdAt: acct.createdAt,
    pages: pages.map((p) => ({
      title: p.title || displayFullname({ category: p.category, name: p.name }),
      path: pagePath({ category: p.category, name: p.name }),
    })),
    comments: comments.map((c) => ({
      body: c.body,
      createdAt: c.createdAt,
      pageTitle: c.title || displayFullname({ category: c.category, name: c.name }),
      pagePath: pagePath({ category: c.category, name: c.name }),
    })),
    edits: edits.map((e) => ({
      ordinal: e.ordinal,
      changeKind: e.changeKind,
      comment: e.comment,
      createdAt: e.createdAt,
      pageTitle: e.title || displayFullname({ category: e.category, name: e.name }),
      pagePath: pagePath({ category: e.category, name: e.name }),
    })),
  });
}
