'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import type { RegionSenegal } from '@/lib/types';

type Genre  = 'M' | 'F';
type Status = 'alive' | 'dead';

export default function ModifierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();
  const { state } = useAppState();
  const { updatePerson, propagateMaternalLineage, deletePerson, loadMyData, fetchPerson } = useDB();

  const [genre,     setGenre]     = useState<Genre>('M');
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
  const [advOpen,   setAdvOpen]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [ready,     setReady]     = useState(false);

  useEffect(() => {
    const p = state.myPersons.find(x => x.id === id);
    if (p) {
      setGenre((p.genre as Genre) || 'M');
      setStatus(p.deceased ? 'dead' : 'alive');
      setPrenom(p.prenom || '');
      setNom(p.nom || '');
      setPrefix(p.prefix_lignee || '');
      setClan(p.clan || '');
      setGalle(p.galle || '');
      setLocalite(p.localite || '');
      setRegion(p.region || '');
      setNaissLieu(p.naiss_lieu || '');
      setNaissDate(p.naiss_date || '');
      setDecesDate(p.deces_date || '');
      setMetier(p.metier || '');
      setNotes(p.notes || '');
      setEthnie((p as any).ethnie || '');
      setReady(true);
    } else {
      fetchPerson(id).then(p => {
        if (!p) { router.replace('/monarbre'); return; }
        setGenre((p.genre as Genre) || 'M');
        setStatus(p.deceased ? 'dead' : 'alive');
        setPrenom(p.prenom || '');
        setNom(p.nom || '');
        setPrefix(p.prefix_lignee || '');
        setClan(p.clan || '');
        setGalle(p.galle || '');
        setLocalite(p.localite || '');
        setRegion(p.region || '');
        setNaissLieu(p.naiss_lieu || '');
        setNaissDate(p.naiss_date || '');
        setDecesDate(p.deces_date || '');
        setMetier(p.metier || '');
        setNotes(p.notes || '');
        setEthnie((p as any).ethnie || '');
        setReady(true);
      });
    }
  }, [id]);

  async function save() {
    if (!prenom.trim()) { alert('Prénom requis.'); return; }
    setLoading(true);
    try {
      await updatePerson(id, {
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
        ethnie: ethnie || null,
      });
      // Si c'est une femme, propager ses données à toute sa lignée matrilinéaire
      if (genre === 'F') {
        await propagateMaternalLineage(id, {
          clan: clan.trim(),
          localite: localite.trim(),
          region: (region || null) as RegionSenegal | null,
          galle: galle.trim(),
          prefix_lignee: prefix,
        });
      }
      await loadMyData();
      router.push(`/monarbre/${id}`);
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
    setLoading(false);
  }

  async function del() {
    if (!confirm('Supprimer cette personne ? Irréversible.')) return;
    setLoading(true);
    try {
      await deletePerson(id);
      await loadMyData();
      router.push('/monarbre');
    } catch {
      alert('Erreur lors de la suppression.');
    }
    setLoading(false);
  }

  if (!ready) return <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><div className="spin" /></div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 540, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-sec" style={{ fontSize: 11 }} onClick={() => router.back()}>⬅ Retour</button>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Modifier la personne
        </h1>
      </div>

      <div className="f-row">
        <label className="f-lbl">Genre *</label>
        <div className="g-row">
          <button className={`g-btn${genre === 'M' ? ' sel' : ''}`} type="button" onClick={() => setGenre('M')}>♂ Homme</button>
          <button className={`g-btn${genre === 'F' ? ' sel' : ''}`} type="button" onClick={() => setGenre('F')}>♀ Femme</button>
        </div>
      </div>

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

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bd)' }}>
        <button className="btn btn-danger" onClick={del} disabled={loading}>Supprimer</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sec" onClick={() => router.back()}>Annuler</button>
          <button className="btn btn-pri" onClick={save} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
