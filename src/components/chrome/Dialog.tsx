'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// .odialog-shader / .owindow / .button-bar are Wikidot's own dialog classes from base.css;
// centering is JS-driven in real Wikidot, so we wrap in .wkt-dialog-layer and center ourselves.
export function ConfirmDialog({
  title = '请确认',
  message,
  confirmLabel = '确定',
  cancelLabel = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="odialog-shader" onClick={onCancel} />
      <div className="wkt-dialog-layer">
        <div className="owindow" role="dialog" aria-modal="true">
          <div className="title">{title}</div>
          <div className="content">{typeof message === 'string' ? <p>{message}</p> : message}</div>
          <div className="button-bar">
            <a href="#" onClick={(e) => { e.preventDefault(); onCancel(); }}>
              {cancelLabel}
            </a>
            <a
              href="#"
              className={danger ? 'wkt-dialog-danger' : ''}
              onClick={(e) => { e.preventDefault(); onConfirm(); }}
            >
              {confirmLabel}
            </a>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
