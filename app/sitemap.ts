import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import { slugify } from '@/lib/slugify'

const BASE = 'https://lenyol.com'

// Mapping nom complet DB → slug court utilisé dans /registre/[region] et /registre/[region]/[departement]
const REGION_NAME_TO_SLUG: Record<string, string> = {
  'Dakar':       'dakar',
  'Thiès':       'thies',
  'Diourbel':    'diourbel',
  'Fatick':      'fatick',
  'Kaolack':     'kaolack',
  'Saint-Louis': 'saint-louis',
  'Louga':       'louga',
  'Ziguinchor':  'ziguinchor',
  'Kolda':       'kolda',
  'Tambacounda': 'tambacounda',
  'Matam':       'matam',
  'Kédougou':    'kedougou',
  'Kaffrine':    'kaffrine',
  'Sédhiou':     'sedhiou',
  'Touba':       'touba',
}

const REGION_SLUGS = ['dakar', 'thies', 'diourbel', 'fatick', 'kaolack', 'saint-louis', 'louga', 'ziguinchor', 'kolda', 'tambacounda', 'matam', 'kedougou', 'kaffrine', 'sedhiou', 'touba']

interface LocaliteRow {
  region: string
  departement: string
  localite: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createServerClient()

  // ── 1. Pages statiques ──────────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE,                              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/registre`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/registre/lenyol`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/registre/createur`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/about`,                   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/confidentialite`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ── 2. Pages par région sénégalaise (/registre/dakar, /registre/thies, …) ────
  const regionEntries: MetadataRoute.Sitemap = REGION_SLUGS.map(slug => ({
    url: `${BASE}/registre/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── 3. Pages par département + localité depuis la table `localites` ──────────
  const { data: localites } = await sb
    .from('localites')
    .select('region, departement, localite')

  const rows = (localites as LocaliteRow[] | null) ?? []

  // Départements uniques : /registre/[regionSlug]/[departementSlug]
  const seenDepartements = new Set<string>()
  const departementEntries: MetadataRoute.Sitemap = []

  for (const row of rows) {
    const regionSlug = REGION_NAME_TO_SLUG[row.region]
    if (!regionSlug) continue
    const departementSlug = slugify(row.departement)
    const key = `${regionSlug}/${departementSlug}`
    if (seenDepartements.has(key)) continue
    seenDepartements.add(key)
    departementEntries.push({
      url: `${BASE}/registre/${regionSlug}/${departementSlug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }

  // Localités : /registre/localite/[regionSlug]/[departementSlug]/[localiteSlug]
  const localiteEntries: MetadataRoute.Sitemap = rows.map(row => ({
    url: `${BASE}/registre/localite/${slugify(row.region)}/${slugify(row.departement)}/${slugify(row.localite)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // ── 4. Lenyol distincts depuis `persons.clan` + `prefix_lignee` ─────────────
  // Le slug est construit sur le label complet : (prefix_lignee || 'Lenyol') + ' ' + clan
  // Ex : prefix_lignee='Lenyol', clan='Diallo' → slug 'lenyol-diallo'
  const { data: clansData } = await sb
    .from('persons')
    .select('clan, prefix_lignee')
    .not('clan', 'is', null)

  const lenyolLabels = [
    ...new Set(
      (clansData as { clan: string | null; prefix_lignee: string | null }[] | null)
        ?.filter(r => Boolean(r.clan))
        .map(r => (r.prefix_lignee || 'Lenyol') + ' ' + r.clan!) ?? []
    ),
  ]

  const lenyolEntries: MetadataRoute.Sitemap = lenyolLabels.map(label => ({
    url: `${BASE}/registre/lenyol/${slugify(label)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // ── 5. Profils créateurs depuis `persons.created_by_name` ───────────────────
  const { data: creatorsData } = await sb
    .from('persons')
    .select('created_by_name')
    .not('created_by_name', 'is', null)

  const creatorNames = [
    ...new Set(
      (creatorsData as { created_by_name: string | null }[] | null)
        ?.map(r => r.created_by_name)
        .filter((n): n is string => Boolean(n)) ?? []
    ),
  ]

  const createurEntries: MetadataRoute.Sitemap = creatorNames.map(name => ({
    url: `${BASE}/registre/createur/${encodeURIComponent(name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    ...staticEntries,
    ...regionEntries,
    ...departementEntries,
    ...localiteEntries,
    ...lenyolEntries,
    ...createurEntries,
  ]
}
