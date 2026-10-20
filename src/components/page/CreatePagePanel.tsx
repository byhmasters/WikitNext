'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditorView } from './EditorView';

interface CreatePagePanelProps {
  category: string;
  name: string;
  title: string;
  basePath: string;
  canCreate: boolean;
}

export function CreatePagePanel({ category, name, title, basePath, canCreate, dict }: { category: string; name: string; title: string; basePath: string; canCreate: boolean; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <EditorView
        category={category}
        name={name}
        title={title}
        source=""
        isNew
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          router.replace(basePath);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="wkt-empty-page">
      <p>该页面尚不存在。</p>
      {canCreate ? (
        <a className="btn btn-primary" href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }}>
          创建此页面
        </a>
      ) : (
        <p className="wkt-muted">
          登录后即可创建页面。<a href="/login">登录</a>
        </p>
      )}
    </div>
  );
}
