import { promises as fs } from 'fs';
import path from 'path';
import defaults from '@/config/site.json';

export interface SiteTheme {
  mode: string; // 'external' | 'inline'
  css: string;
  externalUrl: string;
}

export interface SiteConfig {
  slug: string;
  title: string;
  headline: string;
  homePage: string;
  theme: SiteTheme;
}

// keep a static import so Next traces the file into the serverless bundle; the
// fs read below only overrides it when the on-disk copy is newer (local dev).
const CONFIG_PATH = path.join(process.cwd(), 'src', 'config', 'site.json');

export async function loadSiteConfig(): Promise<SiteConfig> {
  const base = defaults as SiteConfig;
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return { ...base, ...parsed, theme: { ...base.theme, ...parsed.theme } };
  } catch {
    return base;
  }
}

// Vercel's runtime filesystem is read-only, so the admin can only persist config
// changes in local dev; on Vercel the settings form is shown read-only.
export function canWriteConfig(): boolean {
  return !process.env.VERCEL;
}

export async function saveSiteConfig(cfg: SiteConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}
