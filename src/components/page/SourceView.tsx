'use client';

import { useEffect, useState } from 'react';

interface SourceViewProps {
  pageId: number;
  ordinal?: number | null;
  onClose: () => void;
}

export function SourceView({ pageId, ordinal = null, onClose, dict }: { pageId: number, ordinal?: number | null, onClose: () => void, dict: import('@/lib/locales/i18n').Dictionary }) {
  const [source, setSource] = useState('{dict.common.loading}');

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
        {dict.common.close}
      </a>
      <h1>{dict.page.source}{ordinal != null ? `（版本 #${ordinal}）` : ''}</h1>
      <div className="page-source">
        <pre className="wkt-source">{source}</pre>
      </div>
    </>
  );
}
