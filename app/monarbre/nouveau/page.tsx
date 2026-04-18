'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/hooks/useAuth';
import { useDB } from '@/hooks/useDB';
import type { Ethnie, RegionSenegal } from '@/lib/types';

type Genre   = 'M' | 'F';
type Status  = 'alive' | 'dead';
type Relation = 'pere' | 'mere' | 'enfant' | 'conjoint';

const REGIONS: RegionSenegal[] = [
  'Dakar','Thiès','Diourbel','Fatick','Kaolack','Kaffrine',
  'Kolda','Ziguinchor','Sédhiou','Tambacounda','Kédougou',
  'Matam','Saint-Louis','Louga','Touba',
];

const ETHNIES: Ethnie[] = [
  'Wolof','Sérère','Peul','Toucouleur','Mandingue','Diola','Soninké','Lébou','Autre',
];

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"\-]/g, ' ').toLowerCase();
}

function NouveauForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { state }   = useAppState();
  const { user }    = useAuth();
  const { addPerson, addUnion, updateUnion, loadMyData, searchPersons } = useDB();

  const relation   = params.get('relation') as Relation | null;
  const relatedId  = params.get('relatedId');
  const unionId    = params.get('unionId');
  const genreParam = params.get('genre') as Genre | null;

  const related = relatedId ? [...state.myPersons, ...state.allPersons].find(p => p.id === relatedId) : null;

  const [genre,     setGenre]     = useState<Genre>(genreParam || (relation === 'mere' ? 'F' : 'M'));
  const [status,    setStatus]    = useState<Status>('alive');
  const [prenom,    setPrenom]    = useState('');
  const [nom,       setNom]       = useState('');
  const [region,    setRegion]    = useState('');
  const [ethnie,    setEthnie]    = useState('');
  const [clan,      setClan]      = useState('');
  const [galle,     setGalle]     = useState('');
  const [localite,  setLocalite]  = useState('');
  const [naissDate, setNaissDate] = useState('');
  const [naissLieu, setNaissLieu] = useState('');
  const [decesDate, setDecesDate] = useState('');
  const [metier,    setMetier]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [advOpen,   setAdvOpen]   = useState(!!relation);
  const [loading,   setLoading]   = useState(false);
  const [doublons,  setDoublons]  = useState<any[]>([]);

  const doublonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (related && relation === 'enfant') {
      const mere = related.genre === 'F'
        ? related
        : (() => {
            const allPersons = [...state.myPersons, ...state.allPersons];
            const union = unionId
              ? state.myUnions.find(u => u.id === unionId)
              : state.myUnions.find(u => u.pere_id === related.id);
            return union?.mere_id ? allPersons.find(p => p.id === union.mere_id) : null;
          })();
      if (mere) {
        setLocalite(mere.localite || '');
        setClan(mere.clan || '');
        setGalle(mere.galle || '');
        setRegion(mere.region || '');
      }
    }
  }, [relatedId]);

  const checkDoublons = useCallback(() => {
    const pv = normalize(prenom).replace(/\s+/g, '');
    const nv = normalize(nom).replace(/\s+/g, '');
    if (pv.length < 3 && nv.length < 3) { setDoublons([]); return; }
    if (doublonTimer.current) clearTimeout(doublonTimer.current);
    doublonTimer.current = setTimeout(async () => {
      try {
        const words = `${prenom} ${nom}`.split(' ').filter(w => w.length >= 3);
        const word = words.reduce((a, b) => a.length > b.length ? a : b, words[0] || prenom || nom);
        const dbWord = normalize(word).replace(/[aeiouy\s\-']/g, '_');
        const results = await searchPersons(dbWord);
        const matches = results.filter((p: any) => {
          const pp = normalize(p.prenom).replace(/\s+/g, '');
          const pn = normalize(p.nom || '').replace(/\s+/g, '');
          if (pv && nv) return pp.includes(pv) && pn.includes(nv);
          if (pv) return pp.includes(pv);
          if (nv) return pn.includes(nv);
          return false;
        });
        setDoublons(matches.slice(0, 3));
      } catch { setDoublons([]); }
    }, 500);
  }, [prenom, nom]);

  useEffect(() => { checkDoublons(); }, [prenom, nom]);

  async function handleRelation(newId: string, newGenre: Genre) {
    if (!relation || !relatedId) return;
    const myUnions = state.myUnions;
    if (relation === 'pere' || relation === 'mere') {
      const pu = myUnions.find(u => (u.enfants_ids || []).includes(relatedId));
      const field = relation === 'pere' ? 'pere_id' : 'mere_id';
      if (pu) {
        if (!pu[field]) await updateUnion(pu.id, { [field]: newId });
        else await addUnion({ pere_id: relation === 'pere' ? newId : pu.pere_id, mere_id: relation === 'mere' ? newId : pu.mere_id, enfants_ids: [relatedId] });
      } else {
        await addUnion({ pere_id: relation === 'pere' ? newId : null, mere_id: relation === 'mere' ? newId : null, enfants_ids: [relatedId] });
      }
    } else if (relation === 'enfant') {
      const myU = myUnions.filter(u => u.pere_id === relatedId || u.mere_id === relatedId);
      if (myU.length) {
        await updateUnion(myU[0].id, { enfants_ids: [...(myU[0].enfants_ids || []), newId] });
      } else {
        const isM = related?.genre === 'M';
        await addUnion({ pere_id: isM ? relatedId : null, mere_id: isM ? null : relatedId, enfants_ids: [newId] });
      }
    } else if (relation === 'conjoint') {
      const isM = related?.genre === 'M';
      await addUnion({
        pere_id: isM ? relatedId : (newGenre === 'M' ? newId : null),
        mere_id: isM ? (newGenre === 'F' ? newId : null) : relatedId,
        enfants_ids: [],
      });
    }
  }

  async function save() {
    if (!prenom.trim()) { alert('Prénom requis.'); return; }
    if (!user) return;
    setLoading(true);
    try {
      const np = await addPerson({
        prenom: prenom.trim(),
        nom: nom.trim().toUpperCase(),
        genre,
        deceased: status === 'dead',
        prefix_lignee: '',
        clan: clan.trim(),
        galle: galle.trim(),
        localite: localite.trim(),
        region: (region || null) as RegionSenegal | null,
        naiss_lieu: naissLieu.trim(),
        naiss_date: naissDate.trim(),
        deces_date: status === 'dead' ? decesDate.trim() : '',
        metier: metier.trim(),
        notes: notes.trim(),
        ethnie: (ethnie as Ethnie) || null,
      });
      if (relation && relatedId) await handleRelation(np.id, genre);
      await loadMyData();
      router.push(`/monarbre/${np.id}`);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  }

  const relationLabel: Record<Relation, string> = {
    pere: 'Sera le père de',
    mere: 'Sera la mère de',
    enfant: 'Sera un enfant de',
    conjoint: 'Sera le/la conjoint·e de',
  };

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '32px 24px',
      maxWidth: 560, margin: '0 auto', width: '100%',
    }}>

      {/* Titre page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, padding: 0,
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--t1)',
        }}>
          Nouvelle personne
        </h1>
      </div>

      {/* Contexte relation */}
      {relation && related && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12,
        }}>
          <span style={{ color: 'var(--t3)' }}>{relationLabel[relation]} : </span>
          <strong style={{ color: 'var(--green)' }}>{related.prenom} {related.nom || ''}</strong>
        </div>
      )}

      {/* Genre */}
      <div style={{ marginBottom: 20 }}>
        <label className="f-lbl">Genre *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setGenre('M')}
            style={{
              padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: genre === 'M' ? '2px solid var(--green)' : '1.5px solid var(--bd)',
              background: genre === 'M' ? 'var(--green-bg)' : 'white',
              color: genre === 'M' ? 'var(--green)' : 'var(--t2)',
              transition: 'all .15s',
            }}
          >
            Homme
          </button>
          <button
            type="button"
            onClick={() => setGenre('F')}
            style={{
              padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: genre === 'F' ? '2px solid var(--green)' : '1.5px solid var(--bd)',
              background: genre === 'F' ? 'var(--green-bg)' : 'white',
              color: genre === 'F' ? 'var(--green)' : 'var(--t2)',
              transition: 'all .15s',
            }}
          >
            Femme
          </button>
        </div>
      </div>

      {/* Prénom / Nom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label className="f-lbl">Prénom *</label>
          <input className="f-input" placeholder="Ali, Fatima…" value={prenom} onChange={e => setPrenom(e.target.value)} />
        </div>
        <div>
          <label className="f-lbl">Nom de famille</label>
          <input className="f-input" placeholder="NDIAYE…" style={{ textTransform: 'uppercase' }} value={nom} onChange={e => setNom(e.target.value.toUpperCase())} />
        </div>
      </div>

      {/* Doublons */}
      {doublons.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d',
          padding: '10px 12px', marginBottom: 16, borderRadius: 8, fontSize: 12,
        }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
            Cette personne existe peut-être déjà dans le registre
          </div>
          {doublons.map((m: any) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{m.prenom} {m.nom || ''}{m.localite ? ' — ' + m.localite : ''}</span>
              <button type="button" className="btn btn-sec" style={{ fontSize: 10 }} onClick={() => router.push(`/registre/${m.id}`)}>
                Voir la fiche
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Région */}
      <div style={{ marginBottom: 16 }}>
        <label className="f-lbl">Région</label>
        <select className="f-sel" value={region} onChange={e => setRegion(e.target.value)} style={{ marginTop: 6 }}>
          <option value="">— Choisir une région —</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Ethnie */}
      <div style={{ marginBottom: 20 }}>
        <label className="f-lbl">Ethnie</label>
        <select className="f-sel" value={ethnie} onChange={e => setEthnie(e.target.value)} style={{ marginTop: 6 }}>
          <option value="">— Choisir une ethnie —</option>
          {ETHNIES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, background: 'var(--bd)', marginBottom: 20 }} />

      {/* Statut */}
      <div style={{ marginBottom: 20 }}>
        <label className="f-lbl">Statut</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setStatus('alive')}
            style={{
              padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: status === 'alive' ? '2px solid var(--green)' : '1.5px solid var(--bd)',
              background: status === 'alive' ? 'var(--green-bg)' : 'white',
              color: status === 'alive' ? 'var(--green)' : 'var(--t2)',
              transition: 'all .15s',
            }}
          >
            En vie
          </button>
          <button
            type="button"
            onClick={() => setStatus('dead')}
            style={{
              padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: status === 'dead' ? '2px solid #6B7280' : '1.5px solid var(--bd)',
              background: status === 'dead' ? '#F3F4F6' : 'white',
              color: status === 'dead' ? '#374151' : 'var(--t2)',
              transition: 'all .15s',
            }}
          >
            Décédé·e
          </button>
        </div>
      </div>

      {/* Dates naissance + lieu — toujours visible */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: status === 'dead' ? 12 : 20 }}>
        <div>
          <label className="f-lbl">Année de naissance</label>
          <input className="f-input" placeholder="1945" value={naissDate} onChange={e => setNaissDate(e.target.value)} />
        </div>
        <div>
          <label className="f-lbl">Lieu de naissance</label>
          <input className="f-input" placeholder="Dakar, Marseille…" value={naissLieu} onChange={e => setNaissLieu(e.target.value)} />
        </div>
      </div>

      {/* Date de décès (si décédé) */}
      {status === 'dead' && (
        <div style={{ marginBottom: 20 }}>
          <label className="f-lbl">Année de décès</label>
          <input className="f-input" placeholder="2010" value={decesDate} onChange={e => setDecesDate(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
      )}

      {/* Toggle détails supplémentaires */}
      <button
        type="button"
        onClick={() => setAdvOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 13,
          fontWeight: 600, padding: '4px 0', marginBottom: 16,
        }}
      >
        <svg
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {advOpen ? 'Masquer les détails' : 'Plus de détails'}
      </button>

      {advOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>

          {/* Clan (Lenyol) */}
          <div>
            <label className="f-lbl">Clan · Lenyol</label>
            <input
              className="f-input"
              placeholder="Ex : Guèdj, Thiossane, Fwambaya…"
              value={clan}
              onChange={e => setClan(e.target.value)}
            />
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
              La branche précise à l'intérieur du nom de famille
            </div>
          </div>

          {/* Galle + Localité */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="f-lbl">Galle (foyer)</label>
              <input className="f-input" placeholder="Sangani…" value={galle} onChange={e => setGalle(e.target.value)} />
            </div>
            <div>
              <label className="f-lbl">Localité d'origine</label>
              <input className="f-input" placeholder="Saint-Louis…" value={localite} onChange={e => setLocalite(e.target.value)} />
            </div>
          </div>

          {/* Métier */}
          <div>
            <label className="f-lbl">Métier / Titre</label>
            <input className="f-input" placeholder="Journaliste, Marabout, Enseignant…" value={metier} onChange={e => setMetier(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="f-lbl">Notes</label>
            <textarea
              className="f-ta"
              placeholder="Anecdotes, récits, souvenirs…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--bd)',
      }}>
        <button className="btn btn-sec" onClick={() => router.back()}>Annuler</button>
        <button
          className="btn btn-pri"
          onClick={save}
          disabled={loading}
          style={{ minWidth: 120 }}
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

export default function NouveauPage() {
  return (
    <Suspense fallback={<div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><div className="spin" /></div>}>
      <NouveauForm />
    </Suspense>
  );
}
