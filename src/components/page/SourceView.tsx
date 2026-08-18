'use client';

import { useEffect, useState } from 'react';

interface SourceViewProps {
  pageId: number;
  ordinal?: number | null;
  onClose: () => void;
}

export function SourceView({ pageId, ordinal = null, onClose }: SourceViewProps) {
  const [source, setSource] = useState('加载中…');

  useEffect(() => {
    let active = true;
    const url = `/api/page/${pageId}/source${ordinal != null ? `?ordinal=${ordinal}` : ''}`;
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (active) setSource(d.source ?? '');
      });
    return () => {
      active = false;
    };
  }, [pageId, ordinal]);

  return (
    <>
      <a className="action-area-close btn btn-default" href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>
        关闭
      </a>
      <h1>页面源代码{ordinal != null ? `（版本 #${ordinal}）` : ''}</h1>
      <div className="page-source">
        <pre className="wkt-source">{source}</pre>
      </div>
    </>
  );
}
