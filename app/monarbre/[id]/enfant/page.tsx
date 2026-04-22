'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useDB } from '@/hooks/useDB';
import type { RegionSenegal } from '@/lib/types';

export default function AjouterEnfantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { state } = useAppState();
  const { user } = useAuth();
  const { addPerson, addUnion, updateUnion, loadMyData } = useDB();

  const parent = state.myPersons.find(p => p.id === id);
  const isParentM = parent?.genre === 'M';

  // Seule la mère transmet ses données
  const mere = !isParentM
    ? parent
    : (() => {
        const union = state.myUnions.find(u => u.pere_id === id);
        return union?.mere_id ? state.myPersons.find(p => p.id === union.mere_id) : null;
      })();

  const [genre, setGenre] = useState<'M' | 'F'>('M');
  const [status, setStatus] = useState<'alive' | 'dead'>('alive');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState(parent?.nom || '');
  const [clan, setClan] = useState(mere?.clan || '');
  const [galle, setGalle] = useState(mere?.galle || '');
  const [localite, setLocalite] = useState(mere?.localite || '');
  const [region, setRegion] = useState<RegionSenegal | ''>(parent?.region || '');
  const [naissLieu, setNaissLieu] = useState('');
  const [naissDate, setNaissDate] = useState('');
  const [decesDate, setDecesDate] = useState('');
  const [metier, setMetier] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const regions: RegionSenegal[] = [
    'Dakar',
    'Thiès',
    'Diourbel',
    'Fatick',
    'Kaolack',
    'Kaffrine',
    'Kolda',
    'Ziguinchor',
    'Sédhiou',
    'Tambacounda',
    'Kédougou',
    'Matam',
    'Saint-Louis',
    'Louga',
    'Touba',
  ];

  async function save() {
    if (!prenom.trim()) { alert('Prénom requis.'); return; }
    if (!user) return;
    setSaving(true);
    try {
      const newPerson = await addPerson({
        prenom: prenom.trim(),
        nom: nom.trim().toUpperCase(),
        genre,
        deceased: status === 'dead',
        clan: clan.trim(),
        galle: galle.trim(),
        localite: localite.trim(),
        region: (region || null) as RegionSenegal | null,
        naiss_lieu: naissLieu.trim(),
        naiss_annee: naissDate.trim() ? parseInt(String(naissDate.trim())) : null,
        deces_annee: status === 'dead' && decesDate.trim() ? parseInt(String(decesDate.trim())) : null,
        metier: metier.trim(),
        notes: notes.trim(),
      });

      // Créer l'union parent-enfant
      const existingUnion = state.myUnions.find(u => 
        (isParentM ? u.pere_id === id : u.mere_id === id)
      );

      if (existingUnion) {
        await updateUnion(existingUnion.id, {
          enfants_ids: [...(existingUnion.enfants_ids || []), newPerson.id]
        });
      } else {
        await addUnion({
          pere_id: isParentM ? id : null,
          mere_id: isParentM ? null : id,
          enfants_ids: [newPerson.id]
        });
      }

      await loadMyData();
      router.push(`/monarbre/${newPerson.id}`);
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
      {parent && (
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
            Ajouter un enfant à <strong>{parent.prenom} {parent.nom || ''}</strong>
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
          Ajouter un enfant
        </h1>

        {/* Formulaire */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {/* Genre */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              Genre *
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'M', label: '♂ Homme' },
                { value: 'F', label: '♀ Femme' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGenre(opt.value as 'M' | 'F')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: genre === opt.value ? 'none' : '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: genre === opt.value ? '#2d6a4f' : 'white',
                    color: genre === opt.value ? 'white' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.13s'
                  }}
                  onMouseEnter={(e) => genre !== opt.value && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={(e) => genre !== opt.value && (e.currentTarget.style.backgroundColor = 'white')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prénom et Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Prénom *
              </label>
              <input
                placeholder="Ali, Fatima…"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Nom
              </label>
              <input
                placeholder="HASSANI…"
                value={nom}
                onChange={e => setNom(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9',
                  textTransform: 'uppercase'
                }}
              />
            </div>
          </div>

          {/* Clan et Galle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Clan (Lenyol)
              </label>
              <input
                placeholder="ex: Bani Hamdoun"
                value={clan}
                onChange={e => setClan(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Galle (Surnom)
              </label>
              <input
                placeholder="ex: Mze Komane"
                value={galle}
                onChange={e => setGalle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
          </div>

          {/* Localité et Région */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Localité
              </label>
              <input
                placeholder="ex: Dakar"
                value={localite}
                onChange={e => setLocalite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Région
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value as RegionSenegal | '')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              >
                <option value="">— Choisir —</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Lieu et Date de naissance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Lieu de naissance
              </label>
              <input
                placeholder="ex: Moroni"
                value={naissLieu}
                onChange={e => setNaissLieu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Date de naissance
              </label>
              <input
                type="date"
                value={naissDate}
                onChange={e => setNaissDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
          </div>

          {/* Statut et Date de décès */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
              État
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'alive', label: '🌿 Vivant' },
                { value: 'dead', label: '🕊️ Décédé' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value as 'alive' | 'dead')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: status === opt.value ? 'none' : '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: status === opt.value ? '#2d6a4f' : 'white',
                    color: status === opt.value ? 'white' : '#333',
                    cursor: 'pointer',
                    transition: 'all 0.13s'
                  }}
                  onMouseEnter={(e) => status !== opt.value && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={(e) => status !== opt.value && (e.currentTarget.style.backgroundColor = 'white')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {status === 'dead' && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Date de décès
              </label>
              <input
                type="date"
                value={decesDate}
                onChange={e => setDecesDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
          )}

          {/* Métier et Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Métier
              </label>
              <input
                placeholder="ex: Pécheur"
                value={metier}
                onChange={e => setMetier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d6a4f', marginBottom: 8 }}>
                Notes
              </label>
              <input
                placeholder="Notes additionnelles…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: '#fafaf9'
                }}
              />
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
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
