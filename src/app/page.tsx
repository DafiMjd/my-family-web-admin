'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasToken } from '@/lib/auth-storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasToken()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
