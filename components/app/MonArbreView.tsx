'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PersonCard from '@/components/app/PersonCard';
import { useDB } from '@/hooks/useDB';
import { useAuth } from '@/hooks/useAuth';
import type { Person } from '@/lib/types';

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function MonArbreView() {
  const { user } = useAuth();
  const { state, updatePerson, deletePerson, toggleMasque, loadMyData } = useDB();
  const router = useRouter();

  const [searchQ, setSearchQ]     = useState('');
  const [aliveOnly, setAliveOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'M' | 'F' | null>(null);
  const [lenyolFilter, setLenyolFilter]   = useState<string | null>(null);
  const [bulkMode, setBulkMode]   = useState(false);
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);

  const myPersons = state.myPersons;
  const alive = myPersons.filter(p => !p.deceased).length;
  const dead  = myPersons.length - alive;

  const lenyols = useMemo(() => {
    const set = new Set(myPersons.map(p => p.clan).filter(Boolean) as string[]);
    return [...set].sort();
  }, [myPersons]);

  const filtered = useMemo(() => {
    let list = myPersons;
    if (aliveOnly) list = list.filter(p => !p.deceased);
    if (genderFilter) list = list.filter(p => p.genre === genderFilter);
    if (lenyolFilter) list = list.filter(p => p.clan === lenyolFilter);
    if (searchQ) {
      const q = normalize(searchQ);
      list = list.filter(p => {
        const target = normalize([p.prenom, p.nom, p.clan, p.localite].filter(Boolean).join(' '));
        return q.split(/\s+/).every(t => target.includes(t));
      });
    }
    return list;
  }, [myPersons, aliveOnly, genderFilter, lenyolFilter, searchQ]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="view-section">
      {/* Banner */}
      {user && (
        <div className="ma-banner">
          <div>
            <div className="ma-banner-ct">
              {myPersons.length} personne{myPersons.length !== 1 ? 's' : ''} dans votre arbre
            </div>
            <div className="ma-banner-sub">
              {myPersons.length === 0 ? 'Commencez par ajouter vos proches'
                : myPersons.length < 5 ? 'Continuez — chaque nom compte'
                : myPersons.length < 20 ? 'Bel arbre !'
                : 'Votre mémoire familiale grandit 🌿'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => router.push('/monarbre/nouveau')}>+ Personne</button>
            <button
              className="btn btn-danger"
              style={{ fontSize: '11px' }}
              onClick={() => { if (confirm('Supprimer tout votre arbre ?')) { /* DELETE_TREE */ } }}
            >🗑</button>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="explorer-topbar">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1, gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--t1)', fontWeight: 600 }}>Mon Arbre</span>
        </div>

        <div className="exp-search">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher…"
          />
        </div>

        <label style={{ fontSize: '12px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={aliveOnly} onChange={e => setAliveOnly(e.target.checked)} />
          🟢 Vivants seulement
        </label>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`f-pill${genderFilter === 'M' ? ' on' : ''}`} onClick={() => setGenderFilter(g => g === 'M' ? null : 'M')}>Hommes</button>
          <button className={`f-pill${genderFilter === 'F' ? ' on' : ''}`} onClick={() => setGenderFilter(g => g === 'F' ? null : 'F')}>Femmes</button>
        </div>

        {lenyols.length > 0 && (
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {lenyols.map(h => (
              <button
                key={h}
                className={`f-pill${lenyolFilter === h ? ' on' : ''}`}
                onClick={() => setLenyolFilter(x => x === h ? null : h)}
                style={{ fontSize: '9px' }}
              >
                ⬡ {h}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>
          {filtered.length} / {myPersons.length}
        </span>

        <div style={{ fontSize: '10px', color: 'var(--t3)', display: 'flex', gap: '8px' }}>
          <span><span style={{ color: '#22C55E' }}>●</span> {alive} en vie</span>
          <span><span style={{ color: 'var(--t3)' }}>●</span> {dead} décédé·s</span>
        </div>

        {user && (
          <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => { setBulkMode(v => !v); setSelectedIds([]); }}>
            {bulkMode ? 'Désactiver sélection' : 'Sélection multiple'}
          </button>
        )}

        {bulkMode && (
          <>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => setSelectedIds(filtered.map(p => p.id))}>Tout</button>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => setSelectedIds([])}>Aucun</button>
          </>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          background: 'var(--green-bg)',
          borderBottom: '1px solid var(--green-bd)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>
            {selectedIds.length} sélectionné{selectedIds.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => {
              (async () => {
                try {
                  await Promise.all(selectedIds.map(id => updatePerson(id, { deceased: false })));
                  await loadMyData();
                  setSelectedIds([]);
                } catch (e) {
                  console.error('Erreur:', e);
                }
              })();
            }}>
              🟢 Vivant
            </button>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => {
              (async () => {
                try {
                  await Promise.all(selectedIds.map(id => updatePerson(id, { deceased: true })));
                  await loadMyData();
                  setSelectedIds([]);
                } catch (e) {
                  console.error('Erreur:', e);
                }
              })();
            }}>
              🕊️ Décédé
            </button>
            <button className="btn btn-sec" style={{ fontSize: '11px' }} onClick={() => {
              const living = selectedIds.filter(id => !myPersons.find(x => x.id === id)?.deceased);
              if (!living.length) return;
              (async () => {
                try {
                  for (const id of living) {
                    const p = myPersons.find(x => x.id === id);
                    if (p && !p.masque) await toggleMasque(p);
                  }
                  await loadMyData();
                  setSelectedIds([]);
                } catch (e) { console.error(e); }
              })();
            }}>
              🔒 Masquer
            </button>
            <button className="btn btn-danger" style={{ fontSize: '11px' }} onClick={() => {
              if (confirm(`Supprimer ${selectedIds.length} personne${selectedIds.length !== 1 ? 's' : ''} ? Cette action ne peut pas être annulée.`)) {
                (async () => {
                  try {
                    await Promise.all(selectedIds.map(id => deletePerson(id)));
                    await loadMyData();
                    setSelectedIds([]);
                  } catch (e) {
                    console.error('Erreur:', e);
                  }
                })();
              }
            }}>
              🗑 Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!user ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center', gap: '12px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 600, color: 'var(--t2)' }}>Mon Arbre</div>
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Connectez-vous pour créer votre arbre.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>
            {myPersons.length === 0 ? 'Aucune personne dans votre arbre. Commencez !' : 'Aucun résultat pour cette recherche.'}
          </div>
          {myPersons.length === 0 && (
            <button className="btn btn-pri" onClick={() => router.push('/monarbre/nouveau')}>+ Ajouter une personne</button>
          )}
        </div>
      ) : (
        <div className="folder-grid">
          {filtered.map(p => (
            <PersonCard
              key={p.id}
              person={p}
              onClick={() => !bulkMode && selectedIds.length === 0 ? router.push(`/monarbre/${p.id}`) : null}
              bulkMode={bulkMode || selectedIds.length > 0}
              selected={selectedIds.includes(p.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
