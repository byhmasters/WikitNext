import {
  PageInfo,
  WikitextSettings,
  parse,
  preprocess,
  render_html,
  tokenize,
} from '@/lib/ftml/ftml.js';
import { ensureFtml } from './ftml-init';
import { formatHtml } from './format-html';
import { DEFAULT_CATEGORY, type PageRef } from './names';

export interface Backlinks {
  included_pages: unknown[];
  internal_links: unknown[];
  external_links: string[];
}

export interface RenderResult {
  body: string;
  meta: unknown[];
  backlinks: Backlinks;
}

export interface RenderContext {
  ref: PageRef;
  site: string;
  title: string;
  tags?: string[];
}

// 'nav' uses ftml's draft mode: like page but without true element ids, so nav
// fragments embedded next to the main page don't collide on ids. ftml's real
// PageNav mode isn't reachable through from_mode.
export type RenderMode = 'page' | 'nav';

interface WdUser {
  name: string;
  avatar: boolean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ftml doesn't know [[wduser]]/[[*wduser]]; pull them out before tokenizing and
// swap in a plain alphanumeric token that passes through ftml untouched, then
// paint the real markup back in after render.
function extractWdUsers(source: string): { text: string; users: WdUser[] } {
  const users: WdUser[] = [];
  const text = source.replace(/\[\[(\*?)wduser\s+([^\]]+?)\s*\]\]/gi, (_m, star: string, name: string) => {
    const i = users.length;
    users.push({ name: name.trim(), avatar: star === '*' });
    return `zZwduZz${i}zZ`;
  });
  return { text, users };
}

function injectWdUsers(html: string, users: WdUser[]): string {
  if (!users.length) return html;
  return html.replace(/zZwduZz(\d+)zZ/g, (_m, idx: string) => {
    const u = users[Number(idx)];
    if (!u) return '';
    const href = `https://www.wikidot.com/user:info/${encodeURIComponent(u.name)}`;
    const label = escapeHtml(u.name);
    const cls = u.avatar ? 'printuser avatarhover' : 'printuser';
    return `<span class="${cls}"><a href="${href}" target="_blank" rel="noopener">${label}</a></span>`;
  });
}

// FTML adds the crossorigin attribute to <img> elements. As a result, 
// images hosted on servers without the appropriate CORS headers fail to load.

function stripImgCrossOrigin(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) =>
    tag.replace(/\s+crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?/gi, ''),
  );
}

export async function renderWikitext(
  source: string,
  ctx: RenderContext,
  mode: RenderMode = 'page',
): Promise<RenderResult> {
  await ensureFtml();

  const settings = WikitextSettings.from_mode(mode === 'nav' ? 'draft' : 'page', 'wikidot');
  const info = new PageInfo({
    page: ctx.ref.name,
    category: ctx.ref.category === DEFAULT_CATEGORY ? null : ctx.ref.category,
    site: ctx.site,
    title: ctx.title,
    'alt-title': null,
    score: 0,
    tags: ctx.tags ?? [],
    language: 'default',
  });

  const { text: wdText, users } = extractWdUsers(source);
  const text = preprocess(wdText);
  const tokens = tokenize(text);
  // parse and render_html consume PageInfo/Settings by value, so hand them copies
  const outcome = parse(tokens, info.copy(), settings.copy());
  const tree = outcome.syntax_tree();
  const out = render_html(tree, info.copy(), settings.copy());

  return {
    body: formatHtml(stripImgCrossOrigin(injectWdUsers(out.body(), users))),
    meta: (out.html_meta() as unknown[]) ?? [],
    backlinks: out.backlinks() as Backlinks,
  };
}
