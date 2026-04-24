'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import AppSidebar from '@/components/app/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';

function CapsuleLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!loading && user === null) router.replace('/');
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        <Toast />
        <HomeNav
          onNavigateToApp={() => router.push('/registre')}
          onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
        />
        <div style={{ display: 'flex', flex: 1, paddingTop: '96px' }}>
          <AppSidebar />
          <main style={{ flex: 1, minWidth: 0, '--page-left': '32px' } as React.CSSProperties}>
            {children}
          </main>
        </div>
        <HomeFooter />
        <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
      </div>
    </SidebarProvider>
  );
}

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <CapsuleLayoutInner>{children}</CapsuleLayoutInner>
    </Suspense>
  );
}
