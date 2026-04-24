'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

function CarteLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!loading && user === null) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spin" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Toast />
      <HomeNav
        onNavigateToApp={() => router.push('/registre')}
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
      />
      <main style={{ paddingTop: '96px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <CarteLayoutInner>{children}</CarteLayoutInner>
    </Suspense>
  );
}
