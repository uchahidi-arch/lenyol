'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useTimelineSidebar } from './layout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Person, Union } from '@/lib/types';

type EventType = 'naissance' | 'deces' | 'mariage';

interface TimelineEvent {
  id: string;
  year: number;
  type: EventType;
  personId: string;
  personName: string;
  initials: string;
  localite?: string;
  region?: string;
  approximate: boolean;
  partnerName?: string;
  secondaryPersonId?: string;
}

type Row =
  | { kind: 'event'; event: TimelineEvent; idx: number }
  | { kind: 'decade'; decade: number };

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconNaissance() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 10V5.5" />
      <path d="M5.5 5.5C5.5 4 3.5 2.5 2 1.5C2 3.5 3.5 5 5.5 5.5Z" />
      <path d="M5.5 5.5C5.5 4 7.5 2.5 9 1.5C9 3.5 7.5 5 5.5 5.5Z" />
    </svg>
  );
}

function IconDeces() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
      <circle cx="5.5" cy="5.5" r="3" />
    </svg>
  );
}

function IconMariage() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="4.5" cy="5" r="3.5" />
      <circle cx="9.5" cy="5" r="3.5" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="9" height="11" viewBox="0 0 9 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 1C2.567 1 1 2.567 1 4.5C1 7 4.5 10.5 4.5 10.5C4.5 10.5 8 7 8 4.5C8 2.567 6.433 1 4.5 1Z" />
      <circle cx="4.5" cy="4.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="9" width="34" height="30" rx="4" />
      <line x1="5" y1="17" x2="39" y2="17" />
      <line x1="15" y1="5" x2="15" y2="13" />
      <line x1="29" y1="5" x2="29" y2="13" />
    </svg>
  );
}

const CFG: Record<EventType, { icon: ReactElement; label: string; color: string; bg: string; border: string }> = {
  naissance: { icon: <IconNaissance />, label: 'Naissance', color: 'var(--green)',  bg: 'var(--green-bg)', border: 'var(--green-bd)' },
  deces:     { icon: <IconDeces />,     label: 'Décès',     color: 'var(--t3)',    bg: 'var(--warm)',     border: 'var(--bd)'      },
  mariage:   { icon: <IconMariage />,   label: 'Mariage',   color: 'var(--rose)',  bg: 'var(--rose-bg)',  border: 'var(--rose-li)' },
};

function initials(name: string) {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function personName(p: Person) {
  return [p.prenom, p.nom].filter(Boolean).join(' ');
}

function getAncestorIds(personId: string, unions: Union[]): Set<string> {
  const ids = new Set<string>();
  const queue = [personId];
  while (queue.length > 0) {
    const pid = queue.shift()!;
    if (ids.has(pid)) continue;
    ids.add(pid);
    const pu = unions.find(u => (u.enfants_ids ?? []).includes(pid));
    if (pu) {
      if (pu.pere_id) queue.push(pu.pere_id);
      if (pu.mere_id) queue.push(pu.mere_id);
    }
  }
  return ids;
}

// ── Sub-component: card ────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: TimelineEvent; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const cfg = CFG[event.type];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? cfg.bg : 'var(--cream)',
        border: `1.5px solid ${hov ? cfg.border : 'var(--bd)'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        boxShadow: hov ? 'var(--sh2)' : 'var(--sh)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: cfg.bg, border: `1.5px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, color: cfg.color,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {event.initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</span>
          <span style={{
            fontSize: '10px', fontWeight: 700, color: cfg.color,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textTransform: 'uppercase', letterSpacing: '.08em',
          }}>
            {cfg.label}
          </span>
          {event.approximate && (
            <span style={{ fontSize: '10px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              approx.
            </span>
          )}
        </div>

        <div style={{
          fontSize: '24px', fontWeight: 800, color: 'var(--t1)',
          lineHeight: 1, marginBottom: '5px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {event.year}
        </div>

        <div style={{
          fontSize: '14px', fontWeight: 600, color: 'var(--t1)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {event.personName}
        </div>

        {event.partnerName && (
          <div style={{
            fontSize: '12px', color: 'var(--t2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: '2px',
          }}>
            & {event.partnerName}
          </div>
        )}

        {(event.localite || event.region) && (
          <div style={{
            fontSize: '11px', color: 'var(--t3)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginTop: '5px', display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            <span style={{ color: 'var(--t3)', display: 'flex', alignItems: 'center' }}><IconPin /></span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {[event.localite, event.region].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { timelineCbs } = useTimelineSidebar();

  const [persons,   setPersons]   = useState<Person[]>([]);
  const [unions,    setUnions]    = useState<Union[]>([]);
  const [fetching,  setFetching]  = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);

  // Filters
  const [searchQ,    setSearchQ]    = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [yearMin,    setYearMin]    = useState(1800);
  const [yearMax,    setYearMax]    = useState(new Date().getFullYear());
  const [boundsSet,  setBoundsSet]  = useState(false);

  // Ancestor / person focus
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null);
  const [ancestorIds,   setAncestorIds]   = useState<Set<string>>(new Set());
  const [personSearch,  setPersonSearch]  = useState('');
  const [showSuggest,   setShowSuggest]   = useState(false);

  // Responsive
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Read ?focus on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('focus');
    if (id) setFocusPersonId(id);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const [{ data: ps }, { data: us }] = await Promise.all([
        supabase
          .from('persons')
          .select('id, prenom, nom, genre, deceased, naiss_date, deces_date, naiss_annee, deces_annee, localite, region')
          .eq('owner_id', user.id),
        supabase
          .from('unions')
          .select('id, owner_id, pere_id, mere_id, enfants_ids, date_mariage')
          .eq('owner_id', user.id),
      ]);
      if (!cancelled) {
        setPersons((ps || []) as unknown as Person[]);
        setUnions((us || []) as unknown as Union[]);
        setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Compute ancestors whenever focus or unions change
  useEffect(() => {
    if (!focusPersonId) {
      setAncestorIds(new Set());
      return;
    }
    setAncestorIds(getAncestorIds(focusPersonId, unions));
  }, [focusPersonId, unions]);

  // Person search suggestions
  const personSuggestions = useMemo(() => {
    if (!personSearch.trim()) return [];
    const q = personSearch.toLowerCase();
    return persons.filter(p => personName(p).toLowerCase().includes(q)).slice(0, 8);
  }, [personSearch, persons]);

  const focusPerson = useMemo(
    () => (focusPersonId ? persons.find(p => p.id === focusPersonId) ?? null : null),
    [focusPersonId, persons]
  );

  function handleClearFocus() {
    setFocusPersonId(null);
    setPersonSearch('');
    const url = new URL(window.location.href);
    url.searchParams.delete('focus');
    window.history.replaceState({}, '', url.toString());
  }

  function handleSelectPerson(p: Person) {
    setFocusPersonId(p.id);
    setPersonSearch('');
    setShowSuggest(false);
    const url = new URL(window.location.href);
    url.searchParams.set('focus', p.id);
    window.history.replaceState({}, '', url.toString());
  }

  // Build all events from raw data
  const allEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    const pmap = new Map<string, Person>(persons.map(p => [p.id, p]));

    for (const p of persons) {
      const name = personName(p);
      const ini  = initials(name);

      const ny = p.naiss_date
        ? parseInt(p.naiss_date.slice(0, 4), 10)
        : (p.naiss_annee ?? null);
      if (ny !== null && ny > 1000 && ny <= 2200) {
        events.push({
          id: `n-${p.id}`, year: ny, type: 'naissance',
          personId: p.id, personName: name, initials: ini,
          localite: p.localite ?? undefined, region: p.region ?? undefined,
          approximate: !p.naiss_date,
        });
      }

      if (p.deceased) {
        const dy = p.deces_date
          ? parseInt(p.deces_date.slice(0, 4), 10)
          : (p.deces_annee ?? null);
        if (dy !== null && dy > 1000 && dy <= 2200) {
          events.push({
            id: `d-${p.id}`, year: dy, type: 'deces',
            personId: p.id, personName: name, initials: ini,
            localite: p.localite ?? undefined, region: p.region ?? undefined,
            approximate: !p.deces_date,
          });
        }
      }
    }

    // Mariages — only shown if the union has an explicit date field.
    // created_at is a system timestamp, not a user-provided date, so it is never used.
    for (const u of unions) {
      const raw = (u as unknown as Record<string, unknown>).date_mariage as string | null | undefined;
      if (!raw) continue;
      const year = parseInt(raw.slice(0, 4), 10);
      if (!year || year < 1000 || year > 2200) continue;

      const pere = u.pere_id ? pmap.get(u.pere_id) : null;
      const mere = u.mere_id ? pmap.get(u.mere_id) : null;
      if (!pere && !mere) continue;

      const primary     = pere ?? mere!;
      const partner     = pere && mere ? mere : null;
      const name        = personName(primary);
      const partnerName = partner ? personName(partner) : undefined;

      events.push({
        id: `u-${u.id}`, year, type: 'mariage',
        personId: primary.id, personName: name, initials: initials(name),
        partnerName,
        secondaryPersonId: partner?.id,
        localite: primary.localite ?? undefined, region: primary.region ?? undefined,
        approximate: false,
      });
    }

    return events.sort((a, b) => a.year - b.year);
  }, [persons, unions]);

  // Auto-set year bounds from data on first load
  useEffect(() => {
    if (allEvents.length === 0 || boundsSet) return;
    const years = allEvents.map(e => e.year);
    setYearMin(Math.floor(Math.min(...years) / 10) * 10);
    setYearMax(Math.ceil(Math.max(...years) / 10) * 10);
    setBoundsSet(true);
  }, [allEvents, boundsSet]);

  // Sync sidebar filter callbacks
  useEffect(() => {
    if (timelineCbs) {
      timelineCbs.current = { typeFilter, setTypeFilter };
    }
  });

  // Apply filters
  const events = useMemo<TimelineEvent[]>(() => {
    const q = searchQ.trim().toLowerCase();
    return allEvents.filter(e => {
      if (focusPersonId) {
        const inAncestors = ancestorIds.has(e.personId) ||
          (!!e.secondaryPersonId && ancestorIds.has(e.secondaryPersonId));
        if (!inAncestors) return false;
      }
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (e.year < yearMin || e.year > yearMax) return false;
      if (q && !e.personName.toLowerCase().includes(q) && !(e.partnerName ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEvents, typeFilter, yearMin, yearMax, searchQ, focusPersonId, ancestorIds]);

  // Build rows with decade separators
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    let lastDecade = -1;
    let idx = 0;
    for (const event of events) {
      const decade = Math.floor(event.year / 10) * 10;
      if (decade !== lastDecade) {
        result.push({ kind: 'decade', decade });
        lastDecade = decade;
      }
      result.push({ kind: 'event', event, idx: idx++ });
    }
    return result;
  }, [events]);

  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spin" />
      </div>
    );
  }

  const hasDated = allEvents.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '80px' }}>

      {/* ── Header (style Racines) ── */}
      <div style={{ borderBottom: '1px solid var(--bd)' }}>
        <div style={{ padding: '48px 32px 40px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.12em', color: 'var(--t3)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '12px',
          }}>
            Votre mémoire
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 700,
            fontFamily: "'Cormorant Garamond', serif",
            color: 'var(--t1)',
            lineHeight: 1.2,
            margin: '0 0 12px',
            letterSpacing: '-0.01em',
          }}>
            Chronologie
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
            Les grands moments de votre lignée, dans l'ordre du temps.
          </p>
        </div>
      </div>

      {/* ── Tabs type (style Racines explorer-tabs-bar) ── */}
      <div className="explorer-tabs-bar">
        {(['all', 'naissance', 'deces', 'mariage'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`exp-tab${typeFilter === t ? ' on' : ''}`}
          >
            {t === 'all' ? 'Tous' : CFG[t].label}
          </button>
        ))}
      </div>

      {/* ── Topbar : ancêtre + recherche + période ── */}
      <div className="explorer-topbar">
        {/* Person selector */}
        {focusPerson ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 8px 4px 12px', borderRadius: '20px',
            background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Lignée de {personName(focusPerson)}
            </span>
            <button
              onClick={handleClearFocus}
              aria-label="Effacer la sélection"
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', color: 'var(--green)', fontSize: '16px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px',
              }}
            >×</button>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '200px' }}>
            <input
              value={personSearch}
              onChange={e => { setPersonSearch(e.target.value); setShowSuggest(true); }}
              onFocus={e => { setShowSuggest(true); e.currentTarget.style.borderColor = 'var(--green)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--bd)'; setTimeout(() => setShowSuggest(false), 150); }}
              placeholder="Choisir un ancêtre…"
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '8px',
                border: '1px solid var(--bd)', background: 'var(--bg)',
                fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: 'var(--t1)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {showSuggest && personSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg)', border: '1px solid var(--bd)',
                borderRadius: '8px', boxShadow: 'var(--sh2)', overflow: 'hidden',
              }}>
                {personSuggestions.map((p, i) => (
                  <button
                    key={p.id}
                    onMouseDown={() => handleSelectPerson(p)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: '13px', color: 'var(--t1)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderBottom: i < personSuggestions.length - 1 ? '1px solid var(--bd)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {personName(p)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Filtrer par nom…"
          style={{
            padding: '6px 10px', borderRadius: '8px',
            border: '1px solid var(--bd)', background: 'var(--bg)',
            fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: 'var(--t1)', outline: 'none', minWidth: '140px',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bd)')}
        />

        {/* Year range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>De</span>
          <input
            type="number"
            value={yearMin}
            onChange={e => setYearMin(Number(e.target.value))}
            style={{
              width: '72px', padding: '6px 8px', borderRadius: '7px',
              border: '1px solid var(--bd)', background: 'var(--bg)',
              fontSize: '13px', color: 'var(--t1)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', textAlign: 'center',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bd)')}
          />
          <span style={{ fontSize: '12px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>à</span>
          <input
            type="number"
            value={yearMax}
            onChange={e => setYearMax(Number(e.target.value))}
            style={{
              width: '72px', padding: '6px 8px', borderRadius: '7px',
              border: '1px solid var(--bd)', background: 'var(--bg)',
              fontSize: '13px', color: 'var(--t1)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', textAlign: 'center',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--bd)')}
          />
        </div>
      </div>

      {/* ── Empty state (no dated data at all) ── */}
      {!hasDated && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 32px', gap: '16px', textAlign: 'center',
        }}>
          <span style={{ color: 'var(--t3)' }}><IconCalendar /></span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '22px', fontWeight: 600, color: 'var(--t1)', margin: 0,
          }}>
            Aucune date renseignée
          </h2>
          <p style={{
            fontSize: '14px', color: 'var(--t3)', maxWidth: '400px',
            margin: 0, lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Ajoutez des dates de naissance ou de décès à vos ancêtres pour les voir apparaître sur la chronologie.
          </p>
          <button
            onClick={() => router.push('/monarbre')}
            style={{
              padding: '10px 22px', borderRadius: '10px', border: 'none',
              background: 'var(--green)', color: '#fff', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Aller à Mon Arbre
          </button>
        </div>
      )}

      {/* ── Filtered empty state ── */}
      {hasDated && events.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 32px', gap: '12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--t3)', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Aucun événement ne correspond à vos filtres.
          </p>
        </div>
      )}

      {/* ── Timeline ── */}
      {events.length > 0 && (
        <div style={{
          maxWidth: '980px',
          margin: '0 auto',
          padding: '0 16px',
          position: 'relative',
        }}>
          {/* Central vertical line */}
          <div style={{
            position: 'absolute',
            left: isDesktop ? '50%' : '36px',
            top: 0, bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, transparent 0%, var(--bd) 5%, var(--bd) 95%, transparent 100%)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map(row => {
              if (row.kind === 'decade') {
                return (
                  <div
                    key={`dec-${row.decade}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isDesktop ? 'center' : 'flex-start',
                      paddingTop: '36px',
                      paddingBottom: '28px',
                      paddingLeft: isDesktop ? 0 : '56px',
                      position: 'relative', zIndex: 1,
                    }}
                  >
                    <div style={{
                      background: 'var(--cream)',
                      border: '1.5px solid var(--bd)',
                      borderRadius: '24px',
                      padding: '5px 18px',
                      fontSize: '11px', fontWeight: 800,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: 'var(--t2)',
                      letterSpacing: '.14em',
                      textTransform: 'uppercase',
                      boxShadow: 'var(--sh)',
                    }}>
                      {row.decade}s
                    </div>
                  </div>
                );
              }

              const { event, idx } = row;
              const cfg    = CFG[event.type];
              const isLeft = isDesktop && idx % 2 === 0;

              const dot = (
                <div style={{
                  flexShrink: 0,
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: cfg.color,
                  border: '4px solid var(--bg)',
                  boxShadow: `0 0 0 2px ${cfg.color}`,
                  position: 'relative', zIndex: 2,
                }} />
              );

              const arm = (
                <div style={{
                  width: '28px', height: '2px',
                  background: `linear-gradient(${isLeft ? 'to left' : 'to right'}, transparent, ${cfg.color})`,
                  flexShrink: 0,
                }} />
              );

              if (isDesktop) {
                return (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', paddingTop: '10px', paddingBottom: '10px' }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isLeft && (
                        <>
                          <EventCard event={event} onClick={() => router.push(`/monarbre/${event.personId}`)} />
                          {arm}
                        </>
                      )}
                    </div>
                    {dot}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      {!isLeft && (
                        <>
                          {arm}
                          <EventCard event={event} onClick={() => router.push(`/monarbre/${event.personId}`)} />
                        </>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={event.id} style={{ display: 'flex', alignItems: 'center', paddingTop: '8px', paddingBottom: '8px' }}>
                  <div style={{ width: '10px', flexShrink: 0 }} />
                  {dot}
                  <div style={{ width: '16px', height: '2px', background: `linear-gradient(to right, ${cfg.color}, transparent)`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <EventCard event={event} onClick={() => router.push(`/monarbre/${event.personId}`)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
