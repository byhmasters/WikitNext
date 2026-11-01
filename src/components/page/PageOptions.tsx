'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { EditorView } from './EditorView';
import { HistoryView } from './HistoryView';
import { SourceView } from './SourceView';
import { DiscussView, RatingView, TagsView } from './panels';
import { ConfirmDialog } from '@/components/chrome/Dialog';
import { deletePage, renamePage, toggleLock } from '@/lib/actions/page-admin';
import { displayFullname } from '@/lib/wikit/names';
import type { PageAction } from '@/lib/wikit/route';

type SubView = 'edit' | 'history' | 'source' | 'tags' | 'rating' | 'discuss';
type Dialog = 'lock' | 'rename' | 'delete';

interface PageOptionsProps {
  pageId: number | null;
  category: string;
  name: string;
  basePath: string;
  hasPage: boolean;
  locked: boolean;
  title: string;
  source: string;
  tags: string[];
  score: number;
  voteCount: number;
  commentCount: number;
  initialAction: PageAction;
  canEdit: boolean;
  canManage: boolean;
  canContribute: boolean;
}

export function PageOptions(props: PageOptionsProps & { dict: import('@/lib/locales/i18n').Dictionary }) {
  const [subView, setSubView] = useState<SubView | null>(
    props.initialAction === 'edit' && props.canEdit ? 'edit' : null,
  );
  const [extOpen, setExtOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const openedFromUrl = pathname !== props.basePath;
  const pid = props.pageId;

  const toggle = (v: SubView) => (e: React.MouseEvent) => {
    e.preventDefault();
    setSubView((cur) => (cur === v ? null : v));
  };

  function closeEditor() {
    setSubView(null);
    if (openedFromUrl) router.push(props.basePath);
  }
  function afterSave() {
    setSubView(null);
    if (openedFromUrl) router.push(props.basePath);
    else router.refresh();
  }

  function doLock() {
    setDialog(null);
    if (pid == null) return;
    startTransition(async () => {
      await toggleLock(pid);
      router.refresh();
    });
  }
  function doRename() {
    if (pid == null) return;
    const value = renameValue.trim();
    if (!value) return;
    setDialog(null);
    startTransition(async () => {
      const res = await renamePage(pid, value);
      if (res.ok) {
        router.push(res.path);
        router.refresh();
      }
    });
  }
  function doDelete() {
    setDialog(null);
    if (pid == null) return;
    startTransition(async () => {
      const res = await deletePage(pid);
      router.push(res.path);
      router.refresh();
    });
  }

  const close = () => setSubView(null);

  const ratingLabel = props.voteCount > 0 ? `${props.dict.page.rating}(${props.score >= 0 ? '+' : ''}${props.score})` : props.dict.page.rating;
  const discussLabel = props.commentCount > 0 ? `${props.dict.page.discuss}(${props.commentCount})` : props.dict.page.discuss;

  return (
    <>
      <div id="page-options-bottom" className="page-options-bottom">
        {props.canEdit ? (
          <a id="edit-button" className="btn btn-default" href="#" onClick={toggle('edit')}>
            {props.hasPage ? props.dict.page.edit : props.dict.page.createAction}
          </a>
        ) : null}
        {props.hasPage ? (
          <>
            <a id="pagerate-button" className="btn btn-default" href="#" onClick={toggle('rating')}>
              {ratingLabel}
            </a>
            <a id="tags-button" className="btn btn-default" href="#" onClick={toggle('tags')}>
              {props.dict.page.tags}
            </a>
            <a id="discuss-button" className="btn btn-default" href="#" onClick={toggle('discuss')}>
              {discussLabel}
            </a>
            <a id="history-button" className="btn btn-default" href="#" onClick={toggle('history')}>
              {props.dict.page.history}
            </a>
          </>
        ) : null}
        <a id="more-options-button" className="btn btn-default" href="#" onClick={(e) => { e.preventDefault(); setExtOpen((v) => !v); }}>
          {extOpen ? '-' : '+'}&nbsp;{props.dict.page.options}
        </a>
      </div>

      {extOpen && props.hasPage ? (
        <div id="page-options-bottom-2" className="page-options-bottom form-actions">
          <a id="view-source-button" className="btn btn-default" href="#" onClick={toggle('source')}>
            {props.dict.page.source}
          </a>
          {props.canManage ? (
            <>
              <a
                id="page-block-button"
                className="btn btn-default"
                href="#"
                onClick={(e) => { e.preventDefault(); setDialog('lock'); }}
              >
                {props.locked ? props.dict.page.unlock : props.dict.page.lock}
              </a>
              <a
                id="rename-move-button"
                className="btn btn-default"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setRenameValue(displayFullname({ category: props.category, name: props.name }));
                  setDialog('rename');
                }}
              >
                {props.dict.page.rename}
              </a>
              <a
                id="delete-button"
                className="btn btn-default"
                href="#"
                onClick={(e) => { e.preventDefault(); setDialog('delete'); }}
              >
                {props.dict.page.delete}
              </a>
            </>
          ) : null}
        </div>
      ) : null}

      <div id="action-area">
        {subView === 'edit' ? (
          <EditorView
            category={props.category}
            name={props.name}
            title={props.title}
            source={props.source}
            isNew={!props.hasPage}
            onCancel={closeEditor}
            onSaved={afterSave}
            dict={props.dict}
          />
        ) : null}
        {subView === 'history' && pid != null ? <HistoryView pageId={pid} onClose={close} dict={props.dict} /> : null}
        {subView === 'source' && pid != null ? <SourceView pageId={pid} onClose={close} dict={props.dict} /> : null}
        {subView === 'tags' && pid != null ? <TagsView pageId={pid} tags={props.tags} onClose={close} dict={props.dict} /> : null}
        {subView === 'rating' && pid != null ? <RatingView pageId={pid} onClose={close} dict={props.dict} /> : null}
        {subView === 'discuss' && pid != null ? <DiscussView pageId={pid} onClose={close} dict={props.dict} /> : null}
      </div>

      {dialog === 'lock' ? (
        <ConfirmDialog
          title={props.locked ? props.dict.page.unlock : props.dict.page.lock}
          message={props.locked ? props.dict.page.unlockMsg : props.dict.page.lockMsg}
          confirmLabel={props.locked ? props.dict.page.unlock : props.dict.page.lock}
          onConfirm={doLock}
          onCancel={() => setDialog(null)}
          dict={props.dict}
        />
      ) : null}

      {dialog === 'rename' ? (
        <ConfirmDialog
          title={props.dict.page.rename}
          message={
            <>
              <p>{props.dict.page.renameMsg || '输入新的完整名称（分类:名称）：'}</p>
              <input
                className="wt-wide-input"
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doRename(); }}
              />
            </>
          }
          confirmLabel={props.dict.page.rename}
          onConfirm={doRename}
          onCancel={() => setDialog(null)}
          dict={props.dict}
        />
      ) : null}

      {dialog === 'delete' ? (
        <ConfirmDialog
          title={props.dict.page.delete}
          message={props.dict.page.deleteMsg}
          confirmLabel={props.dict.page.delete}
          danger
          onConfirm={doDelete}
          onCancel={() => setDialog(null)}
          dict={props.dict}
        />
      ) : null}
    </>
  );
}
```

2. src/components/page/HistoryView.tsx

```tsx
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
```

3. src/components/page/panels.tsx

```tsx
'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/chrome/Dialog';
import { UserName } from '@/components/user/UserName';
import { addComment, castVote, deleteComment, setTags } from '@/lib/actions/page-admin';

function CloseLink({ onClose, dict }: { onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  return (
    <a className="action-area-close btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
      {dict.common.close}
    </a>
  );
}

export function TagsView({ pageId, tags, onClose, dict }: { pageId: number; tags: string[]; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [value, setValue] = useState(tags.join(' '));
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    start(async () => {
      await setTags(pageId, value.split(/\s+/).filter(Boolean));
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <CloseLink onClose={onClose} dict={dict} />
      <h1>{dict.panels.tagsTitle}</h1>
      <p>{dict.panels.tagsHint}</p>
      <input className="wt-wide-input" type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={dict.panels.tagsPlaceholder} />
      <div className="buttons alignleft">
        <input className="btn btn-primary" type="button" value={pending ? dict.common.saving : dict.common.save} onClick={save} disabled={pending} />
      </div>
    </>
  );
}

interface Voter {
  name: string;
  handle: string;
  value: number;
  createdAt: string;
}

export function RatingView({ pageId, onClose, dict }: { pageId: number; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [data, setData] = useState<{ score: number; up: number; down: number; voters: Voter[] } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const load = useCallback(
    () =>
      fetch(`/api/page/${pageId}/rating`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => setData({ score: d.score, up: d.up, down: d.down, voters: d.voters ?? [] })),
    [pageId],
  );

  useEffect(() => {
    load();
  }, [load]);

  function vote(value: number) {
    start(async () => {
      await castVote(pageId, value);
      await load();
      router.refresh();
    });
  }

  return (
    <>
      <CloseLink onClose={onClose} dict={dict} />
      <h1>{dict.panels.ratingTitle}</h1>
      {data ? (
        <>
          <p className="wt-rating">
            {dict.panels.ratingScore} <strong>{data.score >= 0 ? `+${data.score}` : data.score}</strong>（+{data.up} / −{data.down}）
          </p>
          <div className="buttons alignleft">
            <input className="btn btn-default" type="button" value={dict.panels.voteUp} onClick={() => vote(1)} disabled={pending} />
            <input className="btn btn-default" type="button" value={dict.panels.voteDown} onClick={() => vote(-1)} disabled={pending} />
            <input className="btn btn-default" type="button" value={dict.panels.voteCancel} onClick={() => vote(0)} disabled={pending} />
          </div>
          {data.voters.length > 0 ? (
            <table className="wt-simple-table wt-voters">
              <tbody>
                <tr>
                  <td>{dict.panels.voterUser}</td>
                  <td>{dict.panels.voterVote}</td>
                  <td>{dict.panels.voterTime}</td>
                </tr>
                {data.voters.map((v, i) => (
                  <tr key={i}>
                    <td><UserName name={v.name} handle={v.handle} /></td>
                    <td>{v.value > 0 ? dict.panels.voteUp : dict.panels.voteDown}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>{dict.panels.noVotes}</p>
          )}
        </>
      ) : (
        <p>{dict.common.loading}</p>
      )}
    </>
  );
}

interface CommentNode {
  id: number;
  author: string;
  handle: string;
  body: string;
  createdAt: string;
  replyToName: string | null;
  replies: CommentNode[];
}

export function DiscussView({ pageId, onClose, dict }: { pageId: number; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [roots, setRoots] = useState<CommentNode[] | null>(null);
  const [body, setBody] = useState('');
  const [reply, setReply] = useState<{ id: number; parentId: number; replyToName: string | null } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; hasReplies: boolean } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const load = useCallback(
    () =>
      fetch(`/api/page/${pageId}/comments`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => setRoots(d.comments ?? [])),
    [pageId],
  );

  useEffect(() => {
    load();
  }, [load]);

  function post() {
    start(async () => {
      await addComment(pageId, body);
      setBody('');
      await load();
      router.refresh();
    });
  }
  function sendReply() {
    if (!reply) return;
    start(async () => {
      await addComment(pageId, replyText, reply.parentId, reply.replyToName);
      setReply(null);
      setReplyText('');
      await load();
      router.refresh();
    });
  }
  function doRemove(id: number) {
    setConfirmDelete(null);
    start(async () => {
      await deleteComment(id);
      await load();
      router.refresh();
    });
  }

  const renderPost = (c: CommentNode, replyCtx: { parentId: number; replyToName: string | null }, isReply: boolean) => (
    <div className={isReply ? 'wt-post wt-reply' : 'wt-post'} key={c.id}>
      <div className="wt-post-meta">
        {c.replyToName ? <span className="wt-re">re: {c.replyToName}</span> : null}
        <strong><UserName name={c.author} handle={c.handle} /></strong> · {new Date(c.createdAt).toLocaleString()}
      </div>
      <div className="wt-post-body">{c.body}</div>
      <div className="wt-post-actions">
        <a href="#" onClick={(e) => { e.preventDefault(); setReply({ id: c.id, ...replyCtx }); setReplyText(''); }}>{dict.panels.reply}</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setConfirmDelete({ id: c.id, hasReplies: c.replies.length > 0 }); }}>{dict.common.delete}</a>
      </div>
      {reply?.id === c.id ? (
        <div className="wt-reply-box">
          <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={dict.panels.replyPlaceholder} />
          <div className="buttons alignleft">
            <input className="btn btn-primary" type="button" value={dict.panels.post} onClick={sendReply} disabled={pending || !replyText.trim()} />
            <input className="btn btn-default" type="button" value={dict.common.cancel} onClick={() => setReply(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <CloseLink onClose={onClose} dict={dict} />
      <h1>{dict.panels.discussTitle}</h1>
      {roots == null ? (
        <p>{dict.common.loading}</p>
      ) : roots.length === 0 ? (
        <p>{dict.panels.noComments}</p>
      ) : (
        <div className="wt-thread">
          {roots.map((c) => (
            <div key={c.id}>
              {renderPost(c, { parentId: c.id, replyToName: null }, false)}
              {c.replies.length > 0 ? (
                <div className="wt-replies">
                  {c.replies.map((r) => renderPost(r, { parentId: c.id, replyToName: r.author }, true))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="wt-new-comment">
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={dict.panels.commentPlaceholder} />
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="button" value={pending ? dict.panels.posting : dict.panels.post} onClick={post} disabled={pending || !body.trim()} />
        </div>
      </div>

      {confirmDelete !== null ? (
        <ConfirmDialog
          title={dict.panels.deleteCommentTitle}
          message={
            confirmDelete.hasReplies
              ? dict.panels.deleteCommentMsgReplies
              : dict.panels.deleteCommentMsg
          }
          confirmLabel={dict.common.delete}
          danger
          onConfirm={() => doRemove(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          dict={dict}
        />
      ) : null}
    </>
  );
}
```

4. src/components/user/UserCard.tsx

```tsx
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
```

5. src/app/%5Fadmin/page.tsx

```tsx
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
