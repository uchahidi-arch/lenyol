'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/app/AppHeader';
import NotifPanel from '@/components/app/NotifPanel';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toast />
      <AppHeader
        onOpenAuth={(tab) => { setAuthTab(tab); setAuthOpen(true); }}
        notifCount={notifCount}
        onToggleNotifs={() => setNotifsOpen(v => !v)}
      />
      <div className="app-main" style={{ position: 'relative' }}>
        {children}
      </div>
      <footer className="app-footer">
        <Image
          src="/logo.png"
          alt="Lenyol"
          width={100}
          height={28}
          style={{ objectFit: 'contain', width: 'auto', height: '28px' }}
        />
        <div className="app-footer-right">Pensé &amp; Développé par <span>U-DATA</span></div>
      </footer>
      <NotifPanel open={notifsOpen} onClose={() => setNotifsOpen(false)} onCountChange={setNotifCount} />
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
