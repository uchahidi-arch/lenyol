'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'mid' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeCtx = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'lenyol-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('mid');
  const [mounted, setMounted] = useState(false);

  // Charger le thème depuis localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'mid', 'dark'].includes(stored)) {
      setThemeState(stored);
    } else {
      setThemeState('mid');
    }
    setMounted(true);
  }, []);

  // Appliquer la classe sur <html> quand le thème change
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('dim', 'dark');
    if (theme === 'mid') root.classList.add('dim');
    else if (theme === 'dark') root.classList.add('dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'mid';
      if (prev === 'mid') return 'dark';
      return 'light';
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}