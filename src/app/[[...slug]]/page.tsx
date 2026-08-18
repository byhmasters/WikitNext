import { Shell } from '@/components/chrome/Shell';
import { PageOptions } from '@/components/page/PageOptions';
import { CreatePagePanel } from '@/components/page/CreatePagePanel';
import { getPageWithHead, getSite, renderNav } from '@/lib/wikit/pages';
import { countComments, getRating } from '@/lib/wikit/revisions';
import { markMissingLinks } from '@/lib/wikit/links';
import { splitBodyStyles } from '@/lib/wikit/split-style';
import { displayFullname, pagePath } from '@/lib/wikit/names';
import { parsePagePath } from '@/lib/wikit/route';
import { getCurrentAccount } from '@/lib/auth/session';
import { canEdit, canManagePage, isMember } from '@/lib/auth/perms';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;

  const site = await getSite();
  const siteSlug = site?.slug ?? 'wikit';
  const { ref, action } = parsePagePath(slug, site?.homePage ?? 'main');
  const basePath = pagePath(ref);

  const [navTopHtml, navSideHtml, withHead] = await Promise.all([
    renderNav('nav:top', siteSlug),
    renderNav('nav:side', siteSlug),
    getPageWithHead(ref),
  ]);

  const hasPage = !!withHead?.head;
  // show the page's own title (may be empty); only fall back to the name when the page doesn't exist
  const title = hasPage ? (withHead!.page.title ?? '') : displayFullname(ref);

  const [rating, commentCount] = hasPage
    ? await Promise.all([getRating(withHead!.page.id), countComments(withHead!.page.id)])
    : [{ score: 0, up: 0, down: 0 }, 0];

  const me = await getCurrentAccount();
  const perms = {
    canEdit: hasPage ? canEdit(me, withHead!.page) : isMember(me),
    canManage: hasPage ? await canManagePage(me, withHead!.page.id) : false,
    canContribute: isMember(me),
  };

  let content: React.ReactNode;
  let pageInfo: string | null = null;
  if (hasPage) {
    const marked = await markMissingLinks(withHead!.head!.renderedHtml);
    // 抽出 module CSS，交给 React 提升进 <head>，避免首帧样式没套上闪一下
    const { body, styles } = splitBodyStyles(marked);
    content = (
      <>
        {styles.map((css, i) => (
          <style key={i} href={`page-module-css-${i}`} precedence="wkt-page">
            {css}
          </style>
        ))}
        <div id="page-content" dangerouslySetInnerHTML={{ __html: body }} />
      </>
    );
    pageInfo = `页面版本: ${withHead!.head!.ordinal}，最后编辑于 ${new Date(
      withHead!.head!.createdAt,
    ).toLocaleString()}`;
  } else {
    content = (
      <div id="page-content">
        <CreatePagePanel category={ref.category} name={ref.name} title={title} basePath={basePath} canCreate={perms.canContribute} />
      </div>
    );
  }

  return (
    <Shell
      siteTitle={site?.title ?? 'WikitNext'}
      siteHeadline={site?.headline ?? ''}
      navTopHtml={navTopHtml}
      navSideHtml={navSideHtml}
      title={title}
      tags={hasPage ? withHead!.page.tags : undefined}
      pageInfo={pageInfo}
      tools={
        hasPage ? (
          <PageOptions
            pageId={withHead!.page.id}
            category={ref.category}
            name={ref.name}
            basePath={basePath}
            hasPage={hasPage}
            locked={withHead?.page.locked ?? false}
            title={withHead?.page.title ?? ''}
            source={withHead?.head?.source ?? ''}
            tags={withHead?.page.tags ?? []}
            score={rating.score}
            voteCount={rating.up + rating.down}
            commentCount={commentCount}
            initialAction={action}
            canEdit={perms.canEdit}
            canManage={perms.canManage}
            canContribute={perms.canContribute}
          />
        ) : undefined
      }
    >
      {content}
    </Shell>
  );
}
