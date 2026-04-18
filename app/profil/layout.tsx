'use client';

import { useState } from 'react';
import AppHeader from '@/components/app/AppHeader';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab,  setAuthTab]  = useState<'login' | 'signup'>('login');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toast />
      <AppHeader
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
      />
      <div className="app-main" style={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      <HomeFooter />
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
