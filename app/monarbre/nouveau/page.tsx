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

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"\-]/g, ' ').toLowerCase();
}

function NouveauForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { state }    = useAppState();
  const { user }     = useAuth();
  const { addPerson, addUnion, updateUnion, loadMyData, searchPersons } = useDB();

  const relation   = params.get('relation') as Relation | null;
  const relatedId  = params.get('relatedId');
  const unionId    = params.get('unionId');
  const genreParam = params.get('genre') as Genre | null;

  const related = relatedId ? [...state.myPersons, ...state.allPersons].find(p => p.id === relatedId) : null;

  // Form fields
  const [genre,     setGenre]     = useState<Genre>(genreParam || (relation === 'mere' ? 'F' : 'M'));
  const [status,    setStatus]    = useState<Status>('alive');
  const [prenom,    setPrenom]    = useState('');
  const [nom,       setNom]       = useState('');
  const [prefix,    setPrefix]    = useState('');
  const [clan,      setClan]      = useState('');
  const [galle,     setGalle]     = useState('');
  const [localite,  setLocalite]  = useState('');
  const [region,    setRegion]    = useState('');
  const [naissLieu, setNaissLieu] = useState('');
  const [naissDate, setNaissDate] = useState('');
  const [decesDate, setDecesDate] = useState('');
  const [metier,    setMetier]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [ethnie,    setEthnie]    = useState('');
  const [advOpen,   setAdvOpen]   = useState(!!relation);
  const [loading,   setLoading]   = useState(false);
  const [doublons,  setDoublons]  = useState<any[]>([]);

  const doublonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill : seule la mère transmet ses données à l'enfant
  useEffect(() => {
    if (related && relation === 'enfant') {
      // Chercher la mère : si related est une femme c'est elle, sinon chercher sa conjointe
      const mere = related.genre === 'F'
        ? related
        : (() => {
            const allPersons = [...state.myPersons, ...state.allPersons];
            // Chercher dans l'union sélectionnée si précisée, sinon la première
            const union = unionId
              ? state.myUnions.find(u => u.id === unionId)
              : state.myUnions.find(u => u.pere_id === related.id);
            return union?.mere_id ? allPersons.find(p => p.id === union.mere_id) : null;
          })();

      if (mere) {
        setLocalite(mere.localite || '');
        setClan(mere.clan || '');
        setPrefix(mere.prefix_lignee || '');
        setGalle(mere.galle || '');
        setRegion(mere.region || '');
      }
      // Si pas de mère trouvée, on ne pré-remplit rien
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
        prefix_lignee: prefix,
        clan: clan.trim(),
        galle: galle.trim(),
        localite: localite.trim(),
        region: (region || null) as RegionSenegal | null,
        naiss_lieu: naissLieu.trim(),
        naiss_date: naissDate.trim(),
        deces_date: status === 'dead' ? decesDate.trim() : '',
        metier: metier.trim(),
        notes: notes.trim(),
        ethnie: ethnie as Ethnie || null
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 540, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-sec" style={{ fontSize: 11 }} onClick={() => router.back()}>⬅ Retour</button>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Nouvelle personne
        </h1>
      </div>

      {/* Relation context */}
      {relation && related && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
          <span style={{ color: 'var(--t3)' }}>{relationLabel[relation]} : </span>
          <strong style={{ color: 'var(--green)' }}>{related.prenom} {related.nom || ''}</strong>
        </div>
      )}

      {/* Genre */}
      <div className="f-row">
        <label className="f-lbl">Genre *</label>
        <div className="g-row">
          <button className={`g-btn${genre === 'M' ? ' sel' : ''}`} type="button" onClick={() => setGenre('M')}>♂ Homme</button>
          <button className={`g-btn${genre === 'F' ? ' sel' : ''}`} type="button" onClick={() => setGenre('F')}>♀ Femme</button>
        </div>
      </div>

      {/* Prénom / Nom */}
      <div className="f-row-2">
        <div>
          <label className="f-lbl">Prénom *</label>
          <input className="f-input" placeholder="Ali, Fatima…" value={prenom} onChange={e => setPrenom(e.target.value)} />
        </div>
        <div>
          <label className="f-lbl">Nom</label>
          <input className="f-input" placeholder="HASSANI…" style={{ textTransform: 'uppercase' }} value={nom} onChange={e => setNom(e.target.value.toUpperCase())} />
        </div>
      </div>

      {/* Doublons */}
      {doublons.length > 0 && (
        <div style={{ background: '#fff8f1', border: '1px solid #fbd38d', padding: '10px 12px', marginBottom: 12, borderRadius: 6, fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 8 }}>⚠️ Cette personne existe peut-être déjà !</div>
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

      {/* Statut */}
      <div className="f-row">
        <label className="f-lbl">Statut *</label>
        <div className="g-row">
          <button className={`g-btn${status === 'alive' ? ' sel' : ''}`} type="button" onClick={() => setStatus('alive')}>🟢 En vie</button>
          <button className={`g-btn${status === 'dead'  ? ' sel' : ''}`} type="button" onClick={() => setStatus('dead')}>🕊️ Décédé·e</button>
        </div>
      </div>

      {status === 'dead' && (
        <div className="f-row">
          <label className="f-lbl">Date de décès</label>
          <input className="f-input" placeholder="2010…" value={decesDate} onChange={e => setDecesDate(e.target.value)} />
        </div>
      )}

      {/* Toggle avancé */}
      <button className="toggle-adv" type="button" onClick={() => setAdvOpen(v => !v)}>
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
          style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>{advOpen ? 'Masquer les détails' : 'Informations avancées'}</span>
      </button>

      {advOpen && (
        <div className="form-adv open">
          <div className="f-sec">Lignée Matrilinéaire</div>
          <div className="f-row">
            <label className="f-lbl">Préfixe (Ba/Bint) + Lenyol / Clan</label>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
              <select className="f-sel" value={prefix} onChange={e => setPrefix(e.target.value)}>
                <option value="">— —</option>
                <option value="Lenyol">Lenyol</option>
                <option value="Ba">Ba</option>
              </select>
              <input className="f-input" placeholder="Ex : Fwambaya…" value={clan} onChange={e => setClan(e.target.value)} />
            </div>
          </div>
          <div className="f-row-2">
            <div>
              <label className="f-lbl">Galle (surnom)</label>
              <input className="f-input" placeholder="Sangani…" value={galle} onChange={e => setGalle(e.target.value)} />
            </div>
            <div>
              <label className="f-lbl">Localité d'origine</label>
              <input className="f-input" placeholder="Dakar…" value={localite} onChange={e => setLocalite(e.target.value)} />
            </div>
          </div>
          <div className="f-sec">Biographie</div>
          <div className="f-row-2">
            <div>
              <label className="f-lbl">Région</label>
              <select className="f-sel" value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">— Choisir —</option>
                <option>Dakar</option>
                <option>Thiès</option>
                <option>Diourbel</option>
                <option>Fatick</option>
                <option>Kaolack</option>
                <option>Kaffrine</option>
                <option>Kolda</option>
                <option>Ziguinchor</option>
                <option>Sédhiou</option>
                <option>Tambacounda</option>
                <option>Kédougou</option>
                <option>Matam</option>
                <option>Saint-Louis</option>
                <option>Louga</option>
                <option>Touba</option>
              </select>
            </div>
            <div>
              <label className="f-lbl">Lieu de naissance</label>
              <input className="f-input" placeholder="Marseille…" value={naissLieu} onChange={e => setNaissLieu(e.target.value)} />
            </div>
          </div>
          <div className="f-row-2">
            <div>
              <label className="f-lbl">Date de naissance</label>
              <input className="f-input" placeholder="1945…" value={naissDate} onChange={e => setNaissDate(e.target.value)} />
            </div>
            <div>
              <label className="f-lbl">Métier / Titre</label>
              <input className="f-input" placeholder="Journaliste, Marabout…" value={metier} onChange={e => setMetier(e.target.value)} />
            </div>
          </div>
          <div className="f-row">
            <label className="f-lbl">Ethnie</label>
            <select className="f-sel" value={ethnie} onChange={e => setEthnie(e.target.value)} name="ethnie">
              <option value="">— Choisir —</option>
              <option value="Wolof">Wolof</option>
              <option value="Sérère">Sérère</option>
              <option value="Peul">Peul</option>
              <option value="Toucouleur">Toucouleur</option>
              <option value="Mandingue">Mandingue</option>
              <option value="Diola">Diola</option>
              <option value="Soninké">Soninké</option>
              <option value="Lébou">Lébou</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div className="f-row">
            <label className="f-lbl">Notes</label>
            <textarea className="f-ta" placeholder="Anecdotes, récits…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)' }}>
        <button className="btn btn-sec" onClick={() => router.back()}>Annuler</button>
        <button className="btn btn-pri" onClick={save} disabled={loading}>
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
