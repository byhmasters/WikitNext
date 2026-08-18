'use client';

import { useEffect, useState } from 'react';
import { UserCard } from './UserCard';

export function UserCardHost() {
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    const onCard = (e: Event) => {
      const detail = (e as CustomEvent<{ handle?: string }>).detail;
      if (detail?.handle) setHandle(detail.handle);
    };
    window.addEventListener('wkt:usercard', onCard);
    return () => window.removeEventListener('wkt:usercard', onCard);
  }, []);

  if (!handle) return null;
  return <UserCard handle={handle} onClose={() => setHandle(null)} />;
}
