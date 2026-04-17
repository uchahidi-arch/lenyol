'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// ─── CONTEXT ─────────────────────────────────────────────────────

interface LoadingContextValue {
  isLoading: boolean
  setLoading: (show: boolean) => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

// ─── PROVIDER ────────────────────────────────────────────────────

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const setLoading = useCallback((show: boolean) => {
    setIsLoading(show)
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9,30,18,.88)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div className="spin" />
        </div>
      )}
    </LoadingContext.Provider>
  )
}

// ─── HOOK ────────────────────────────────────────────────────────

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading doit être dans <LoadingProvider>')
  return ctx
}

// ─── COMPOSANT AUTONOME (pour layout.tsx) ────────────────────────

export default function Loading() {
  return null
}
