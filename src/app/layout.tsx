import type { Metadata } from 'next';
import './globals.css';
import { RuntimeInstaller } from '@/components/RuntimeInstaller';
import { UserCardHost } from '@/components/user/UserCardHost';
import { loadSiteConfig } from '@/lib/wikit/config';

export const metadata: Metadata = {
  title: 'WikitNext',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await loadSiteConfig();
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/base.css" precedence="wkt-base" />
        {theme.mode === 'external' && theme.externalUrl ? (
          <link rel="stylesheet" href={theme.externalUrl} precedence="wkt-theme" />
        ) : null}
        {theme.mode === 'inline' && theme.css ? (
          <style precedence="wkt-theme" href="wkt-theme-inline">
            {theme.css}
          </style>
        ) : null}
      </head>
      <body>
        {children}
        <RuntimeInstaller />
        <UserCardHost />
      </body>
    </html>
  );
}
