'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import GriotSection from '@/components/home/GriotSection';
import Contribution from '@/components/home/Contribution';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
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
      <Hero onNavigateToApp={goToApp} onOpenAuth={openAuth} />
      <Features />
      <GriotSection />
      <Contribution onOpenAuth={openAuth} isLoggedIn={!!user} onGoToTree={() => router.push('/monarbre')} />
      <HomeFooter />
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </>
  );
}
