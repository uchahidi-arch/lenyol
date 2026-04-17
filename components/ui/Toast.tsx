'use client'

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { useAppState } from '@/hooks/useAppState'

// ─── TYPES ───────────────────────────────────────────────────────

type ToastType = 'info' | 'success' | 'error'

interface ToastMessage {
  id: number
  msg: string
  type: ToastType
}

// ─── CONTEXT ─────────────────────────────────────────────────────

const ToastContext = createContext<((msg: string, type?: ToastType) => void) | null>(null)

// ─── PROVIDER + COMPOSANT ────────────────────────────────────────

let _toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const show = useCallback((msg: string, type: ToastType = 'info') => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, msg, type }])
    // Auto-dismiss après 3 secondes (identique à la version vanilla)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ msg, type }: ToastMessage) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Déclenche l'animation d'entrée après le montage
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const bg = type === 'error'   ? '#7A1A2A'
           : type === 'success' ? '#1A5C3E'
           : '#14120D'

  return (
    <div
      style={{
        background: bg,
        color: 'white',
        padding: '10px 20px',
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font-outfit, Outfit, sans-serif)',
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 24px rgba(20,18,13,.11)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all .25s',
        pointerEvents: 'none',
      }}
    >
      {msg}
    </div>
  )
}

// ─── HOOK ────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être dans <ToastProvider>')
  return ctx
}

// ─── COMPOSANT AUTONOME (pour app pages) ────────────────────────
// Lit le toast depuis useAppState et l'affiche.

export default function Toast() {
  const { toast } = useAppState()
  if (!toast) return null
  const bg = toast.type === 'error'   ? '#7A1A2A'
           : toast.type === 'success' ? '#1A5C3E'
           : '#14120D'
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, pointerEvents: 'none' }}>
      <div style={{
        background: bg, color: 'white',
        padding: '10px 20px', borderRadius: 100,
        fontSize: 13, fontWeight: 500,
        fontFamily: 'var(--font-outfit, Outfit, sans-serif)',
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 24px rgba(20,18,13,.18)',
      }}>
        {toast.msg}
      </div>
    </div>
  )
}
