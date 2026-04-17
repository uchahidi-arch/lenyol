'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import type { Person, Union } from '@/lib/types';

function pName(p: Person) { return [p.prenom, p.nom].filter(Boolean).join(' '); }

export default function MariagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();
  const searchParams = useSearchParams();
  const unionId        = searchParams.get('unionId');
  const conjointGenre  = searchParams.get('conjointGenre') as 'M' | 'F' | null;
  const { state } = useAppState();
  const { addUnion, updateUnion, deleteUnion, loadMyData } = useDB();

  const person = state.myPersons.find(p => p.id === id);
  const isHomme = person?.genre === 'M';
  const existingUnion = unionId ? state.myUnions.find(u => u.id === unionId) : null;
  const isModify = !!existingUnion;

  const men   = state.myPersons.filter(p => p.genre === 'M' && p.id !== id).sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));
  const women = state.myPersons.filter(p => p.genre === 'F' && p.id !== id).sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

  const [pereId,     setPereId]     = useState(isHomme || existingUnion?.pere_id ? existingUnion?.pere_id || (isHomme ? id : '') : '');
  const [mereId,     setMereId]     = useState(!isHomme || existingUnion?.mere_id ? existingUnion?.mere_id || (!isHomme ? id : '') : '');
  const [kidsIds,    setKidsIds]    = useState<string[]>(existingUnion?.enfants_ids || []);
  const [kidsFilter, setKidsFilter] = useState('');
  const [kidsStatus, setKidsStatus] = useState<'all' | 'alive' | 'dead'>('all');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!existingUnion) {
      setPereId(isHomme ? id : '');
      setMereId(isHomme ? '' : id);
    }
  }, [id, isHomme, existingUnion]);

  const existingWarn = pereId && mereId && !isModify ? (() => {
    const exists = state.myUnions.find(u => u.pere_id === pereId && u.mere_id === mereId);
    return exists ? '⚠️ Ce couple existe déjà.' : '';
  })() : '';

  const filteredKids = state.myPersons.filter(p => {
    if (p.id === pereId || p.id === mereId) return false;
    if (kidsStatus === 'alive' && p.deceased) return false;
    if (kidsStatus === 'dead'  && !p.deceased) return false;
    if (kidsFilter) {
      const q = kidsFilter.toLowerCase();
      return (p.prenom || '').toLowerCase().includes(q) || (p.nom || '').toLowerCase().includes(q);
    }
    return true;
  });

  const toggleKid = (kid: string) => setKidsIds(prev => prev.includes(kid) ? prev.filter(k => k !== kid) : [...prev, kid]);

  async function del() {
    if (!existingUnion) return;
    if (!confirm('Supprimer ce mariage ? Cette action est irréversible.')) return;
    try {
      await deleteUnion(existingUnion.id);
      await loadMyData();
      router.push(`/monarbre/${id}`);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  }

  async function save() {
    if (!pereId && !mereId) { alert('Choisissez au moins un parent.'); return; }
    if (pereId && mereId && pereId === mereId) { alert('Le père et la mère doivent être différents.'); return; }
    setSaving(true);
    try {
      if (isModify && existingUnion) {
        await updateUnion(existingUnion.id, { pere_id: pereId || null, mere_id: mereId || null, enfants_ids: kidsIds });
      } else {
        await addUnion({ pere_id: pereId || null, mere_id: mereId || null, enfants_ids: kidsIds });
      }
      await loadMyData();
      router.push(`/monarbre/${id}`);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      backgroundColor: 'transparent',
      paddingTop: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Bannière contextuelle */}
      {person && (
        <div style={{
          width: '100%',
          backgroundColor: '#e8f4e8',
          borderBottom: '1px solid #c7e9c7',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13
        }}>
          <svg width="16" height="16" fill="none" stroke="#2d6a4f" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span style={{ color: '#2d6a4f', fontWeight: 600 }}>
            {isModify ? 'Modifier le mariage de' : 'Ajouter un mariage pour'} <strong>{person.prenom} {person.nom || ''}</strong>
          </span>
        </div>
      )}

      <div style={{ 
        width: '100%',
        maxWidth: 680,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        <h1 style={{ 
          fontFamily: "'Cormorant Garamond', serif", 
          fontSize: 28, 
          fontWeight: 700, 
          margin: 0,
          color: '#2d6a4f'
        }}>
          {isModify ? 'Modifier le mariage' : 'Ajouter un mariage'}
        </h1>

        {/* Formulaire */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {/* Père */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Père
            </label>
            <select 
              value={pereId} 
              onChange={e => setPereId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#333',
                backgroundColor: '#fafaf9'
              }}
            >
              <option value="">— Choisir —</option>
              {men.map(p => <option key={p.id} value={p.id}>{pName(p)}</option>)}
            </select>
          </div>

          {/* Mère */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Mère
            </label>
            <select 
              value={mereId} 
              onChange={e => setMereId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#333',
                backgroundColor: '#fafaf9'
              }}
            >
              <option value="">— Choisir —</option>
              {women.map(p => <option key={p.id} value={p.id}>{pName(p)}</option>)}
            </select>
          </div>

          {existingWarn && (
            <div style={{ 
              backgroundColor: '#fff8f0', 
              border: '1px solid #fbd38d', 
              padding: '10px 12px', 
              borderRadius: 6, 
              marginBottom: 20, 
              fontSize: 12, 
              color: '#92400e' 
            }}>
              {existingWarn}
            </div>
          )}

          {/* Recherche enfant */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Rechercher un enfant
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                placeholder="Nom, prénom…" 
                value={kidsFilter}
                onChange={e => setKidsFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 32px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
              <svg 
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </div>

          {/* Filtre Afficher */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Afficher
            </label>
            <select 
              value={kidsStatus} 
              onChange={e => setKidsStatus(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                color: '#333',
                backgroundColor: '#fafaf9'
              }}
            >
              <option value="all">Tous</option>
              <option value="alive">Vivants</option>
              <option value="dead">Décédés</option>
            </select>
          </div>

          {/* Liste enfants scrollable */}
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Enfants de ce mariage
            </label>
            <div style={{
              maxHeight: 280,
              overflowY: 'auto',
              border: '1px solid #e5e5e5',
              borderRadius: 6,
              backgroundColor: '#fafaf9'
            }}>
              {filteredKids.length === 0 ? (
                <div style={{ fontSize: 13, color: '#999', padding: 16, textAlign: 'center' }}>
                  Aucun enfant disponible
                </div>
              ) : (
                filteredKids.map(p => (
                  <label 
                    key={p.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      backgroundColor: kidsIds.includes(p.id) ? '#f0fdf4' : 'transparent',
                      transition: 'background-color 0.13s',
                    }}
                    onMouseEnter={(e) => !kidsIds.includes(p.id) && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseLeave={(e) => !kidsIds.includes(p.id) && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <input 
                      type="checkbox" 
                      checked={kidsIds.includes(p.id)} 
                      onChange={() => toggleKid(p.id)}
                      style={{ cursor: 'pointer', accentColor: '#2d6a4f' }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      color: '#333'
                    }}>
                      {p.prenom} {p.nom || ''}{p.deceased ? ' 🕊️' : ''}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          paddingTop: 16
        }}>
          {isModify && (
            <button
              onClick={del}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: '#dc2626',
                color: 'white',
                cursor: 'pointer',
                marginRight: 'auto',
                transition: 'all 0.13s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              🗑 Supprimer
            </button>
          )}
          <button
            onClick={() => router.back()}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.13s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Annuler
          </button>
          <button 
            onClick={save}
            disabled={saving}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#2d6a4f',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.13s'
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#1f4c38')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#2d6a4f')}
          >
            {saving ? (isModify ? 'Modification…' : 'Enregistrement…') : (isModify ? 'Modifier' : 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
}
