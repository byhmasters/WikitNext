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

export function PageOptions(props: PageOptionsProps) {
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

  const ratingLabel = props.voteCount > 0 ? `评分(${props.score >= 0 ? '+' : ''}${props.score})` : '评分';
  const discussLabel = props.commentCount > 0 ? `讨论(${props.commentCount})` : '讨论';

  return (
    <>
      <div id="page-options-bottom" className="page-options-bottom">
        {props.canEdit ? (
          <a id="edit-button" className="btn btn-default" href="#" onClick={toggle('edit')}>
            {props.hasPage ? '编辑' : '创建'}
          </a>
        ) : null}
        {props.hasPage ? (
          <>
            <a id="pagerate-button" className="btn btn-default" href="#" onClick={toggle('rating')}>
              {ratingLabel}
            </a>
            <a id="tags-button" className="btn btn-default" href="#" onClick={toggle('tags')}>
              标签
            </a>
            <a id="discuss-button" className="btn btn-default" href="#" onClick={toggle('discuss')}>
              {discussLabel}
            </a>
            <a id="history-button" className="btn btn-default" href="#" onClick={toggle('history')}>
              历史记录
            </a>
          </>
        ) : null}
        <a id="more-options-button" className="btn btn-default" href="#" onClick={(e) => { e.preventDefault(); setExtOpen((v) => !v); }}>
          {extOpen ? '-' : '+'}&nbsp;选项
        </a>
      </div>

      {extOpen && props.hasPage ? (
        <div id="page-options-bottom-2" className="page-options-bottom form-actions">
          <a id="view-source-button" className="btn btn-default" href="#" onClick={toggle('source')}>
            页面源代码
          </a>
          {props.canManage ? (
            <>
              <a
                id="page-block-button"
                className="btn btn-default"
                href="#"
                onClick={(e) => { e.preventDefault(); setDialog('lock'); }}
              >
                {props.locked ? '解锁页面' : '锁定页面'}
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
                重新命名
              </a>
              <a
                id="delete-button"
                className="btn btn-default"
                href="#"
                onClick={(e) => { e.preventDefault(); setDialog('delete'); }}
              >
                删除
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
          />
        ) : null}
        {subView === 'history' && pid != null ? <HistoryView pageId={pid} onClose={close} /> : null}
        {subView === 'source' && pid != null ? <SourceView pageId={pid} onClose={close} /> : null}
        {subView === 'tags' && pid != null ? <TagsView pageId={pid} tags={props.tags} onClose={close} /> : null}
        {subView === 'rating' && pid != null ? <RatingView pageId={pid} onClose={close} /> : null}
        {subView === 'discuss' && pid != null ? <DiscussView pageId={pid} onClose={close} /> : null}
      </div>

      {dialog === 'lock' ? (
        <ConfirmDialog
          title={props.locked ? '解锁页面' : '锁定页面'}
          message={props.locked ? '解锁后所有人都可以再次编辑此页面。' : '锁定后只有管理员可以编辑此页面。'}
          confirmLabel={props.locked ? '解锁' : '锁定'}
          onConfirm={doLock}
          onCancel={() => setDialog(null)}
        />
      ) : null}

      {dialog === 'rename' ? (
        <ConfirmDialog
          title="重新命名 / 移动"
          message={
            <>
              <p>输入新的完整名称（分类:名称）：</p>
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
          confirmLabel="重命名"
          onConfirm={doRename}
          onCancel={() => setDialog(null)}
        />
      ) : null}

      {dialog === 'delete' ? (
        <ConfirmDialog
          title="删除页面"
          message="此操作会永久删除该页面及其全部历史，无法撤销。"
          confirmLabel="删除"
          danger
          onConfirm={doDelete}
          onCancel={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
