'use client';

import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import type { Person, Union } from '@/lib/types';

type Role = 'pere' | 'mere' | 'enfant' | 'conjoint';

interface Props {
  role: Role;
  forPerson: Person;
  onClose: () => void;
  onCreateNew: (unionId?: string) => void;
  onDone: (linkedPersonId: string) => void;
}

const ROLE_LABELS: Record<Role, { label: string; icon: string; genreFilter?: 'M' | 'F' }> = {
  pere:     { label: 'Père',       icon: '👨', genreFilter: 'M' },
  mere:     { label: 'Mère',       icon: '👩', genreFilter: 'F' },
  enfant:   { label: 'Enfant',     icon: '🌱' },
  conjoint: { label: 'Conjoint·e', icon: '💍' },
};

export default function AddRelationModal({ role, forPerson, onClose, onCreateNew, onDone }: Props) {
  const { state } = useAppState();
  const { addUnion, updateUnion, loadMyData } = useDB();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Pour +enfant avec plusieurs unions : choix de l'union
  const myUnions: Union[] = role === 'enfant'
    ? state.myUnions.filter(u => u.pere_id === forPerson.id || u.mere_id === forPerson.id)
    : [];
  const needUnionPick = role === 'enfant' && myUnions.length > 1;
  const [selectedUnionId, setSelectedUnionId] = useState<string>(myUnions[0]?.id || '');

  const cfg = ROLE_LABELS[role];
  const conjointGenreAttendu: 'M' | 'F' = forPerson.genre === 'M' ? 'F' : 'M';
  const genreFilter = role === 'conjoint' ? conjointGenreAttendu : cfg.genreFilter;

  const candidates = state.myPersons
    .filter(p => {
      if (p.id === forPerson.id) return false;
      if (genreFilter && p.genre !== genreFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.prenom || '').toLowerCase().includes(q) || (p.nom || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

  function getPartnerName(u: Union) {
    const partnerId = u.pere_id === forPerson.id ? u.mere_id : u.pere_id;
    const partner = partnerId ? state.myPersons.find(p => p.id === partnerId) : null;
    return partner ? `${partner.prenom} ${partner.nom || ''}`.trim() : 'Conjoint·e inconnu·e';
  }

  async function confirm() {
    if (!selectedId) return;
    setSaving(true);
    try {
      if (role === 'pere') {
        const existingParent = state.myUnions.find(u => (u.enfants_ids || []).includes(forPerson.id));
        if (existingParent) {
          if (existingParent.pere_id) { alert('Cette fiche a déjà un père.'); setSaving(false); return; }
          await updateUnion(existingParent.id, { pere_id: selectedId });
        } else {
          await addUnion({ pere_id: selectedId, mere_id: null, enfants_ids: [forPerson.id] });
        }
      } else if (role === 'mere') {
        const existingParent = state.myUnions.find(u => (u.enfants_ids || []).includes(forPerson.id));
        if (existingParent) {
          if (existingParent.mere_id) { alert('Cette fiche a déjà une mère.'); setSaving(false); return; }
          await updateUnion(existingParent.id, { mere_id: selectedId });
        } else {
          await addUnion({ pere_id: null, mere_id: selectedId, enfants_ids: [forPerson.id] });
        }
      } else if (role === 'conjoint') {
        const target = state.myPersons.find(p => p.id === selectedId);
        if (!target) throw new Error('Personne introuvable');
        const isTargetH = target.genre === 'M';
        const isMeH = forPerson.genre === 'M';
        await addUnion({
          pere_id: isTargetH ? selectedId : (isMeH ? forPerson.id : null),
          mere_id: isTargetH ? (forPerson.genre === 'F' ? forPerson.id : null) : selectedId,
          enfants_ids: [],
        });
      } else if (role === 'enfant') {
        const unionToUse = selectedUnionId
          ? state.myUnions.find(u => u.id === selectedUnionId)
          : null;
        if (unionToUse) {
          await updateUnion(unionToUse.id, {
            enfants_ids: [...(unionToUse.enfants_ids || []), selectedId],
          });
        } else {
          await addUnion({
            pere_id: forPerson.genre === 'M' ? forPerson.id : null,
            mere_id: forPerson.genre === 'F' ? forPerson.id : null,
            enfants_ids: [selectedId],
          });
        }
      }

      await loadMyData();
      onDone(selectedId);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div className="m-back open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="m-hdr">
          <div className="m-title">{cfg.icon} Ajouter un·e {cfg.label.toLowerCase()}</div>
          <button className="btn btn-sec" style={{ padding: '4px 8px' }} onClick={onClose}>✕</button>
        </div>

        <div className="m-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Choix de l'union si plusieurs mariages */}
          {needUnionPick && (
            <div>
              <label className="f-lbl">De quel mariage est cet enfant ?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myUnions.map(u => (
                  <label
                    key={u.id}
                    onClick={() => setSelectedUnionId(u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 'var(--r-sm)',
                      border: selectedUnionId === u.id ? '2px solid var(--green)' : '1.5px solid var(--bd)',
                      background: selectedUnionId === u.id ? 'var(--green-bg)' : 'transparent',
                      cursor: 'pointer', transition: '.13s',
                    }}
                  >
                    <input type="radio" readOnly checked={selectedUnionId === u.id} style={{ flexShrink: 0, accentColor: 'var(--green)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Avec {getPartnerName(u)}</span>
                    {(u.enfants_ids || []).length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
                        {(u.enfants_ids || []).length} enfant(s)
                      </span>
                    )}
                  </label>
                ))}
                <label
                  onClick={() => setSelectedUnionId('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--r-sm)',
                    border: selectedUnionId === '' ? '2px solid var(--gold)' : '1.5px solid var(--gold-bd)',
                    background: selectedUnionId === '' ? 'var(--gold-bg)' : 'transparent',
                    cursor: 'pointer', transition: '.13s',
                  }}
                >
                  <input type="radio" readOnly checked={selectedUnionId === ''} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>Autre union (sans conjoint·e)</span>
                </label>
              </div>
            </div>
          )}

          {/* Recherche personne existante */}
          <div>
            <label className="f-lbl">Choisir dans votre arbre</label>
            <input
              className="f-input"
              placeholder="Rechercher par prénom ou nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Liste */}
          <div style={{
            maxHeight: 240, overflowY: 'auto',
            border: '1px solid var(--bd)', borderRadius: 'var(--r-sm)',
            background: 'var(--cream)',
          }}>
            {candidates.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>
                Aucune personne trouvée.
              </div>
            ) : candidates.map(p => (
              <label
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--bd)',
                  cursor: 'pointer',
                  background: selectedId === p.id ? 'var(--green-bg)' : 'transparent',
                  transition: '.13s',
                }}
              >
                <input type="radio" readOnly checked={selectedId === p.id} style={{ flexShrink: 0, accentColor: 'var(--green)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.prenom} {p.nom || ''}</div>
                  {(p.clan || p.localite) && (
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {[p.clan ? `Lenyol ${p.clan}` : null, p.localite].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                {p.deceased && <span style={{ fontSize: 11 }}>🕊️</span>}
              </label>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
            <span style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
          </div>

          <button
            className="btn btn-sec"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onCreateNew(needUnionPick ? selectedUnionId : undefined)}
          >
            + Créer une nouvelle personne
          </button>
        </div>

        <div className="m-foot">
          <button className="btn btn-sec" onClick={onClose}>Annuler</button>
          <button
            className="btn btn-pri"
            disabled={!selectedId || saving}
            onClick={confirm}
          >
            {saving ? 'En cours…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
