import 'dotenv/config';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { account, page, pageAuthor, revision, site, theme } from '@/lib/db/schema';
import { renderWikitext } from '@/lib/wikit/render';
import { DEFAULT_CATEGORY, normalizeSegment, type PageRef } from '@/lib/wikit/names';

const SEED_DIR = join(process.cwd(), 'seed');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.ftml')) out.push(full);
  }
  return out;
}

// seed/<category>/<name>.ftml -> {category, name}; top-level file -> _default
function refFromFile(file: string): PageRef {
  const rel = relative(SEED_DIR, file).replace(/\.ftml$/, '');
  const parts = rel.split(sep);
  const name = normalizeSegment(parts.pop()!);
  const category = parts.length ? parts.map(normalizeSegment).join(':') : DEFAULT_CATEGORY;
  return { category, name };
}

async function main() {
  await db.execute(
    sql.raw('truncate table revision, page, site, theme, account restart identity cascade'),
  );

  await db
    .insert(theme)
    .values({ name: 'Sigma-9', slug: 'sigma9', mode: 'external', externalUrl: '/sigma9.css' });
  await db
    .insert(site)
    .values({ slug: 'wikit', title: 'WikitNext', headline: 'Wikidot Replacement', homePage: 'main' });
  const [admin] = await db
    .insert(account)
    .values({ handle: 'system', displayName: '系统', kind: 'system' })
    .returning();

  for (const file of walk(SEED_DIR)) {
    const ref = refFromFile(file);
    const source = readFileSync(file, 'utf8');
    // title is the page name (from the .ftml filename), not derived from content
    const title = ref.name;
    const rendered = await renderWikitext(
      source,
      { ref, site: 'wikit', title },
      ref.category === 'nav' ? 'nav' : 'page',
    );

    const [p] = await db
      .insert(page)
      .values({ category: ref.category, name: ref.name, title })
      .returning();
    const [rev] = await db
      .insert(revision)
      .values({
        pageId: p.id,
        ordinal: 0,
        source,
        renderedHtml: rendered.body,
        meta: rendered.meta,
        backlinks: rendered.backlinks,
        comment: 'seed',
        changeKind: 'new',
        authorId: admin.id,
      })
      .returning();
    await db.update(page).set({ headRevisionId: rev.id }).where(eq(page.id, p.id));
    await db.insert(pageAuthor).values({ pageId: p.id, accountId: admin.id });
    console.log(`seeded ${ref.category}:${ref.name}`);
  }

  console.log('seed done');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
