'use client';

import { Suspense, useState, createContext, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import AppSidebar, { type TimelineSidebarCbs } from '@/components/app/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';

interface TimelineCtxType {
  timelineCbs: React.RefObject<TimelineSidebarCbs | null>;
}

export const TimelineCtx = createContext<TimelineCtxType>({
  timelineCbs: { current: null },
});

export function useTimelineSidebar() { return useContext(TimelineCtx); }

function TimelineLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');
  const timelineCbs = useRef<TimelineSidebarCbs | null>(null);

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
    <TimelineCtx.Provider value={{ timelineCbs }}>
      <SidebarProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
          <Toast />
          <HomeNav
            onNavigateToApp={() => router.push('/registre')}
            onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
          />
          <div style={{ display: 'flex', flex: 1, paddingTop: '96px' }}>
            <AppSidebar timelineCbs={timelineCbs} />
            <main style={{ flex: 1, minWidth: 0, '--page-left': '32px' } as React.CSSProperties}>
              {children}
            </main>
          </div>
          <HomeFooter />
          <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
        </div>
      </SidebarProvider>
    </TimelineCtx.Provider>
  );
}

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <TimelineLayoutInner>{children}</TimelineLayoutInner>
    </Suspense>
  );
}
