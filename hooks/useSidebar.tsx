'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarCtx {
  isOpen: boolean;
  toggle: () => void;
  nomQ: string;
  setNomQ: (v: string) => void;
}

const Ctx = createContext<SidebarCtx>({ isOpen: true, toggle: () => {}, nomQ: '', setNomQ: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [nomQ, setNomQ] = useState('');
  return (
    <Ctx.Provider value={{ isOpen, toggle: () => setIsOpen(v => !v), nomQ, setNomQ }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSidebar() { return useContext(Ctx); }
