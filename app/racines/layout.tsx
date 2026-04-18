'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import HomeFooter from '@/components/home/HomeFooter';
import AppSidebar, { type RacinesFilterCbs } from '@/components/app/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';

interface RacinesCtxType {
  categorie: string;
  setCategorie: (v: string) => void;
}

const RacinesCtx = createContext<RacinesCtxType>({ categorie: 'Tous', setCategorie: () => {} });

export function useRacinesFilter() { return useContext(RacinesCtx); }

export default function RacinesLayout({ children }: { children: ReactNode }) {
  const [categorie, setCategorie] = useState('Tous');
  const racinesCbs: RacinesFilterCbs = { categorie, setCategorie };

  return (
    <RacinesCtx.Provider value={{ categorie, setCategorie }}>
      <SidebarProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AboutNavWrapper />
          <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
            <AppSidebar racinesCbs={racinesCbs} />
            <main style={{ flex: 1, minWidth: 0, '--page-left': '32px' } as React.CSSProperties}>
              {children}
            </main>
          </div>
          <HomeFooter />
        </div>
      </SidebarProvider>
    </RacinesCtx.Provider>
  );
}
