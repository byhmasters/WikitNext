'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/chrome/Dialog';
import { UserName } from '@/components/user/UserName';
import { addComment, castVote, deleteComment, setTags } from '@/lib/actions/page-admin';

function CloseLink({ onClose }: { onClose: () => void }) {
  return (
    <a className="action-area-close btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
      {dict.common.close}
    </a>
  );
}

export function TagsView({ pageId, tags, onClose }: { pageId: number; tags: string[]; onClose: () => void }) {
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
      <CloseLink onClose={onClose} />
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

export function RatingView({ pageId, onClose }: { pageId: number; onClose: () => void }) {
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
      router.refresh(); // keep the option-bar score in sync
    });
  }

  return (
    <>
      <CloseLink onClose={onClose} />
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
                  <td>用户</td>
                  <td>投票</td>
                  <td>时间</td>
                </tr>
                {data.voters.map((v, i) => (
                  <tr key={i}>
                    <td><UserName name={v.name} handle={v.handle} /></td>
                    <td>{v.value > 0 ? '▲ 赞成' : '▼ 反对'}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>还没有人投票。</p>
          )}
        </>
      ) : (
        <p>加载中…</p>
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

export function DiscussView({ pageId, onClose }: { pageId: number; onClose: () => void }) {
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
      router.refresh(); // keep the option-bar count in sync
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
        <a href="#" onClick={(e) => { e.preventDefault(); setReply({ id: c.id, ...replyCtx }); setReplyText(''); }}>回复</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setConfirmDelete({ id: c.id, hasReplies: c.replies.length > 0 }); }}>删除</a>
      </div>
      {reply?.id === c.id ? (
        <div className="wt-reply-box">
          <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="回复…" />
          <div className="buttons alignleft">
            <input className="btn btn-primary" type="button" value="发表" onClick={sendReply} disabled={pending || !replyText.trim()} />
            <input className="btn btn-default" type="button" value="取消" onClick={() => setReply(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <CloseLink onClose={onClose} />
      <h1>{dict.panels.discussTitle}</h1>
      {roots == null ? (
        <p>加载中…</p>
      ) : roots.length === 0 ? (
        <p>还没有评论。</p>
      ) : (
        <div className="wt-thread">
          {roots.map((c) => (
            <div key={c.id}>
              {/* replying to a top-level comment: nests under it, no "re:" */}
              {renderPost(c, { parentId: c.id, replyToName: null }, false)}
              {c.replies.length > 0 ? (
                <div className="wt-replies">
                  {/* replying to a reply: stays at this level, prefixed "re: <that reply's author>" */}
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
          title="删除评论"
          message={
            confirmDelete.hasReplies
              ? '删除这条评论？它下面的所有回复也会一并删除。'
              : '删除这条评论？'
          }
          confirmLabel="删除"
          danger
          onConfirm={() => doRemove(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      ) : null}
    </>
  );
}
