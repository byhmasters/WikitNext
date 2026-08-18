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

const FLAGS: Record<string, [string, string]> = {
  new: ['N', '新页面'],
  source: ['S', '源代码更改'],
  title: ['T', '标题更改'],
  tags: ['A', '标签更改'],
  rename: ['R', '重命名'],
  revert: ['W', '还原'],
};

interface HistoryViewProps {
  pageId: number;
  onClose: () => void;
}

type Subarea = { kind: 'source'; ordinal: number } | { kind: 'version'; ordinal: number; html: string } | null;

export function HistoryView({ pageId, onClose }: HistoryViewProps) {
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
        关闭
      </a>
      <h1>页面更改历史</h1>
      <div id="revision-list" className={loading ? 'loading' : ''}>
        <div className="buttons">
          <input type="button" className="btn btn-default btn-sm" value="更新列表" onClick={load} />
        </div>
        <table className="page-history">
          <tbody>
            <tr>
              <td>版本</td>
              <td>标记</td>
              <td>操作</td>
              <td>由</td>
              <td>日期</td>
              <td>评论</td>
            </tr>
            {entries.map((e) => {
              const [letter, tip] = FLAGS[e.changeKind] ?? ['·', e.changeKind];
              return (
                <tr key={e.ordinal} id={`revision-row-${e.ordinal}`}>
                  <td>{e.ordinal}.</td>
                  <td>
                    <span className="spantip" title={tip}>
                      {letter}
                    </span>
                  </td>
                  <td className="optionstd">
                    <a href="#" title="查看此版本" onClick={(ev) => { ev.preventDefault(); viewVersion(e.ordinal); }}>
                      V
                    </a>
                    <a href="#" title="查看源代码" onClick={(ev) => { ev.preventDefault(); setSubarea({ kind: 'source', ordinal: e.ordinal }); }}>
                      S
                    </a>
                    {e.ordinal !== latest ? (
                      <a href="#" title="回退到此版本" onClick={(ev) => { ev.preventDefault(); setConfirmRevert(e.ordinal); }}>
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
          <SourceView pageId={pageId} ordinal={subarea.ordinal} onClose={() => setSubarea(null)} />
        ) : null}
        {subarea?.kind === 'version' ? (
          <>
            <div className="wt-version-msg">正在查看版本 #{subarea.ordinal}（只读预览）。</div>
            <div className="page-content-version" dangerouslySetInnerHTML={{ __html: subarea.html }} />
          </>
        ) : null}
      </div>

      {confirmRevert !== null ? (
        <ConfirmDialog
          title="回退版本"
          message={`确定回退到版本 #${confirmRevert}？这会以该版本的源代码新建一条修订。`}
          confirmLabel="回退"
          onConfirm={() => doRevert(confirmRevert)}
          onCancel={() => setConfirmRevert(null)}
        />
      ) : null}
    </>
  );
}
