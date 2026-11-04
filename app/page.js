'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppProvider';
import { FullScreenLoader } from '@/components/ui';

export default function RootPage() {
  const { ready, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [ready, user, router]);

  return <FullScreenLoader label="Preparing StockSense AI…" />;
}
