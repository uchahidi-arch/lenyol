'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';

export default function AboutNavWrapper() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const goToApp = () => router.push('/registre');

  return (
    <>
      <HomeNav onNavigateToApp={goToApp} onOpenAuth={openAuth} />
      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
      />
      <Toast />
    </>
  );
}
