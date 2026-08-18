import Link from 'next/link';
import { LoginStatus } from './LoginStatus';

interface ShellProps {
  siteTitle: string;
  siteHeadline: string;
  navTopHtml: string;
  navSideHtml: string;
  title: string;
  tags?: string[];
  pageInfo?: string | null;
  tools?: React.ReactNode;
  children: React.ReactNode;
}

// ids/classes below are Wikidot's; base.css + sigma9.css target them directly
export function Shell({
  siteTitle,
  siteHeadline,
  navTopHtml,
  navSideHtml,
  title,
  tags,
  pageInfo,
  tools,
  children,
}: ShellProps) {
  return (
    <div id="container-wrap-wrap">
      <div id="container-wrap">
        <div id="container" className="page">
          <div id="header">
            <h1>
              <Link href="/">
                <span>{siteTitle}</span>
              </Link>
            </h1>
            <h2>
              <span>{siteHeadline}</span>
            </h2>
            <div id="search-top-box" />
            <div id="login-status">
              <LoginStatus />
            </div>
            <div id="top-bar" dangerouslySetInnerHTML={{ __html: navTopHtml }} />
          </div>
          <div id="content-wrap">
            <div id="side-bar" dangerouslySetInnerHTML={{ __html: navSideHtml }} />
            <div id="main-content">
              <div id="action-area-top" />
              <div id="page-title">{title}</div>
              <div id="breadcrumbs" />
              {children}
              {tags && tags.length ? (
                <div className="page-tags">
                  <span>
                    {tags.map((t) => (
                      <a key={t} href={`/system:page-tags/tag/${encodeURIComponent(t)}`}>
                        {t}
                      </a>
                    ))}
                  </span>
                </div>
              ) : null}
              <div id="page-info-break" />
              <div id="page-info">{pageInfo ?? ''}</div>
              {tools}
            </div>
          </div>
          <div id="footer">WikitNext</div>
          <div id="license-area" />
        </div>
      </div>
    </div>
  );
}
