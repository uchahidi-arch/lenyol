import { createClient } from '@supabase/supabase-js'

// Client Supabase côté serveur — pour generateStaticParams et sitemap.
// N'utilise pas @supabase/ssr car ces contextes n'ont pas accès aux cookies.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isConfigured = url?.startsWith('https://')
  return createClient(
    isConfigured ? url! : 'https://placeholder.supabase.co',
    isConfigured ? key! : 'placeholder-anon-key'
  )
}
