'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import PhotoUpload from '@/components/PhotoUpload';
import type { Ethnie, RegionSenegal } from '@/lib/types';

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
  const [telephone, setTelephone] = useState('');
  const [adresse,   setAdresse]   = useState('');
  const [advOpen,   setAdvOpen]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [ready,     setReady]     = useState(false);
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null);

  useEffect(() => {
    const p = state.myPersons.find(x => x.id === id);
    if (p) {
      setGenre((p.genre as Genre) || 'M');
      setStatus(p.deceased ? 'dead' : 'alive');
      setPrenom(p.prenom || '');
      setNom(p.nom || '');
      setClan(p.clan || '');
      setGalle(p.galle || '');
      setLocalite(p.localite || '');
      setRegion(p.region || '');
      setNaissLieu(p.naiss_lieu || '');
      setNaissDate(p.naiss_annee != null ? String(p.naiss_annee) : '');
      setDecesDate(p.deces_annee != null ? String(p.deces_annee) : '');
      setMetier(p.metier || '');
      setNotes(p.notes || '');
      setEthnie((p as any).ethnie || '');
      setTelephone(p.telephone || '');
      setAdresse(p.adresse || '');
      setPhotoUrl(p.photo_url || null);
      setReady(true);
    } else {
      fetchPerson(id).then(p => {
        if (!p) { router.replace('/monarbre'); return; }
        setGenre((p.genre as Genre) || 'M');
        setStatus(p.deceased ? 'dead' : 'alive');
        setPrenom(p.prenom || '');
        setNom(p.nom || '');
        setClan(p.clan || '');
        setGalle(p.galle || '');
        setLocalite(p.localite || '');
        setRegion(p.region || '');
        setNaissLieu(p.naiss_lieu || '');
        setNaissDate(p.naiss_annee != null ? String(p.naiss_annee) : '');
        setDecesDate(p.deces_annee != null ? String(p.deces_annee) : '');
        setMetier(p.metier || '');
        setNotes(p.notes || '');
        setEthnie((p as any).ethnie || '');
        setTelephone(p.telephone || '');
        setAdresse(p.adresse || '');
        setPhotoUrl(p.photo_url || null);
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
        clan: clan.trim(),
        galle: galle.trim(),
        localite: localite.trim(),
        region: (region || null) as RegionSenegal | null,
        naiss_lieu: naissLieu.trim(),
        naiss_annee: naissDate.trim() ? parseInt(String(naissDate.trim())) : null,
        deces_annee: status === 'dead' && decesDate.trim() ? parseInt(String(decesDate.trim())) : null,
        metier: metier.trim(),
        notes: notes.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        ethnie: ethnie as Ethnie || null,
      });
      if (genre === 'F') {
        await propagateMaternalLineage(id, {
          clan: clan.trim(),
          localite: localite.trim(),
          region: (region || null) as RegionSenegal | null,
          galle: galle.trim(),
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', maxWidth: 560, margin: '0 auto', width: '100%' }}>
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--t1)',
        }}>
          Modifier la personne
        </h1>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <PhotoUpload
          currentPhotoUrl={photoUrl}
          bucketPath={`${id}.jpg`}
          prenom={prenom}
          size={120}
          onUpload={async (newUrl) => {
            setPhotoUrl(newUrl);
            await updatePerson(id, { photo_url: newUrl });
          }}
          onError={(err) => alert(err)}
        />
      </div>

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

      <div style={{ marginBottom: 16 }}>
        <label className="f-lbl">Région</label>
        <select className="f-sel" value={region} onChange={e => setRegion(e.target.value)} style={{ marginTop: 6 }}>
          <option value="">— Choisir une région —</option>
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

      <div style={{ marginBottom: 20 }}>
        <label className="f-lbl">Ethnie</label>
        <select className="f-sel" value={ethnie} onChange={e => setEthnie(e.target.value)} style={{ marginTop: 6 }}>
          <option value="">— Choisir une ethnie —</option>
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

      {status === 'dead' && (
        <div style={{ marginBottom: 20 }}>
          <label className="f-lbl">Année de décès</label>
          <input className="f-input" placeholder="2010" value={decesDate} onChange={e => setDecesDate(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
      )}

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
          style={{ transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span>{advOpen ? 'Masquer les détails' : 'Plus de détails'}</span>
      </button>

      {advOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
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

          <div>
            <label className="f-lbl">Métier / Titre</label>
            <input className="f-input" placeholder="Journaliste, Marabout, Enseignant…" value={metier} onChange={e => setMetier(e.target.value)} />
          </div>

          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', marginBottom: 12 }}>Coordonnées</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="f-lbl">Téléphone</label>
                <input className="f-input" placeholder="Ex: +221 77 000 00 00" value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
              <div>
                <label className="f-lbl">Adresse</label>
                <input className="f-input" placeholder="Ex: Dakar, Médina" value={adresse} onChange={e => setAdresse(e.target.value)} />
              </div>
            </div>
          </div>

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

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--bd)' }}>
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
