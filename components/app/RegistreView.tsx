'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PersonCard from '@/components/app/PersonCard';
import { useDB } from '@/hooks/useDB';
import { useAuth } from '@/hooks/useAuth';
import type { Person } from '@/lib/types';
import { useRegistreSearch } from '@/app/registre/layout';
import { useSidebar } from '@/hooks/useSidebar';

type RegistreTab = 'regions' | 'ethnie' | 'nom' | 'creators' | 'all';
type Step = 'regions' | 'localites' | 'persons';

interface RegistreViewProps {
  onShowPerson: (p: Person) => void;
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onRelier?: (personId: string) => void;
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const REGION_SLUG_MAP: Record<string, string> = {
  'Dakar':        'dakar',
  'Thiès':        'thies',
  'Diourbel':     'diourbel',
  'Fatick':       'fatick',
  'Kaolack':      'kaolack',
  'Kaffrine':     'kaffrine',
  'Kolda':        'kolda',
  'Ziguinchor':   'ziguinchor',
  'Sédhiou':      'sedhiou',
  'Tambacounda':  'tambacounda',
  'Kédougou':     'kedougou',
  'Matam':        'matam',
  'Saint-Louis':  'saint-louis',
  'Louga':        'louga',
  'Touba':        'touba',
};

const REGION_CONFIG = [
  { name: 'Dakar',       nameShort: 'Dakar',       code: 'DK', accent: '#1a3d2e', ethnies: ['Wolof', 'Lebou', 'Sérère']          },
  { name: 'Thiès',       nameShort: 'Thiès',       code: 'TH', accent: '#3d1a1a', ethnies: ['Sérère', 'Wolof', 'Peul']           },
  { name: 'Diourbel',    nameShort: 'Diourbel',    code: 'DB', accent: '#1a2e3d', ethnies: ['Wolof', 'Sérère']                   },
  { name: 'Fatick',      nameShort: 'Fatick',      code: 'FA', accent: '#2e1a3d', ethnies: ['Sérère', 'Wolof', 'Peul']           },
  { name: 'Kaolack',     nameShort: 'Kaolack',     code: 'KL', accent: '#1a3d2e', ethnies: ['Wolof', 'Sérère', 'Peul']           },
  { name: 'Kaffrine',    nameShort: 'Kaffrine',    code: 'KF', accent: '#3d2e1a', ethnies: ['Wolof', 'Peul', 'Mandingue']        },
  { name: 'Kolda',       nameShort: 'Kolda',       code: 'KO', accent: '#1a3d32', ethnies: ['Peul', 'Mandingue', 'Diola']        },
  { name: 'Ziguinchor',  nameShort: 'Ziguinchor',  code: 'ZG', accent: '#2e3d1a', ethnies: ['Diola', 'Mandingue', 'Peul']        },
  { name: 'Sédhiou',     nameShort: 'Sédhiou',     code: 'SD', accent: '#3d1a2e', ethnies: ['Mandingue', 'Peul', 'Diola']        },
  { name: 'Tambacounda', nameShort: 'Tambacounda', code: 'TC', accent: '#3d2a1a', ethnies: ['Peul', 'Mandingue', 'Toucouleur']   },
  { name: 'Kédougou',    nameShort: 'Kédougou',    code: 'KD', accent: '#1a2e3d', ethnies: ['Mandingue', 'Peul', 'Bassari']      },
  { name: 'Matam',       nameShort: 'Matam',       code: 'MT', accent: '#3d1a1a', ethnies: ['Toucouleur', 'Peul', 'Wolof']       },
  { name: 'Saint-Louis', nameShort: 'Saint-Louis', code: 'SL', accent: '#1a3d2e', ethnies: ['Toucouleur', 'Wolof', 'Peul']       },
  { name: 'Louga',       nameShort: 'Louga',       code: 'LG', accent: '#2e1a3d', ethnies: ['Wolof', 'Peul']                     },
  { name: 'Touba',       nameShort: 'Touba',       code: 'TO', accent: '#1a3d2e', ethnies: ['Wolof']                             },
];

const ETHNIES_CONFIG = [
  { name: 'Wolof',      desc: 'Peuple majoritaire, langue franche du Sénégal',         accent: '#1a2e5c', bg: '#e8edf8', symbol: '◈' },
  { name: 'Peul',       desc: "Peuple pasteur, présent dans toute l'Afrique de l'Ouest", accent: '#5c3a1a', bg: '#f8efe8', symbol: '◉' },
  { name: 'Sérère',     desc: 'Peuple des îles du Sine-Saloum et du Ferlo',            accent: '#1a4a2e', bg: '#e8f4ee', symbol: '◇' },
  { name: 'Mandingue',  desc: 'Peuple du Sénégal oriental et de la Casamance',         accent: '#5c1a3a', bg: '#f4e8f0', symbol: '◆' },
  { name: 'Toucouleur', desc: 'Peuple du fleuve Sénégal, héritiers de Tekrour',        accent: '#1a4a4a', bg: '#e8f4f4', symbol: '◐' },
  { name: 'Diola',      desc: 'Peuple de Casamance, gardiens de la forêt sacrée',      accent: '#3a2e1a', bg: '#f0ede8', symbol: '◑' },
];

// ── Normalisation : supprime accents + minuscules
function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ── Joker SQL : remplace voyelles par _ pour tolérer les variantes
function toDbPattern(word: string) {
  return normalize(word).replace(/[aeiouy\s\-']/g, '_');
}

// ── Distance de Levenshtein
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── Score de correspondance floue : 0 = parfait, +∞ = pas de match
function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (t.includes(q)) return 0;
  const words = q.split(/\s+/).filter(Boolean);
  const targetWords = t.split(/\s+/);
  let total = 0;
  for (const w of words) {
    const best = Math.min(...targetWords.map(tw => levenshtein(w, tw)));
    const threshold = w.length <= 5 ? 1 : 2;
    if (best > threshold) return Infinity;
    total += best;
  }
  return total;
}

const PAGE_SIZE = 50;

function extractYear(d?: string | null): string {
  if (!d) return '';
  const m = d.match(/^(\d{4})/);
  return m ? m[1] : '';
}

// ── Temps relatif (ex: "il y a 3j")
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'il y a 1j';
  return `il y a ${days}j`;
}

export default function RegistreView({ onShowPerson, onOpenAuth }: RegistreViewProps) {
  const router = useRouter();
  const { fetchByLocalite, fetchByClan, searchPersons } = useDB();
  const { user } = useAuth();
  const { searchQ, sidebarCbs } = useRegistreSearch();
  const { nomQ } = useSidebar();

  const [tab, setTab]   = useState<RegistreTab>('regions');
  const [step, setStep] = useState<Step>('regions');
  const [regionSel, setRegionSel]   = useState<string | null>(null);
  const [departement, setDepartement] = useState<string | null>(null);
  const [localite, setLocalite] = useState<string | null>(null);

  const [persons, setPersons]   = useState<Person[]>([]);
  const [lenyolGroups, setLenyolGroups] = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading]   = useState(false);
  const [groupLenyol, setGroupLenyol] = useState(false);
  const [hasNullLoc, setHasNullLoc] = useState(false);
  const [regionLocalites, setRegionLocalites] = useState<{ region: string; localite: string }[]>([]);

  // ── Filtre local (dans les listes par région/lenyol)
  const [filterQ, setFilterQ] = useState('');

  // ── Liste tabulaire (tri + pagination)
  const [sortCol, setSortCol] = useState<'nom' | 'ethnie' | 'localite' | 'naiss'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [listPage, setListPage] = useState(0);

  // ── Recherche globale depuis le header
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Stats légères pour les cartes de régions (chargées au montage)
  const [allPersonsLight, setAllPersonsLight] = useState<{
    region: string | null;
    localite: string | null;
    clan: string | null;
    updated_at: string | null;
  }[]>([]);

  // ── Classement créateurs
  const [creators, setCreators] = useState<{ id: string; name: string; count: number }[]>([]);
  const [creatorLoading, setCreatorLoading] = useState(false);

  // ── Profil créateur sélectionné
  const [selectedCreator, setSelectedCreator] = useState<{ id: string; name: string; total: number } | null>(null);
  const [creatorPersons, setCreatorPersons] = useState<Person[]>([]);
  const [creatorPersonsLoading, setCreatorPersonsLoading] = useState(false);


  // Chargement des stats légères au montage (toutes les pages, sans limite Supabase)
  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const pageSize = 1000;
      let page = 0;
      let all: typeof allPersonsLight = [];
      while (true) {
        const { data } = await supabase
          .from('persons')
          .select('region, localite, clan, updated_at')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < pageSize) break;
        page++;
      }
      setAllPersonsLight(all);
    });
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
    const best  = words.reduce((a, b) => a.length > b.length ? a : b, words[0] || q.trim());
    const raw   = await searchPersons(toDbPattern(best));
    const scored = raw
      .map(p => ({ p, score: fuzzyScore(q.trim(), [p.prenom, p.nom, p.clan, p.localite, p.galle].filter(Boolean).join(' ')) }))
      .filter(x => x.score !== Infinity)
      .sort((a, b) => a.score - b.score);
    setSearchResults(scored.map(x => x.p));
    setSearching(false);
  }, [searchPersons]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQ || searchQ.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => runSearch(searchQ), 300);
  }, [searchQ]);

  useEffect(() => { setListPage(0); }, [persons, filterQ]);

  // ── NAVIGATION ──

  const pickRegion = async (regionName: string) => {
    if (regionName === '__nr__') { pickLocalite('__nr__'); return; }
    setLoading(true); setRegionSel(regionName); setDepartement(null); setLocalite(null); setStep('localites');
    const { supabase } = await import('@/lib/supabase');
    const [{ data: personsData }, { data: localitesData }] = await Promise.all([
      supabase.from('persons').select('localite').eq('region', regionName),
      supabase.from('localites').select('region, departement, localite').eq('region', regionName),
    ]);
    const hasNull = (personsData || []).some((p: any) => !p.localite);
    setHasNullLoc(hasNull);
    setRegionLocalites((localitesData || []) as { region: string; localite: string }[]);
    setLoading(false);
  };

  const pickLocalite = async (loc: string) => {
    setLoading(true); setLocalite(loc); setStep('persons');
    const data = await fetchByLocalite(loc);
    setPersons(data); setFilterQ(''); setLoading(false);
  };

  const loadByField = async (field: 'ethnie' | 'nom') => {
    const tabKey: RegistreTab = field;
    setTab(tabKey); setStep('regions'); setLoading(true);
    const { data } = await import('@/lib/supabase').then(m =>
      m.supabase.from('persons').select(field).not(field, 'is', null)
    );
    const groups: Record<string, number> = {};
    (data || []).forEach((p: any) => {
      const key = p[field];
      if (key) groups[key] = (groups[key] || 0) + 1;
    });
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    setLenyolGroups(sorted);
    setLoading(false);
  };

  const pickLenyol = async (label: string) => {
    setLoading(true); setStep('persons');
    let data: Person[] = [];
    if (label === '__sans__') {
      const field = tab === 'nom' ? 'nom' : tab === 'ethnie' ? 'ethnie' : 'clan';
      const { data: raw } = await import('@/lib/supabase').then(m =>
        m.supabase.from('persons').select('*').is(field, null).limit(300)
      );
      data = (raw || []) as Person[];
    } else {
      data = await fetchByClan(label);
    }
    setPersons(data); setFilterQ(''); setLoading(false);
  };

  const loadAll = async () => {
    setTab('all'); setStep('persons'); setLoading(true);
    const { data } = await import('@/lib/supabase').then(m =>
      m.supabase.from('persons').select('*').order('prenom').limit(300)
    );
    setPersons(data || []); setFilterQ(''); setLoading(false);
  };

  const loadCreators = async () => {
    setTab('creators'); setStep('regions'); setCreatorLoading(true); setSelectedCreator(null);
    const { supabase } = await import('@/lib/supabase');
    const pageSize = 1000;
    let page = 0;
    let allRows: { created_by: string | null; created_by_name: string | null }[] = [];
    while (true) {
      const { data } = await supabase
        .from('persons')
        .select('created_by, created_by_name')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (!data || data.length === 0) break;
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      page++;
    }
    const acc: Record<string, { name: string; count: number }> = {};
    allRows.forEach((p: any) => {
      const id = p.created_by || '__anonyme__';
      const name = p.created_by_name || 'Anonyme';
      if (!acc[id]) acc[id] = { name, count: 0 };
      acc[id].count++;
    });
    const ranking = Object.entries(acc)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20)
      .map(([id, { name, count }]) => ({ id, name, count }));
    setCreators(ranking);
    setCreatorLoading(false);
  };

  const loadCreatorProfile = async (creator: { id: string; name: string; total: number }) => {
    setSelectedCreator(creator);
    setCreatorPersonsLoading(true);
    const { data } = await import('@/lib/supabase').then(m =>
      m.supabase.from('persons')
        .select('*')
        .eq('created_by', creator.id)
        .order('prenom', { ascending: true })
        .limit(50)
    );
    setCreatorPersons((data || []) as Person[]);
    setCreatorPersonsLoading(false);
  };

  // ── Navigation rapide depuis la sidebar
  const jumpToEthnie = async (name: string) => {
    setTab('ethnie');
    setStep('persons');
    setLoading(true);
    const data = await fetchByClan(name);
    setPersons(data);
    setFilterQ('');
    setLoading(false);
  };

  const jumpToRegion = (name: string) => {
    setTab('regions');
    pickRegion(name);
  };

  // ── Enregistrer les callbacks dans le ref de la sidebar globale
  useEffect(() => {
    if (sidebarCbs) {
      sidebarCbs.current = {
        jumpToEthnie,
        jumpToRegion,
        pickLenyol,
        loadNomField: () => loadByField('nom'),
        filteredNomGroups: (tab === 'nom' && nomQ.trim())
          ? lenyolGroups.filter(g => normalize(g.label).includes(normalize(nomQ.trim())))
          : lenyolGroups,
      };
    }
  });

  // ── Filtre local (dans les résultats par région/lenyol/all)
  const filteredPersons = filterQ
    ? persons.filter(p => {
        const target = normalize([p.prenom, p.nom, p.clan, p.localite].filter(Boolean).join(' '));
        return fuzzyScore(filterQ.trim(), target) !== Infinity;
      })
    : persons;

  // ── Liste triée + paginée (vue tabulaire)
  const sortedPersons = [...filteredPersons].sort((a, b) => {
    let va = '', vb = '';
    if (sortCol === 'nom') { va = ((a.nom || '') + (a.prenom || '')).toLowerCase(); vb = ((b.nom || '') + (b.prenom || '')).toLowerCase(); }
    else if (sortCol === 'ethnie') { va = (a.ethnie || '').toLowerCase(); vb = (b.ethnie || '').toLowerCase(); }
    else if (sortCol === 'localite') { va = ((a.region || '') + (a.localite || '')).toLowerCase(); vb = ((b.region || '') + (b.localite || '')).toLowerCase(); }
    else if (sortCol === 'naiss') { va = extractYear(a.naiss_date) || '0'; vb = extractYear(b.naiss_date) || '0'; }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
  const totalListPages = Math.ceil(sortedPersons.length / PAGE_SIZE);
  const pagePersons = sortedPersons.slice(listPage * PAGE_SIZE, (listPage + 1) * PAGE_SIZE);

  // ── Groupes noms filtrés par la sidebar
  const filteredNomGroups = (tab === 'nom' && nomQ.trim())
    ? lenyolGroups.filter(g => normalize(g.label).includes(normalize(nomQ.trim())))
    : lenyolGroups;

  // Breadcrumb helper
  const TAB_LABELS: Record<RegistreTab, string> = {
    regions: 'Par Régions',
    ethnie: 'Par Ethnie',
    nom: 'Par Nom de famille',
    creators: 'Par Créateur',
    all: 'Tout le catalogue',
  };

  const breadcrumb = () => {
    const items: { label: string; onClick: () => void }[] = [];
    if (tab === 'regions') {
      if (regionSel) items.push({ label: regionSel, onClick: () => { setStep('localites'); setLocalite(null); setPersons([]); } });
      if (localite) items.push({ label: localite === '__nr__' ? 'Origine inconnue' : localite, onClick: () => {} });
    } else if (tab === 'ethnie' || tab === 'nom') {
      if (step === 'persons') items.push({ label: TAB_LABELS[tab], onClick: () => { setStep('regions'); setPersons([]); } });
    } else if (tab === 'all') {
      items.push({ label: 'Tout le catalogue', onClick: () => {} });
    }
    return items;
  };

  const currentDepartements: [string, string[]][] = regionSel
    ? Object.entries(
        regionLocalites.reduce<Record<string, string[]>>((acc, { region, localite }) => {
          if (!acc[region]) acc[region] = [];
          acc[region].push(localite);
          return acc;
        }, {})
      )
    : [];

  const medal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return String(rank);
  };

  // Mode recherche globale actif
  if (searchQ && searchQ.trim().length >= 2) {
    return (
      <div className="view-section">
        <div className="folder-grid">
          {searching ? (
            <div className="empty-grid"><div className="spin" style={{ width: 24, height: 24, borderWidth: 2 }} /></div>
          ) : searchResults.length === 0 ? (
            <div className="empty-grid" style={{ flexDirection: 'column', gap: '24px' }}>
              <span>Aucun résultat pour « {searchQ} ».</span>
              {!user && (
                <button
                  className="btn-hero btn-hero-p"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                  onClick={() => onOpenAuth('signup')}
                >
                  🌿 Créez votre famille
                </button>
              )}
            </div>
          ) : searchResults.map(p => (
            <PersonCard key={p.id} person={p} onClick={() => onShowPerson(p)} />
          ))}
        </div>
      </div>
    );
  }

  const maxCreators = creators[0]?.count || 1;

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── CONTENU PRINCIPAL ── */}
      <div
        className="view-section"
        style={{ position: 'relative', zIndex: 1, background: 'transparent', flex: 1 }}
      >

        {/* Introduction */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{
          padding: '48px 32px 40px var(--page-left)',
        }}>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 700,
            fontFamily: "'Cormorant Garamond', serif",
            color: 'var(--t1)',
            lineHeight: 1.2,
            margin: 0,
            marginBottom: '12px',
            letterSpacing: '-0.01em',
          }}>
            Explorez les familles sénégalaises
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--t3)',
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            maxWidth: '720px',
          }}>
            Des milliers de lignées documentées, organisées par région, ethnie et caste.
          </p>
        </div>
        </div>

        {/* Tabs */}
        <div className="explorer-tabs-bar">
          <button className={`exp-tab${tab === 'regions' ? ' on' : ''}`} onClick={() => { setTab('regions'); setStep('regions'); setPersons([]); }}>Par Régions</button>
          <button className={`exp-tab${tab === 'ethnie' ? ' on' : ''}`} onClick={() => loadByField('ethnie')}>Par Ethnie</button>
          <button className={`exp-tab${tab === 'nom' ? ' on' : ''}`} onClick={() => loadByField('nom')}>Par Nom de famille</button>
          <button className={`exp-tab${tab === 'creators' ? ' on' : ''}`} onClick={loadCreators}>Par Créateur</button>
          <button className={`exp-tab${tab === 'all' ? ' on' : ''}`} onClick={loadAll}>Tout le catalogue</button>
        </div>

        {/* Topbar */}
        <div className="explorer-topbar">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1, gap: '2px' }}>
            {tab === 'regions' && step === 'regions' && (
              <span style={{ fontSize: '15px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Sélectionnez une région</span>
            )}
            {(tab === 'ethnie' || tab === 'nom') && step === 'regions' && (
              <span style={{ fontSize: '15px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Sélectionnez {tab === 'ethnie' ? 'une ethnie' : 'un nom de famille'}</span>
            )}
            {tab === 'creators' && !selectedCreator && (
              <span style={{ fontSize: '15px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Top 20 contributeurs</span>
            )}
            {tab === 'creators' && selectedCreator && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="bc-item-v2"
                  onClick={() => setSelectedCreator(null)}
                  style={{ cursor: 'pointer' }}
                >
                  Par Créateur
                </span>
                <span className="bc-sep-v2">›</span>
                <span className="bc-current-v2">{selectedCreator.name}</span>
              </span>
            )}
            {breadcrumb().map((item, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i < arr.length - 1
                  ? <><span className="bc-item-v2" onClick={item.onClick}>{item.label}</span><span className="bc-sep-v2">›</span></>
                  : <span className="bc-current-v2">{item.label}</span>
                }
              </span>
            ))}
          </div>

          {step === 'persons' && tab === 'regions' && localite && (
            <button className={`reg-sort-btn${groupLenyol ? ' on' : ''}`} onClick={() => setGroupLenyol(v => !v)}>
              ⬡ {groupLenyol ? 'Groupé par Lenyol' : 'Grouper par Lenyol'}
            </button>
          )}

          {step === 'persons' && (
            <div className="exp-search">
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={filterQ}
                onChange={e => setFilterQ(e.target.value)}
                placeholder="Filtrer…"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="folder-grid">
            <div className="empty-grid">
              <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
            </div>
          </div>
        ) : (
          <>
            {/* Cartes régions sénégalaises */}
            {tab === 'regions' && step === 'regions' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '24px 32px 24px var(--page-left)', overflowY: 'auto', flex: 1, alignContent: 'start' }}>
                {REGION_CONFIG.map(({ name, nameShort, code, accent, ethnies }) => {
                  const regionPersons = allPersonsLight.filter(p => p.region === name);
                  const personnes = regionPersons.length;
                  const localites = new Set(regionPersons.filter(p => p.localite).map(p => p.localite)).size;
                  const clans = new Set(regionPersons.filter(p => p.clan).map(p => p.clan)).size;
                  const lastDate = regionPersons.reduce((max: string | null, p) => {
                    if (!p.updated_at) return max;
                    return !max || p.updated_at > max ? p.updated_at : max;
                  }, null);
                  return (
                    <div
                      key={name}
                      onClick={() => router.push(`/registre/${REGION_SLUG_MAP[name]}`)}
                      className="fadein"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.6)',
                        borderRadius: '20px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(20,18,13,0.15)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.08)';
                      }}
                    >
                      {/* Badge code région */}
                      <div style={{ marginBottom: '16px', minHeight: '72px', display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '72px', height: '72px', borderRadius: '18px',
                          background: accent + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${accent}30`,
                        }}>
                          <span style={{ fontSize: '22px', fontWeight: 800, color: accent, letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {code}
                          </span>
                        </div>
                      </div>

                      {/* Nom + ethnies */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: accent, lineHeight: 1.2 }}>
                          {nameShort}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {ethnies.map(e => (
                            <span key={e} style={{
                              fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                              background: accent + '15', color: accent, fontWeight: 600,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {[
                          { val: clans,     label: 'clans'     },
                          { val: personnes, label: 'personnes' },
                          { val: localites, label: 'lieux'     },
                        ].map(({ val, label }) => (
                          <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: accent }}>{val}</div>
                            <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                          {lastDate ? `Mis à jour ${timeAgo(lastDate)}` : 'Aucune donnée'}
                        </span>
                        <span style={{ fontSize: '18px', color: accent, fontWeight: 700 }}>→</span>
                      </div>
                    </div>
                  );
                })}

                {/* Carte Origine inconnue */}
                <div
                  onClick={() => pickRegion('__nr__')}
                  className="fadein"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '20px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(20,18,13,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.08)';
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '16px', minHeight: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', lineHeight: 1 }}>
                    🔍
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: '#2e2e2e', lineHeight: 1.2 }}>
                      Origine inconnue
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '3px' }}>Région non renseignée</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#2e2e2e' }}>
                        {allPersonsLight.filter(p => !p.region).length}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px' }}>personnes</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '18px', color: '#2e2e2e', fontWeight: 700 }}>→</span>
                  </div>
                </div>
              </div>
            )}

            {tab === 'regions' && step === 'localites' && (
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 32px 32px var(--page-left)' }}>
                {currentDepartements.map(([dep, locs]) => (
                  <div key={dep} style={{ marginBottom: '28px' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.4)', marginBottom: '12px', cursor: 'pointer' }}
                      onClick={() => router.push(`/registre/${REGION_SLUG_MAP[regionSel!]}/${slugify(dep)}`)}
                    >
                      <span style={{ fontSize: '13px' }}>📍</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)' }}>{dep}</span>
                      <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: 'auto' }}>{locs.length} localité{locs.length > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                      {locs.map(loc => (
                        <div
                          key={loc}
                          className="fadein"
                          onClick={() => router.push(`/registre/${REGION_SLUG_MAP[regionSel!]}/${slugify(dep)}/${slugify(loc)}`)}
                          style={{
                            background: 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            borderRadius: '20px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(20,18,13,0.14)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.08)';
                          }}
                        >
                          <span style={{ fontSize: '28px', lineHeight: 1 }}>🏘️</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', textAlign: 'center', lineHeight: 1.3 }}>{loc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {hasNullLoc && (
                  <div
                    className="fadein"
                    onClick={() => pickLocalite('__nr__')}
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '20px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🔍</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Localité inconnue</span>
                  </div>
                )}
              </div>
            )}

            {/* Grille ethnies */}
            {tab === 'ethnie' && step === 'regions' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', padding: '24px 32px 24px var(--page-left)', overflowY: 'auto', flex: 1, alignContent: 'start' }}>
                {ETHNIES_CONFIG.map(({ name, desc, accent, bg, symbol }) => {
                  const count = lenyolGroups.find(g => normalize(g.label) === normalize(name))?.count ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={name}
                      onClick={() => pickLenyol(name)}
                      className="fadein"
                      style={{
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.6)',
                        borderRadius: '20px',
                        padding: '28px 24px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 20px rgba(20,18,13,0.07)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(20,18,13,0.14)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.07)';
                      }}
                    >
                      {/* Symbole */}
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '18px',
                        fontSize: '22px', color: accent,
                      }}>
                        {symbol}
                      </div>
                      {/* Nom + desc */}
                      <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: accent, marginBottom: '6px', lineHeight: 1.2 }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.6, marginBottom: '20px' }}>
                        {desc}
                      </div>
                      {/* Stat */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: accent }}>
                          {count} personne{count !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '18px', color: accent, fontWeight: 700 }}>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Liste alphabétique noms de famille */}
            {tab === 'nom' && step === 'regions' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px var(--page-left)' }}>
                {(() => {
                  const grouped: Record<string, { label: string; count: number }[]> = {};
                  filteredNomGroups.forEach(g => {
                    const letter = (g.label[0] || '#').toUpperCase();
                    if (!grouped[letter]) grouped[letter] = [];
                    grouped[letter].push(g);
                  });
                  const letters = Object.keys(grouped).sort();
                  return (
                    <>
                      {/* Ancres alphabet */}
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '4px',
                        padding: '20px 0 28px',
                        borderBottom: '1px solid rgba(0,0,0,0.07)',
                        marginBottom: '28px',
                      }}>
                        {letters.map(l => (
                          <a
                            key={l}
                            href={`#nom-${l}`}
                            style={{
                              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700, color: 'var(--t2)', borderRadius: '8px',
                              background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)',
                              textDecoration: 'none', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(45,90,61,0.1)'}
                            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.7)'}
                          >
                            {l}
                          </a>
                        ))}
                      </div>

                      {/* Sections par lettre */}
                      {letters.map(l => (
                        <div key={l} id={`nom-${l}`} style={{ marginBottom: '32px' }}>
                          <div style={{
                            fontSize: '28px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif",
                            color: 'var(--t1)', lineHeight: 1, marginBottom: '12px',
                            paddingBottom: '8px', borderBottom: '2px solid var(--green-bg)',
                          }}>
                            {l}
                          </div>
                          <div style={{
                            background: 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(20,18,13,0.05)',
                          }}>
                            {grouped[l].map(({ label, count }, i, arr) => (
                              <div
                                key={label}
                                onClick={() => pickLenyol(label)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '13px 20px',
                                  borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                  cursor: 'pointer',
                                  transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(45,90,61,0.05)'}
                                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                              >
                                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {label}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--t3)', fontWeight: 500, flexShrink: 0, marginLeft: '16px' }}>
                                  {count} pers.
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Classement Par Créateur */}
            {tab === 'creators' && !selectedCreator && (
              <div style={{ padding: '24px 32px 24px var(--page-left)', overflowY: 'auto', flex: 1 }}>
                {creatorLoading ? (
                  <div className="empty-grid"><div className="spin" style={{ width: 24, height: 24, borderWidth: 2 }} /></div>
                ) : creators.length === 0 ? (
                  <div className="empty-grid">Aucun contributeur trouvé.</div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                  }}>
                    {creators.map(({ id, name, count }, idx) => {
                      const rank = idx + 1;
                      const pct = Math.round((count / maxCreators) * 100);
                      return (
                        <div
                          key={id}
                          onClick={() => loadCreatorProfile({ id, name, total: count })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 20px',
                            borderBottom: idx < creators.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(45,106,79,0.05)'}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: rank <= 3 ? '20px' : '13px',
                            fontWeight: 700,
                            width: '28px',
                            textAlign: 'center',
                            color: 'var(--t2)',
                            flexShrink: 0,
                          }}>
                            {medal(rank)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </div>
                            <div style={{ marginTop: '5px', height: '4px', background: 'var(--bd)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: '2px' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {count} pers.
                          </span>
                          <span style={{ fontSize: '16px', color: 'var(--t3)', flexShrink: 0 }}>›</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Profil créateur */}
            {tab === 'creators' && selectedCreator && (
              <div style={{ padding: '24px 32px 24px var(--page-left)', overflowY: 'auto', flex: 1 }}>
                {/* En-tête profil */}
                <div style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: '20px',
                  padding: '20px 24px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <span style={{ fontSize: '32px' }}>{medal(creators.findIndex(c => c.id === selectedCreator.id) + 1)}</span>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)', fontFamily: "'Cormorant Garamond', serif" }}>
                      {selectedCreator.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '3px' }}>
                      {selectedCreator.total} personne{selectedCreator.total !== 1 ? 's' : ''} ajoutée{selectedCreator.total !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Fiches du créateur */}
                {creatorPersonsLoading ? (
                  <div className="empty-grid"><div className="spin" style={{ width: 24, height: 24, borderWidth: 2 }} /></div>
                ) : creatorPersons.length === 0 ? (
                  <div className="empty-grid">Aucune fiche trouvée.</div>
                ) : (
                  <>
                    <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '12px' }}>
                      Ses fiches ({creatorPersons.length}{selectedCreator.total > 50 ? ` sur ${selectedCreator.total}` : ''}) :
                    </div>
                    <div className="folder-grid">
                      {creatorPersons.map(p => (
                        <PersonCard key={p.id} person={p} onClick={() => onShowPerson(p)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 'persons' && (
              <>
                {filteredPersons.length === 0 ? (
                  <div className="folder-grid">
                    <div className="empty-grid">Aucune personne trouvée.</div>
                  </div>
                ) : groupLenyol && tab === 'regions' && localite ? (
                  <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
                    {Object.entries(
                      filteredPersons.reduce((groups: Record<string, Person[]>, p) => {
                        const key = (p.prefix_lignee || 'Lenyol') + ' ' + (p.clan || 'Sans clan');
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(p);
                        return groups;
                      }, {})
                    )
                      .sort((a, b) => b[1].length - a[1].length)
                      .map(([label, grpPersons]) => (
                        <div key={label} style={{ marginBottom: '32px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px 12px 16px', borderBottom: '2px solid var(--green-bg)', marginBottom: '12px' }}>
                            <span style={{ fontSize: '16px' }}>⬡</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{label}</span>
                            <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: 'auto' }}>{grpPersons.length} personne{grpPersons.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="folder-grid" style={{ paddingTop: 0 }}>
                            {grpPersons.map(p => <PersonCard key={p.id} person={p} onClick={() => onShowPerson(p)} />)}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {([
                            { key: 'nom',      label: 'Nom / Prénom',       width: '34%' },
                            { key: 'ethnie',   label: 'Ethnie',             width: '18%' },
                            { key: 'localite', label: 'Région / Localité',  width: '28%' },
                            { key: 'naiss',    label: 'Naissance – Décès',  width: '20%' },
                          ] as { key: typeof sortCol; label: string; width: string }[]).map(({ key, label, width }) => {
                            const active = sortCol === key;
                            return (
                              <th
                                key={key}
                                onClick={() => {
                                  if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                  else { setSortCol(key); setSortDir('asc'); }
                                  setListPage(0);
                                }}
                                style={{
                                  width, padding: '10px 12px', textAlign: 'left',
                                  fontSize: '11px', fontWeight: 700,
                                  color: active ? 'var(--green)' : 'var(--t3)',
                                  textTransform: 'uppercase', letterSpacing: '0.07em',
                                  cursor: 'pointer', userSelect: 'none',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  borderBottom: '2px solid var(--bd)',
                                  whiteSpace: 'nowrap',
                                  transition: 'color 0.15s',
                                }}
                              >
                                {label}
                                {active && <span style={{ marginLeft: '4px', fontSize: '10px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {pagePersons.map((p, i) => (
                          <tr
                            key={p.id}
                            onClick={() => onShowPerson(p)}
                            style={{
                              background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.07)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent';
                            }}
                          >
                            <td style={{ padding: '11px 12px', fontSize: '14px', fontWeight: 600, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              {p.prenom} {p.nom}
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              {p.ethnie || <span style={{ color: 'var(--t3)' }}>—</span>}
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              {[p.region, p.localite].filter(Boolean).join(' / ') || <span style={{ color: 'var(--t3)' }}>—</span>}
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              {extractYear(p.naiss_date) || (p.naiss_date ? p.naiss_date : '?')}
                              {p.deceased && ` – ${extractYear(p.deces_date) || (p.deces_date ? p.deces_date : '?')}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {totalListPages > 1 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '20px 0', borderTop: '1px solid var(--bd)', marginTop: '8px',
                      }}>
                        <button
                          onClick={() => setListPage(p => Math.max(0, p - 1))}
                          disabled={listPage === 0}
                          style={{
                            background: 'none', border: '1px solid var(--bd)', borderRadius: '8px',
                            padding: '6px 14px', cursor: listPage === 0 ? 'default' : 'pointer',
                            fontSize: '13px', color: listPage === 0 ? 'var(--t3)' : 'var(--t1)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          ← Précédent
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {listPage + 1} / {totalListPages}
                        </span>
                        <button
                          onClick={() => setListPage(p => Math.min(totalListPages - 1, p + 1))}
                          disabled={listPage === totalListPages - 1}
                          style={{
                            background: 'none', border: '1px solid var(--bd)', borderRadius: '8px',
                            padding: '6px 14px', cursor: listPage === totalListPages - 1 ? 'default' : 'pointer',
                            fontSize: '13px', color: listPage === totalListPages - 1 ? 'var(--t3)' : 'var(--t1)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          Suivant →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
