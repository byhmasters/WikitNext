import { parseFullname, type PageRef } from './names';

export type PageAction = 'view' | 'edit' | 'history' | 'source';

export interface RoutedPath {
  ref: PageRef;
  options: Record<string, string | null>;
  action: PageAction;
}

// path grammar: /<fullname>[/<key>/<value>]... — trailing segments are read in
// pairs; a lone final key gets a null value; keys are lowercased. Next already
// url-decodes the slug segments.
export function parsePagePath(segments: string[] | undefined, homePage: string): RoutedPath {
  // Next hands catch-all segments still percent-encoded (e.g. `nav%3Aside`), so
  // decode each one before parsing or the `:` category separator is lost.
  const parts = (segments ?? []).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const rawName = (parts[0] ?? '').trim();
  const ref = parseFullname(rawName || homePage);

  const options: Record<string, string | null> = {};
  for (let i = 1; i < parts.length; i += 2) {
    const key = (parts[i] ?? '').toLowerCase();
    const value = i + 1 < parts.length ? parts[i + 1] : null;
    if (key || value) options[key] = value;
  }

  let action: PageAction = 'view';
  if ('edit' in options) action = 'edit';
  else if ('history' in options) action = 'history';
  else if ('source' in options) action = 'source';

  return { ref, options, action };
}
