'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { renderWikitext } from '@/lib/wikit/render';
import { savePage } from '@/lib/actions/save-page';

interface EditorViewProps {
  category: string;
  name: string;
  title: string;
  source: string;
  isNew: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditorView({ category, name, title: initialTitle, source: initialSource, isNew, onCancel, onSaved, dict }: EditorViewProps & { dict: import('@/lib/locales/i18n').Dictionary }) {
  const [title, setTitle] = useState(initialTitle);
  const [source, setSource] = useState(initialSource);
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState('');
  const [pending, startTransition] = useTransition();
  const seq = useRef(0);

  useEffect(() => {
    const id = setTimeout(async () => {
      const mine = ++seq.current;
      try {
        const r = await renderWikitext(source, { ref: { category, name }, site: 'wikit', title }, 'page');
        if (mine === seq.current) setPreview(r.body);
      } catch {
        /* preview is best-effort */
      }
    }, 250);
    return () => clearTimeout(id);
  }, [source, title, category, name]);

  function save() {
    startTransition(async () => {
      await savePage({ category, name, title, source, comment });
      onSaved();
    });
  }

  return (
    <>
      <a className="action-area-close btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>
        {dict.common.close}
      </a>
      <h1>{isNew ? dict.editor.createTitle : dict.editor.editTitle}</h1>
      <form id="edit-page-form" onSubmit={(e) => e.preventDefault()}>
        <table className="form">
          <tbody>
            <tr>
              <td>{dict.editor.pageTitle}</td>
              <td>
                <input
                  id="edit-page-title"
                  name="title"
                  type="text"
                  size={35}
                  maxLength={128}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={pending}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div id="wd-editor-toolbar-panel" className="wd-editor-toolbar-panel" />

        <div className="editor-area wt-live">
          <textarea
            id="edit-page-textarea"
            name="source"
            rows={20}
            cols={60}
            value={source}
            spellCheck={false}
            onChange={(e) => setSource(e.target.value)}
            disabled={pending}
            placeholder={dict.editor.placeholder}
          />
          <div className="wt-editor-preview" dangerouslySetInnerHTML={{ __html: preview }} />
        </div>

        <p>{dict.editor.comment}</p>
        <textarea
          id="edit-page-comments"
          name="comment"
          rows={3}
          cols={20}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={pending}
        />

        <div className="buttons alignleft">
          <input
            id="edit-cancel-button"
            className="btn btn-danger"
            type="button"
            value={dict.common.cancel}
            onClick={onCancel}
            disabled={pending}
          />
          <input
            id="edit-save-button"
            className="btn btn-primary"
            type="button"
            value={pending ? dict.common.saving : dict.editor.save}
            onClick={save}
            disabled={pending}
          />
        </div>
      </form>
    </>
  );
}
