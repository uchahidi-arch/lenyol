'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';

interface AppHeaderProps {
  onOpenAuth?: (tab: 'login' | 'signup') => void;
  notifCount?: number;
  onToggleNotifs?: () => void;
  onSearch?: (q: string) => void;
}

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function toDbPattern(word: string) {
  return normalize(word).replace(/[aeiouy\s\-']/g, '_');
}

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

function fuzzyScore(query: string, target: string): number {
  const q = normalize(query), t = normalize(target);
  if (t.includes(q)) return 0;
  const words = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/);
  let total = 0;
  for (const w of words) {
    const best = Math.min(...tWords.map(tw => levenshtein(w, tw)));
    if (best > (w.length <= 5 ? 1 : 2)) return Infinity;
    total += best;
  }
  return total;
}

export default function AppHeader({ onOpenAuth, notifCount = 0, onToggleNotifs, onSearch }: AppHeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { state } = useAppState();
  const { exportJSON, exportGEDCOM, importGEDCOM, importJSON, searchPersons } = useDB();

  const isRegistre = pathname.startsWith('/registre');
  const isArbre    = pathname.startsWith('/monarbre');

  const [searchQ, setSearchQ]           = useState('');
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchResults, setSearchResults] = useState<typeof allPersons>([]);
  const [searching, setSearching]       = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const searchRef  = useRef<HTMLInputElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const displayName = profile?.username
    || [profile?.prenom, profile?.nom].filter(Boolean).join(' ')
    || user?.email?.split('@')[0] || '?';
  const initial   = displayName[0]?.toUpperCase() || '?';
  const firstName = displayName.split(' ')[0];

  // Ctrl+K focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allPersons = [...state.myPersons, ...state.allPersons.filter(p => !state.myPersons.find(m => m.id === p.id))];

  const handleSearchInput = useCallback((q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q || q.trim().length < 2) { setSearchResults([]); return; }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      // 1. Filtre serveur avec joker sur voyelles
      const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
      const best  = words.reduce((a, b) => a.length > b.length ? a : b, words[0] || q.trim());
      const raw   = await searchPersons(toDbPattern(best));
      // 2. Scoring Levenshtein côté client
      const scored = raw
        .map(p => ({
          p,
          score: fuzzyScore(q.trim(), [p.prenom, p.nom, p.clan, p.localite, p.galle].filter(Boolean).join(' ')),
        }))
        .filter(x => x.score !== Infinity)
        .sort((a, b) => a.score - b.score)
        .slice(0, 8);
      setSearchResults(scored.map(x => x.p));
      setSearching(false);
    }, 300);
  }, [searchPersons]);

  const handleResultClick = (id: string) => {
    const isMine = state.myPersons.some(p => p.id === id);
    setSearchQ('');
    setSearchOpen(false);
    router.push(isMine ? `/monarbre/${id}` : `/registre/${id}`);
  };

  return (
    <header className="app-hdr">
      {/* Logo */}
      <div className="app-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        <Image
          src="/logo.png"
          alt="Lenyol"
          width={160}
          height={44}
          style={{ objectFit: 'contain', width: 'auto', height: '44px' }}
          priority
        />
      </div>

      {/* Nav tabs — masqué sur mobile */}
      <div className="app-nav app-nav-desktop">
        <button
          className={`app-tab${isRegistre ? ' on' : ''}`}
          onClick={() => router.push('/registre')}
        >
        Registre
        </button>
        <button
          className={`app-tab${isArbre ? ' on' : ''}`}
          onClick={() => {
            if (!user) { onOpenAuth?.('login'); return; }
            router.push('/monarbre');
          }}
          style={{ opacity: user ? 1 : 0.5 }}
        >
        Mon Arbre
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Member actions — only on monarbre, desktop only */}
      {user && isArbre && (
        <div className="hdr-arbre-actions">
          <input type="file" id="ged-in" style={{ display: 'none' }} accept=".ged,.gedcom" onChange={importGEDCOM} />
          <input type="file" id="json-in" style={{ display: 'none' }} accept=".json" onChange={importJSON} />

          <button className="ico-btn" title="Importer GEDCOM" onClick={() => document.getElementById('ged-in')?.click()}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="ico-btn" title="Exporter JSON" onClick={exportJSON}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className="ico-btn" title="Exporter GEDCOM" onClick={exportGEDCOM}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <div className="hdr-sep" />
          <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => router.push('/monarbre/union/nouvelle')}>+ Mariage</button>
          <button className="btn btn-pri" style={{ fontSize: '11px' }} onClick={() => router.push('/monarbre/nouveau')}>+ Personne</button>
          <div className="hdr-sep" />
        </div>
      )}

      {/* Search — masqué sur mobile */}
      <div ref={wrapRef} className="hdr-search-wrap hdr-search-desktop" style={{ position: 'relative' }}>
        <div className="hdr-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => { handleSearchInput(e.target.value); setSearchOpen(true); onSearch?.(e.target.value); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Chercher ma famille…"
          />
        </div>
        {searchOpen && searching && !isRegistre && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--cream)', border: '1px solid var(--bd)', borderRadius: '8px', padding: '16px', textAlign: 'center', zIndex: 1000 }}>
            <div className="spin" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block' }} />
          </div>
        )}
        {searchOpen && !searching && searchResults.length > 0 && !isRegistre && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--cream)', border: '1px solid var(--bd)',
            borderRadius: '8px', boxShadow: 'var(--sh2)', zIndex: 1000,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 0', maxHeight: '320px', overflowY: 'auto' }}>
              {searchResults.map((p, idx) => {
                const isMine = state.myPersons.some(m => m.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleResultClick(p.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid var(--bd2)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.prenom} {p.nom || ''}
                      </div>
                      {p.localite && (
                        <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>
                          {p.localite}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: isMine ? 'var(--green-bg)' : 'var(--bg)',
                      color: isMine ? 'var(--green)' : 'var(--t3)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap'
                    }}>
                      {isMine ? 'Mon arbre' : 'Registre'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notifications — masqué sur mobile */}
      {user && (
        <button className="notif-btn hdr-notif-desktop" onClick={onToggleNotifs} title="Notifications">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </button>
      )}

      {/* Auth — masqué sur mobile */}
      {!user ? (
        <div className="hdr-auth-desktop" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button className="btn btn-sec" onClick={() => onOpenAuth?.('login')}>Se connecter</button>
          <button className="btn btn-pri" onClick={() => onOpenAuth?.('signup')}>Créer un compte</button>
        </div>
      ) : (
        <div
          className="user-chip hdr-user-desktop"
          onClick={() => router.push('/profil')}
          title="Mon profil"
        >
          <div className="user-av">{initial}</div>
          <span className="user-name">{firstName}</span>
        </div>
      )}

      {/* Burger — visible uniquement sur mobile */}
      <div ref={menuRef} className="hdr-burger-wrap">
        <button
          className="hdr-burger-btn"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        {/* Menu déroulant mobile */}
        {menuOpen && (
          <div className="hdr-mobile-menu">
            {/* Recherche */}
            <div className="hmm-search-wrap" style={{ position: 'relative' }}>
              <div className="hmm-search">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={searchQ}
                  onChange={e => { handleSearchInput(e.target.value); setSearchOpen(true); onSearch?.(e.target.value); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Chercher ma famille…"
                  autoFocus
                />
              </div>
              {searchOpen && !searching && searchResults.length > 0 && !isRegistre && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: 'var(--cream)', border: '1px solid var(--bd)',
                  borderRadius: '8px', boxShadow: 'var(--sh2)', zIndex: 1100,
                  overflow: 'hidden',
                }}>
                  {searchResults.map((p, idx) => {
                    const isMine = state.myPersons.some(m => m.id === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => { handleResultClick(p.id); setMenuOpen(false); }}
                        style={{
                          padding: '10px 12px', cursor: 'pointer',
                          borderBottom: idx < searchResults.length - 1 ? '1px solid var(--bd2)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.prenom} {p.nom || ''}
                          </div>
                          {p.localite && <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>{p.localite}</div>}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', background: isMine ? 'var(--green-bg)' : 'var(--bg)', color: isMine ? 'var(--green)' : 'var(--t3)', flexShrink: 0 }}>
                          {isMine ? 'Mon arbre' : 'Registre'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="hmm-divider" />

            {/* Navigation */}
            <button className={`hmm-item${isRegistre ? ' on' : ''}`} onClick={() => { router.push('/registre'); setMenuOpen(false); }}>
              Registre
            </button>
            <button className={`hmm-item${isArbre ? ' on' : ''}`} onClick={() => {
              if (!user) { onOpenAuth?.('login'); setMenuOpen(false); return; }
              router.push('/monarbre'); setMenuOpen(false);
            }} style={{ opacity: user ? 1 : 0.6 }}>
              Mon Arbre
            </button>

            <div className="hmm-divider" />

            {/* Auth ou profil */}
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-sec" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onOpenAuth?.('login'); setMenuOpen(false); }}>
                  Se connecter
                </button>
                <button className="btn btn-pri" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onOpenAuth?.('signup'); setMenuOpen(false); }}>
                  Créer un compte
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user && notifCount > 0 && (
                  <button className="hmm-item" onClick={() => { onToggleNotifs?.(); setMenuOpen(false); }}>
                    Notifications {notifCount > 0 && <span style={{ background: '#e53e3e', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', marginLeft: 4 }}>{notifCount}</span>}
                  </button>
                )}
                {isArbre && (
                  <>
                    <input type="file" id="ged-in-m" style={{ display: 'none' }} accept=".ged,.gedcom" onChange={e => { importGEDCOM(e); setMenuOpen(false); }} />
                    <button className="hmm-item" onClick={() => document.getElementById('ged-in-m')?.click()}>Importer GEDCOM</button>
                    <button className="hmm-item" onClick={() => { exportJSON(); setMenuOpen(false); }}>Exporter JSON</button>
                    <button className="hmm-item" onClick={() => { exportGEDCOM(); setMenuOpen(false); }}>Exporter GEDCOM</button>
                    <button className="btn btn-sec" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }} onClick={() => { router.push('/monarbre/union/nouvelle'); setMenuOpen(false); }}>+ Mariage</button>
                    <button className="btn btn-pri" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }} onClick={() => { router.push('/monarbre/nouveau'); setMenuOpen(false); }}>+ Personne</button>
                  </>
                )}
                <button className="hmm-item" onClick={() => { router.push('/profil'); setMenuOpen(false); }}>
                  <div className="user-av" style={{ width: 24, height: 24, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--green)', color: 'white', marginRight: 8 }}>{initial}</div>
                  {firstName}
                </button>
                <button className="hmm-item" style={{ color: '#e53e3e' }} onClick={() => { signOut(); setMenuOpen(false); }}>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
