'use client';

import { Suspense, useState, createContext, useContext, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import AppSidebar, { type RegistreSidebarCbs } from '@/components/app/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';

interface RegistreCtxType {
  searchQ: string;
  sidebarCbs: React.RefObject<RegistreSidebarCbs | null>;
}

export const RegistreSearchCtx = createContext<RegistreCtxType>({
  searchQ: '',
  sidebarCbs: { current: null },
});

export function useRegistreSearch() { return useContext(RegistreSearchCtx); }

function RegistreLayoutInner({ children }: { children: React.ReactNode }) {
  const router  = useRouter();
  const params  = useSearchParams();
  const searchQ = params.get('q') ?? '';
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');
  const sidebarCbs = useRef<RegistreSidebarCbs | null>(null);

  return (
    <RegistreSearchCtx.Provider value={{ searchQ, sidebarCbs }}>
      <SidebarProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9f9f7' }}>
          <Toast />
          <HomeNav
            onNavigateToApp={() => router.push('/registre')}
            onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
          />
          <div style={{ display: 'flex', flex: 1, paddingTop: '72px' }}>
            <AppSidebar registreCbs={sidebarCbs} />
            <main style={{ flex: 1, minWidth: 0, '--page-left': '32px' } as React.CSSProperties}>
              {children}
            </main>
          </div>
          <HomeFooter />
          <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
        </div>
      </SidebarProvider>
    </RegistreSearchCtx.Provider>
  );
}

export default function RegistreLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <RegistreLayoutInner>{children}</RegistreLayoutInner>
    </Suspense>
  );
}
