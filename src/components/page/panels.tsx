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
