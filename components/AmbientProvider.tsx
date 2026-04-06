'use client';

import { useEffect } from 'react';
import { useSettings } from '@/lib/store/settings';

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const ambientMode = useSettings((s) => s.ambientMode);

  useEffect(() => {
    document.body.setAttribute('data-ambient', String(ambientMode));
  }, [ambientMode]);

  return <>{children}</>;
}
