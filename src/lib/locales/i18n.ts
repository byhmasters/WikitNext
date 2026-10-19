import zhHans from './zh-hans.json';
import zhHant from './zh-hant.json';
import yue from './yue.json';
import nan from './nan.json';
import lzh from './lzh.json';
import enUS from './en-us.json';

export type Locale = 'zh-hans' | 'zh-hant' | 'yue' | 'nan' | 'lzh' | 'en-us';

export type Dictionary = typeof zhHans;

const dictionaries: Record<Locale, Dictionary> = {
  'zh-hans': zhHans,
  'zh-hant': zhHant,
  'yue': yue,
  'nan': nan,
  'lzh': lzh,
  'en-us': enUS,
};

export async function getDictionary(locale: Locale = 'zh-hans'): Promise<Dictionary> {
  return dictionaries[locale] || dictionaries['zh-hans'];
}

export function format(template: string, vars?: Record<string, string | number>): string {
  let text = template;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}
