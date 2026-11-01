'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { revertToOrdinal } from '@/lib/actions/save-page';
import { ConfirmDialog } from '@/components/chrome/Dialog';
import { UserName } from '@/components/user/UserName';
import { SourceView } from './SourceView';

interface HistoryRow {
  ordinal: number;
  createdAt: string;
  comment: string;
  changeKind: string;
  author: string;
  handle: string;
}

type Subarea = { kind: 'source'; ordinal: number } | { kind: 'version'; ordinal: number; html: string } | null;

export function HistoryView({ pageId, onClose, dict }: { pageId: number; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [entries, setEntries] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subarea, setSubarea] = useState<Subarea>(null);
  const [confirmRevert, setConfirmRevert] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/page/${pageId}/history`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.revisions ?? []);
        setLoading(false);
      });
  }, [pageId]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = entries.length ? entries[0].ordinal : -1;

  async function viewVersion(ordinal: number) {
    const res = await fetch(`/api/page/${pageId}/rendered?ordinal=${ordinal}`, { cache: 'no-store' });
    const d = await res.json();
    setSubarea({ kind: 'version', ordinal, html: d.html ?? '' });
  }

  function doRevert(ordinal: number) {
    setConfirmRevert(null);
    startTransition(async () => {
      await revertToOrdinal(pageId, ordinal);
      router.refresh();
      load();
    });
  }

  return (
    <>
      <a className="action-area-close btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
        {dict.common.close}
      </a>
      <h1>{dict.history.title}</h1>
      <div id="revision-list" className={loading ? 'loading' : ''}>
        <div className="buttons">
          <input type="button" className="btn btn-default btn-sm" value={dict.history.refresh} onClick={load} />
        </div>
        <table className="page-history">
          <tbody>
            <tr>
              <td>{dict.history.colVersion}</td>
              <td>{dict.history.colFlag}</td>
              <td>{dict.history.colAction}</td>
              <td>{dict.history.colBy}</td>
              <td>{dict.history.colDate}</td>
              <td>{dict.history.colComment}</td>
            </tr>
            {entries.map((e) => {
              const tip = dict.history.flags[e.changeKind as keyof typeof dict.history.flags] || e.changeKind;
              const letter = (e.changeKind[0] || '·').toUpperCase();
              return (
                <tr key={e.ordinal} id={`revision-row-${e.ordinal}`}>
                  <td>{e.ordinal}.</td>
                  <td>
                    <span className="spantip" title={tip}>
                      {letter}
                    </span>
                  </td>
                  <td className="optionstd">
                    <a href="#" title={dict.history.view} onClick={(ev) => { ev.preventDefault(); viewVersion(e.ordinal); }}>
                      V
                    </a>
                    <a href="#" title={dict.history.viewSource} onClick={(ev) => { ev.preventDefault(); setSubarea({ kind: 'source', ordinal: e.ordinal }); }}>
                      S
                    </a>
                    {e.ordinal !== latest ? (
                      <a href="#" title={dict.history.revert} onClick={(ev) => { ev.preventDefault(); setConfirmRevert(e.ordinal); }}>
                        R
                      </a>
                    ) : null}
                  </td>
                  <td><UserName name={e.author} handle={e.handle} /></td>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
                  <td>{e.comment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div id="history-subarea">
        {subarea?.kind === 'source' ? (
          <SourceView pageId={pageId} ordinal={subarea.ordinal} onClose={() => setSubarea(null)} dict={dict} />
        ) : null}
        {subarea?.kind === 'version' ? (
          <>
            <div className="wt-version-msg">{dict.history.viewing.replace('{ordinal}', subarea.ordinal.toString())}</div>
            <div className="page-content-version" dangerouslySetInnerHTML={{ __html: subarea.html }} />
          </>
        ) : null}
      </div>

      {confirmRevert !== null ? (
        <ConfirmDialog
          title={dict.history.revertTitle}
          message={dict.history.revertMsg.replace('{ordinal}', confirmRevert.toString())}
          confirmLabel={dict.history.revert}
          onConfirm={() => doRevert(confirmRevert)}
          onCancel={() => setConfirmRevert(null)}
          dict={dict}
        />
      ) : null}
    </>
  );
}
