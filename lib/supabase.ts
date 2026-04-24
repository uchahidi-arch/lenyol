import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Supabase est-il configuré ? (les placeholders ne commencent pas par https://)
const isConfigured = SUPABASE_URL.startsWith('https://')

// ─── Client côté navigateur (composants 'use client') ───────────────────────
export function createClient() {
  // Utilise un endpoint neutre tant que les vraies clés ne sont pas renseignées
  const url = isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co'
  const key = isConfigured ? SUPABASE_KEY : 'placeholder-anon-key'
  return createBrowserClient(url, key)
}

// Singleton — évite de recréer le client à chaque render
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_client) _client = createClient()
  return _client
}

// Export lazy — compatible avec import { supabase } from '@/lib/supabase'
// Le client n'est créé que lors du premier accès, pas au chargement du module
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (_client ??= createClient())[prop as keyof ReturnType<typeof createClient>]
  }
})
