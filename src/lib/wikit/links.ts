import { hrefToFullname } from './names';
import { getExistingFullnames } from './pages';

// ftml's wasm build can't check page existence during render, so we flag red
// links here. ftml emits internal links as plain site-relative hrefs (it does
// not add a "missing" class), and the Wikidot theme styles a.newpage, so we add
// that class to links whose target page doesn't exist. We only ever add a
// class, so a missed match just leaves a link unstyled rather than breaking it.
const ANCHOR = /<a\b[^>]*?\bhref="(\/(?!\/)[^"]*)"[^>]*?>/g;

export async function markMissingLinks(body: string): Promise<string> {
  const hrefToName = new Map<string, string>();
  for (const match of body.matchAll(ANCHOR)) {
    const fullname = hrefToFullname(match[1]);
    if (fullname) hrefToName.set(match[1], fullname);
  }
  if (hrefToName.size === 0) return body;

  const existing = await getExistingFullnames([...hrefToName.values()]);

  return body.replace(ANCHOR, (whole, href: string) => {
    const fullname = hrefToName.get(href);
    if (!fullname || existing.has(fullname) || /\bnewpage\b/.test(whole)) return whole;
    if (/\bclass="/.test(whole)) {
      return whole.replace(/\bclass="([^"]*)"/, (_m, c: string) => `class="${c} newpage"`);
    }
    return whole.replace(/^<a\b/, '<a class="newpage"');
  });
}
