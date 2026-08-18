'use client';

import { useEffect } from 'react';
import { installRuntime } from '@/lib/wikit/client';

export function RuntimeInstaller() {
  useEffect(() => {
    installRuntime();
  }, []);
  return null;
}
