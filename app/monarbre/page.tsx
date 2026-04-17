'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import type { Person } from '@/lib/types';

function pName(p: Person) { return [p.prenom, p.nom].filter(Boolean).join(' '); }

export default function NouvelleUnionPage() {
  const router    = useRouter();
  const { state } = useAppState();
  const { addUnion, loadMyData } = useDB();

  const men   = state.myPersons.filter(p => p.genre === 'M').sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));
  const women = state.myPersons.filter(p => p.genre === 'F').sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

  const [pereId,     setPereId]     = useState('');
  const [mereId,     setMereId]     = useState('');
  const [kidsIds,    setKidsIds]    = useState<string[]>([]);
  const [kidsFilter, setKidsFilter] = useState('');
  const [saving,     setSaving]     = useState(false);

  const existingWarn = pereId && mereId ? (() => {
    const exists = state.myUnions.find(u => u.pere_id === pereId && u.mere_id === mereId);
    return exists ? '⚠️ Ce couple existe déjà.' : '';
  })() : '';

  const filteredKids = state.myPersons.filter(p => {
    if (p.id === pereId || p.id === mereId) return false;
    if (kidsFilter) {
      const q = kidsFilter.toLowerCase();
      return (p.prenom || '').toLowerCase().includes(q) || (p.nom || '').toLowerCase().includes(q);
    }
    return true;
  });

  const toggleKid = (kid: string) => setKidsIds(prev => prev.includes(kid) ? prev.filter(k => k !== kid) : [...prev, kid]);

  async function save() {
    if (!pereId && !mereId) { alert('Choisissez au moins un parent.'); return; }
    if (pereId && mereId && pereId === mereId) { alert('Le père et la mère doivent être différents.'); return; }
    setSaving(true);
    try {
      await addUnion({ pere_id: pereId || null, mere_id: mereId || null, enfants_ids: kidsIds });
      await loadMyData();
      router.push('/monarbre');
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 540, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-sec" style={{ fontSize: 11 }} onClick={() => router.back()}>⬅ Retour</button>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Nouveau mariage
        </h1>
      </div>

      <div className="f-row">
        <label className="f-lbl">Père</label>
        <select className="f-sel" value={pereId} onChange={e => setPereId(e.target.value)}>
          <option value="">— Choisir —</option>
          {men.map(p => <option key={p.id} value={p.id}>{pName(p)}</option>)}
        </select>
      </div>

      <div className="f-row">
        <label className="f-lbl">Mère</label>
        <select className="f-sel" value={mereId} onChange={e => setMereId(e.target.value)}>
          <option value="">— Choisir —</option>
          {women.map(p => <option key={p.id} value={p.id}>{pName(p)}</option>)}
        </select>
      </div>

      {existingWarn && (
        <div style={{ background: '#fff8f1', border: '1px solid #fbd38d', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
          {existingWarn}
        </div>
      )}

      <div className="f-row" style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }}
          width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input className="f-input" placeholder="Rechercher un enfant…" value={kidsFilter}
          onChange={e => setKidsFilter(e.target.value)} style={{ paddingLeft: 28 }} />
      </div>

      <div className="f-row">
        <label className="f-lbl">Enfants de ce mariage</label>
        <div className="kids-sel">
          {filteredKids.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--t3)', padding: 8 }}>Aucun enfant disponible</div>
          ) : filteredKids.map(p => (
            <label key={p.id} className={`kid-item${kidsIds.includes(p.id) ? ' on' : ''}`}>
              <input type="checkbox" style={{ display: 'none' }} checked={kidsIds.includes(p.id)} onChange={() => toggleKid(p.id)} />
              <span className={`kid-av ${p.genre || 'M'}`}>{(p.prenom?.[0] || '?').toUpperCase()}</span>
              <span className="kid-name">{p.prenom} {p.nom || ''}{p.deceased ? ' 🕊️' : ''}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)' }}>
        <button className="btn btn-sec" onClick={() => router.back()}>Annuler</button>
        <button className="btn btn-pri" onClick={save} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
