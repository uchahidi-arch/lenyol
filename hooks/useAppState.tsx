'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import type { Person, Union } from '@/lib/types';

interface Toast {
  msg: string;
  type: 'info' | 'success' | 'error';
}

interface AppState {
  allPersons: Person[];
  allUnions:  Union[];
  myPersons:  Person[];
  myUnions:   Union[];
  setAllPersons: (ps: Person[]) => void;
  setAllUnions:  (us: Union[]) => void;
  setMyPersons:  (ps: Person[]) => void;
  setMyUnions:   (us: Union[]) => void;
}

interface AppStateContext {
  state: AppState;
  toast: Toast | null;
  loading: boolean;
  showToast: (msg: string, type?: Toast['type']) => void;
  setLoading: (v: boolean) => void;
}

const Ctx = createContext<AppStateContext | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [allUnions,  setAllUnions]  = useState<Union[]>([]);
  const [myPersons,  setMyPersons]  = useState<Person[]>([]);
  const [myUnions,   setMyUnions]   = useState<Union[]>([]);
  const [toast, setToast]   = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = useCallback((msg: string, type: Toast['type'] = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const state: AppState = {
    allPersons, allUnions, myPersons, myUnions,
    setAllPersons, setAllUnions, setMyPersons, setMyUnions,
  };

  return (
    <Ctx.Provider value={{ state, toast, loading, showToast, setLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState(): AppStateContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

// Convenience hook for toast-only usage
export function useToast() {
  return useAppState().showToast;
}
