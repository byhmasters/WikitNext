'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface UserData {
  handle: string;
  displayName: string;
  gender: string;
  website: string;
  bio: string;
  createdAt: string;
  pages: { title: string; path: string }[];
  comments: { body: string; createdAt: string; pageTitle: string; pagePath: string }[];
  edits: {
    ordinal: number;
    changeKind: string;
    comment: string;
    createdAt: string;
    pageTitle: string;
    pagePath: string;
  }[];
}

type Tab = 'about' | 'pages' | 'edits' | 'comments';

export function UserCard({ handle, onClose, dict }: { handle: string; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [data, setData] = useState<UserData | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('about');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    fetch(`/api/user/${encodeURIComponent(handle)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => live && setData(d))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [handle]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="odialog-shader" onClick={onClose} />
      <div className="wkt-dialog-layer">
        <div className="owindow wkt-usercard" role="dialog" aria-modal="true">
          <div className="title">
            <span className="printuser w-user">{data?.displayName ?? handle}</span>
            <a className="close-button btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
              {dict.common.close}
            </a>
          </div>

          {error ? (
            <div className="content">
              <p className="wkt-muted">{dict.userCard.notFound}</p>
            </div>
          ) : !data ? (
            <div className="content">
              <p className="wkt-muted">{dict.common.loading}</p>
            </div>
          ) : (
            <div className="content">
              <div className="wkt-tabs">
                <a href="#" className={tab === 'about' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('about'); }}>
                  {dict.userCard.tabAbout}
                </a>
                <a href="#" className={tab === 'pages' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('pages'); }}>
                  {dict.userCard.tabPages.replace('{count}', data.pages.length.toString())}
                </a>
                <a href="#" className={tab === 'edits' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('edits'); }}>
                  {dict.userCard.tabEdits.replace('{count}', data.edits.length.toString())}
                </a>
                <a href="#" className={tab === 'comments' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setTab('comments'); }}>
                  {dict.userCard.tabComments.replace('{count}', data.comments.length.toString())}
                </a>
              </div>

              {tab === 'about' ? (
                <table className="wt-simple-table">
                  <tbody>
                    <tr>
                      <td>{dict.auth.username}</td>
                      <td>{data.displayName}</td>
                    </tr>
                    {data.gender ? (
                      <tr>
                        <td>{dict.auth.gender}</td>
                        <td>{data.gender}</td>
                      </tr>
                    ) : null}
                    {data.website ? (
                      <tr>
                        <td>{dict.auth.website}</td>
                        <td>
                          <a href={data.website} target="_blank" rel="noopener">
                            {data.website}
                          </a>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td>{dict.userCard.joined}</td>
                      <td>{new Date(data.createdAt).toLocaleDateString()}</td>
                    </tr>
                    {data.bio ? (
                      <tr>
                        <td>{dict.auth.bio}</td>
                        <td>{data.bio}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              ) : null}

              {tab === 'pages' ? (
                data.pages.length ? (
                  <ul className="wkt-card-list">
                    {data.pages.map((p) => (
                      <li key={p.path}>
                        <a href={p.path}>{p.title}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="wkt-muted">{dict.userCard.noPages}</p>
                )
              ) : null}

              {tab === 'edits' ? (
                data.edits.length ? (
                  <ul className="wkt-card-list">
                    {data.edits.map((e, i) => (
                      <li key={i}>
                        <div className="wkt-card-comment-meta">
                          <a href={e.pagePath}>{e.pageTitle}</a> · #{e.ordinal} · {new Date(e.createdAt).toLocaleString()}
                        </div>
                        {e.comment ? <div>{e.comment}</div> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="wkt-muted">{dict.userCard.noEdits}</p>
                )
              ) : null}

              {tab === 'comments' ? (
                data.comments.length ? (
                  <ul className="wkt-card-list">
                    {data.comments.map((c, i) => (
                      <li key={i}>
                        <div className="wkt-card-comment-meta">
                          <a href={c.pagePath}>{c.pageTitle}</a> · {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <div>{c.body}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="wkt-muted">{dict.userCard.noComments}</p>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
