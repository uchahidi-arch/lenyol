'use client';

import { useState } from 'react';
import AppHeader from '@/components/app/AppHeader';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toast />
      <AppHeader
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
      />
      <div className="app-main" style={{ position: 'relative', overflowY: 'auto' }}>
        {children}
      </div>
      <footer className="app-footer">
        <div>© {new Date().getFullYear()} Tous droits réservés.</div>
        <div className="app-footer-right">Pensé &amp; Développé par <span>U-DATA</span></div>
      </footer>
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
