'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegistreView from '@/components/app/RegistreView';
import AuthModal from '@/components/auth/AuthModal';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { Person } from '@/lib/types';

export default function RegistrePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <>
      <RegistreView
        onShowPerson={(p: Person) => router.push(`/registre/${p.id}`)}
        onOpenAuth={openAuth}
        onRelier={(id) => {
          if (!user) { openAuth('signup'); return; }
          router.push(`/monarbre/nouveau?relatedId=${id}`);
        }}
      />
      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
      />
      <Toast />
    </>
  );
}
