'use client';

import { useState, createContext, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';

export const RegistreSearchCtx = createContext<{ searchQ: string }>({ searchQ: '' });
export function useRegistreSearch() { return useContext(RegistreSearchCtx); }

export default function RegistreLayout({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const params     = useSearchParams();
  const searchQ    = params.get('q') ?? '';
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');

  return (
    <RegistreSearchCtx.Provider value={{ searchQ }}>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9f9f7' }}>
      <Toast />
      <HomeNav
        onNavigateToApp={() => router.push('/registre')}
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
      />
      <div style={{ flex: 1, paddingTop: '72px' }}>
        {children}
      </div>
      <footer className="app-footer">
        <div>© {new Date().getFullYear()} Tous droits réservés.</div>
        <div className="app-footer-right">Pensé &amp; Développé par <span>U-DATA</span></div>
      </footer>
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
    </RegistreSearchCtx.Provider>
  );
}
