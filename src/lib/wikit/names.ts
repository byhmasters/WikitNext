export const DEFAULT_CATEGORY = '_default';

export interface PageRef {
  category: string;
  name: string;
}

export function normalizeSegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-.]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseFullname(slug: string): PageRef {
  const cleaned = slug.replace(/^\/+|\/+$/g, '');
  const idx = cleaned.indexOf(':');
  if (idx === -1) {
    return { category: DEFAULT_CATEGORY, name: normalizeSegment(cleaned) };
  }
  const category = normalizeSegment(cleaned.slice(0, idx));
  const name = normalizeSegment(cleaned.slice(idx + 1));
  return { category: category || DEFAULT_CATEGORY, name };
}

// name only for the default category, category:name otherwise
export function displayFullname(ref: PageRef): string {
  return ref.category === DEFAULT_CATEGORY ? ref.name : `${ref.category}:${ref.name}`;
}

// always category:name; matches the stored page.fullname column
export function dbFullname(ref: PageRef): string {
  return `${ref.category}:${ref.name}`;
}

export function pagePath(ref: PageRef): string {
  return `/${displayFullname(ref)}`;
}

export function refFromSlugArray(slug: string[] | undefined, homePage: string): PageRef {
  if (!slug || slug.length === 0) return parseFullname(homePage);
  return parseFullname(slug.join('/'));
}

export function hrefToFullname(href: string): string | null {
  if (!href || /^([a-z]+:)?\/\//i.test(href)) return null;
  if (/^(#|mailto:|javascript:|tel:)/i.test(href)) return null;
  const slug = href.split(/[?#]/)[0].replace(/^\/+/, '');
  if (!slug) return null;
  return dbFullname(parseFullname(slug));
}
