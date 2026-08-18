'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/auth';

export function LogoutButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        start(async () => {
          await logout();
          router.refresh();
        });
      }}
    >
      {pending ? '登出中…' : '登出'}
    </a>
  );
}
