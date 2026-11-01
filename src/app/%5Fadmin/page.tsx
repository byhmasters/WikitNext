import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Shell } from '@/components/chrome/Shell';
import { AdminMembers } from '@/components/admin/AdminMembers';
import { AdminSiteSettings } from '@/components/admin/AdminSiteSettings';
import { db } from '@/lib/db';
import { account, page, revision } from '@/lib/db/schema';
import { getSite, renderNav } from '@/lib/wikit/pages';
import { getCurrentAccount } from '@/lib/auth/session';
import { canManageMembers, isAdmin } from '@/lib/auth/perms';
import { canWriteConfig } from '@/lib/wikit/config';
import { displayFullname, pagePath } from '@/lib/wikit/names';
import { getDictionary } from '@/lib/locales/i18n';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const me = await getCurrentAccount();
  if (!canManageMembers(me)) notFound();

  const dict = await getDictionary('zh-hans');
  const site = await getSite();
  
  const [navTopHtml, navSideHtml, recent, members] = await Promise.all([
    renderNav('nav:top', site.slug),
    renderNav('nav:side', site.slug),
    db
      .select({
        ordinal: revision.ordinal,
        changeKind: revision.changeKind,
        comment: revision.comment,
        createdAt: revision.createdAt,
        category: page.category,
        name: page.name,
        title: page.title,
        authorName: account.displayName,
        authorHandle: account.handle,
      })
      .from(revision)
      .innerJoin(page, eq(revision.pageId, page.id))
      .leftJoin(account, eq(revision.authorId, account.id))
      .orderBy(desc(revision.createdAt))
      .limit(30),
    db.select().from(account).orderBy(account.id),
  ]);

  const grant = isAdmin(me);

  return (
    <Shell
      siteTitle={site.title}
      siteHeadline={site.headline}
      navTopHtml={navTopHtml}
      navSideHtml={navSideHtml}
      title={dict.admin.title}
    >
      <div id="page-content" className="wkt-admin">
        <h2>{dict.admin.recentEdits}</h2>
        {recent.length ? (
          <table className="wt-simple-table">
            <tbody>
              <tr>
                <td>{dict.admin.colPage}</td>
                <td>{dict.admin.colVersion}</td>
                <td>{dict.admin.colType}</td>
                <td>{dict.admin.colAuthor}</td>
                <td>{dict.admin.colTime}</td>
                <td>{dict.admin.colComment}</td>
              </tr>
              {recent.map((r, i) => {
                const ref = { category: r.category, name: r.name };
                return (
                  <tr key={i}>
                    <td>
                      <a href={pagePath(ref)}>{r.title || displayFullname(ref)}</a>
                    </td>
                    <td>#{r.ordinal}</td>
                    <td>{r.changeKind}</td>
                    <td>
                      {r.authorHandle ? (
                        <span className="printuser w-user" data-wkt-user={r.authorHandle}>
                          {r.authorName || r.authorHandle}
                        </span>
                      ) : (
                        <span className="wkt-muted">—</span>
                      )}
                    </td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.comment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="wkt-muted">{dict.admin.noEdits}</p>
        )}

        <h2>{dict.admin.membersTitle}</h2>
        <AdminMembers
          members={members.map((m) => ({
            id: m.id,
            handle: m.handle,
            displayName: m.displayName,
            kind: m.kind,
            banned: m.banned,
            canManageMembers: m.canManageMembers,
            createdAt: m.createdAt.toISOString(),
          }))}
          meId={me!.id}
          canGrant={grant}
          dict={dict}
        />

        <h2>{dict.admin.siteSettings}</h2>
        {grant ? (
          <AdminSiteSettings
            writable={canWriteConfig()}
            initial={{
              title: site.title,
              headline: site.headline,
              homePage: site.homePage,
              themeMode: site.theme.mode,
              themeCss: site.theme.css,
              themeExternalUrl: site.theme.externalUrl,
            }}
            dict={dict}
          />
        ) : (
          <p className="wkt-muted">{dict.admin.siteSettingsDenied}</p>
        )}
      </div>
    </Shell>
  );
}
