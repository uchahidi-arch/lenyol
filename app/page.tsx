'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeNav from '@/components/home/HomeNav';
import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import Features from '@/components/home/Features';
import GriotSection from '@/components/home/GriotSection';
import Contribution from '@/components/home/Contribution';
import HomeFooter from '@/components/home/HomeFooter';
import AuthModal from '@/components/auth/AuthModal';

export default function HomePage() {
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
      <Hero onNavigateToApp={goToApp} onOpenAuth={openAuth} />
      <StatsBar />
      <Features />
      <GriotSection />
      <Contribution onOpenAuth={openAuth} />
      <HomeFooter />
      <AuthModal open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </>
  );
}
