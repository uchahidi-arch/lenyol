'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import HomeFooter from '@/components/home/HomeFooter';
import NotifPanel from '@/components/app/NotifPanel';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import AppSidebar from '@/components/app/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useDB } from '@/hooks/useDB';
import { useRealtime } from '@/hooks/useRealtime';

export default function MonarbreLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { loadMyData } = useDB();
  const router = useRouter();
  useRealtime(user?.id);

  const [authOpen,   setAuthOpen]   = useState(false);
  const [authTab,    setAuthTab]    = useState<'login' | 'signup'>('login');
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!loading && user === null) router.replace('/');
    else if (user) loadMyData();
  }, [user?.id, loading]);

  if (loading || !user) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toast />
        <HomeNav
          onNavigateToApp={() => router.push('/registre')}
          onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
        />
        <div style={{ display: 'flex', flex: 1, paddingTop: '72px' }}>
          <AppSidebar />
          <div className="app-main" style={{ position: 'relative', flex: 1, paddingBottom: '120px', overflow: 'hidden', '--page-left': '32px' } as React.CSSProperties}>
            {children}
          </div>
        </div>
        <HomeFooter />
        <NotifPanel open={notifsOpen} onClose={() => setNotifsOpen(false)} onCountChange={setNotifCount} />
        <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
      </div>
    </SidebarProvider>
  );
}
