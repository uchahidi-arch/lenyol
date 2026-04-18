'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import PersonCard from '@/components/app/PersonCard';

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function MonArbrePage() {
  const router        = useRouter();
  const { user, profile } = useAuth();
  const { state }     = useAppState();

  const { importGEDCOM } = useDB();
  const gedcomRef = useRef<HTMLInputElement>(null);

  const [searchQ, setSearchQ]         = useState('');
  const [aliveOnly, setAliveOnly]     = useState(false);
  const [genreFilter, setGenreFilter] = useState<'M' | 'F' | null>(null);

  const myPersons = state.myPersons;
  const unions = state.myUnions.length;

  const generations = useMemo(() => {
    const years = myPersons
      .map(p => p.naiss_date ? parseInt(p.naiss_date.slice(0, 4)) : null)
      .filter((y): y is number => y !== null && !isNaN(y));
    if (years.length === 0) return 1;
    return Math.max(1, Math.ceil((Math.max(...years) - Math.min(...years)) / 25) + 1);
  }, [myPersons]);

  const firstName = profile?.prenom || user?.email?.split('@')[0] || '';

  const filtered = useMemo(() => {
    let list = myPersons;
    if (aliveOnly) list = list.filter(p => !p.deceased);
    if (genreFilter) list = list.filter(p => p.genre === genreFilter);
    if (searchQ) {
      const q = normalize(searchQ);
      list = list.filter(p => {
        const target = normalize([p.prenom, p.nom, p.clan, p.localite].filter(Boolean).join(' '));
        return q.split(/\s+/).every(t => target.includes(t));
      });
    }
    return list;
  }, [myPersons, aliveOnly, genreFilter, searchQ]);

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* En-tête — titre + sous-titre uniquement, borderBottom = le délimiteur */}
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
          {firstName ? `${firstName}, votre lignée vous attend.` : 'Votre lignée vous attend.'}
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
          Votre famille, vos ancêtres, votre royaume — en un seul endroit.
        </p>
      </div>
      </div>

      {/* Barre stats — pleine largeur, juste après le délimiteur (état non vide) */}
      {myPersons.length > 0 && (
        <div style={{
          padding: '11px 32px 11px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
          background: '#FAFAF9',
          fontSize: 13,
          color: 'var(--t3)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{myPersons.length}</span>
          <span style={{ marginLeft: 4 }}>personne{myPersons.length > 1 ? 's' : ''}</span>
          <span style={{ margin: '0 8px', opacity: 0.35 }}>·</span>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{generations}</span>
          <span style={{ marginLeft: 4 }}>génération{generations > 1 ? 's' : ''}</span>
          <span style={{ margin: '0 8px', opacity: 0.35 }}>·</span>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{unions}</span>
          <span style={{ marginLeft: 4 }}>famille{unions > 1 ? 's' : ''} connectée{unions > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Étapes — arbre vide, sous le délimiteur */}
      {myPersons.length === 0 && (
        <div style={{ padding: '28px 32px 8px var(--page-left)', display: 'flex', alignItems: 'flex-start', gap: 0, flexWrap: 'wrap' }}>
          {[
            { n: '1', titre: 'Ajoutez-vous', desc: 'Commencez par vous-même comme point de départ.' },
            { n: '2', titre: 'Ajoutez vos parents', desc: 'Reliez vos parents et grands-parents.' },
            { n: '3', titre: 'Remontez vers vos ancêtres', desc: 'Explorez et complétez votre lignée.' },
          ].map((step, i) => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '14px 16px',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 8,
                background: '#FAFAF9',
                maxWidth: 160,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.04em', opacity: 0.7 }}>
                  {step.n}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.3 }}>
                  {step.titre}
                </span>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5 }}>
                  {step.desc}
                </span>
              </div>
              {i < 2 && (
                <div style={{ alignSelf: 'center', padding: '0 6px', color: 'var(--t3)', fontSize: 14, opacity: 0.4 }}>›</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions — toujours sous le délimiteur (ou sous les étapes) */}
      <div style={{ padding: '20px 32px 20px var(--page-left)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-pri" onClick={() => router.push('/monarbre/nouveau')} style={{ fontSize: 13 }}>
          Ajouter une personne
        </button>
        <button className="btn btn-sec" onClick={() => router.push('/monarbre/union/nouvelle')} style={{ fontSize: 13 }}>
          Ajouter un mariage
        </button>
        <input ref={gedcomRef} type="file" accept=".ged,.gedcom" style={{ display: 'none' }} onChange={importGEDCOM} />
        <button className="btn btn-sec" onClick={() => gedcomRef.current?.click()} style={{ fontSize: 13 }}>
          Importer GEDCOM
        </button>
      </div>

      {/* Barre de filtres */}
      {myPersons.length > 0 && (
        <div style={{
          padding: '14px 32px 14px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
          background: '#FAFAF9',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          {/* Recherche */}
          <div className="exp-search" style={{ flex: 1, minWidth: 180, maxWidth: 280 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher…"
            />
          </div>

          {/* Vivants */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={aliveOnly} onChange={e => setAliveOnly(e.target.checked)} />
            En vie seulement
          </label>

          {/* Genre */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`f-pill${genreFilter === 'M' ? ' on' : ''}`} onClick={() => setGenreFilter(g => g === 'M' ? null : 'M')}>Hommes</button>
            <button className={`f-pill${genreFilter === 'F' ? ' on' : ''}`} onClick={() => setGenreFilter(g => g === 'F' ? null : 'F')}>Femmes</button>
          </div>

          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
            {filtered.length} / {myPersons.length}
          </span>
        </div>
      )}

      {/* Grille de personnes */}
      {myPersons.length === 0 ? null : filtered.length === 0 ? (
        <div style={{ padding: '60px 32px 60px var(--page-left)', fontSize: 13, color: 'var(--t3)' }}>
          Aucun résultat pour cette recherche.
        </div>
      ) : (
        <div className="folder-grid" style={{ padding: '28px 32px 28px var(--page-left)' }}>
          {filtered.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              onClick={() => router.push(`/monarbre/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
