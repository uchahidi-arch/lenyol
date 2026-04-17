'use client';

import { useState, createContext, useContext } from 'react';
import AppHeader from '@/components/app/AppHeader';
import NotifPanel from '@/components/app/NotifPanel';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';

export const RegistreSearchCtx = createContext<{ searchQ: string }>({ searchQ: '' });
export function useRegistreSearch() { return useContext(RegistreSearchCtx); }

export default function RegistreLayout({ children }: { children: React.ReactNode }) {
  const [authOpen,   setAuthOpen]   = useState(false);
  const [authTab,    setAuthTab]    = useState<'login' | 'signup'>('login');
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [searchQ,    setSearchQ]    = useState('');

  return (
    <RegistreSearchCtx.Provider value={{ searchQ }}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toast />
      <AppHeader
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
        notifCount={notifCount}
        onToggleNotifs={() => setNotifsOpen(v => !v)}
        onSearch={setSearchQ}
      />
      <div className="app-main" style={{ position: 'relative' }}>
        {children}
      </div>
      <footer className="app-footer">
        <div>© {new Date().getFullYear()} Tous droits réservés.</div>
        <div className="app-footer-right">Pensé &amp; Développé par <span>U-DATA</span></div>
      </footer>
      <NotifPanel open={notifsOpen} onClose={() => setNotifsOpen(false)} onCountChange={setNotifCount} />
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
    </RegistreSearchCtx.Provider>
  );
}
