'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';

export default function UnionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();
  const { state } = useAppState();
  const { deleteUnion, loadMyData } = useDB();

  const union = state.myUnions.find(u => u.id === id);

  if (!union) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--t3)' }}>Mariage introuvable.</div>
        <button className="btn btn-sec" onClick={() => router.push('/monarbre')}>Retour</button>
      </div>
    );
  }

  const pere   = state.myPersons.find(p => p.id === union.pere_id);
  const mere   = state.myPersons.find(p => p.id === union.mere_id);
  const enfants = (union.enfants_ids || []).map(eid => state.myPersons.find(p => p.id === eid)).filter(Boolean);

  async function del() {
    if (!confirm('Supprimer ce mariage ?')) return;
    try {
      await deleteUnion(id);
      await loadMyData();
      router.push('/monarbre');
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  }

  const cardStyle = {
    background: 'var(--cream)', border: '1px solid var(--bd)',
    borderRadius: 'var(--r)', padding: '12px 16px',
    cursor: 'pointer', transition: '.15s',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-sec" style={{ fontSize: 11 }} onClick={() => router.back()}>⬅ Retour</button>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
          Détail du mariage
        </h1>
      </div>

      {/* Parents */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {pere && (
          <div style={{ ...cardStyle, flex: 1 }} onClick={() => router.push(`/monarbre/${pere.id}`)}>
            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Père</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>{pere.prenom}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>{pere.nom || '—'}</div>
          </div>
        )}
        {mere && (
          <div style={{ ...cardStyle, flex: 1 }} onClick={() => router.push(`/monarbre/${mere.id}`)}>
            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1 }}>Mère</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700 }}>{mere.prenom}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>{mere.nom || '—'}</div>
          </div>
        )}
      </div>

      {/* Enfants */}
      {enfants.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Enfants ({enfants.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {enfants.map(k => k && (
              <div key={k.id} style={{ ...cardStyle, minWidth: 120 }} onClick={() => router.push(`/monarbre/${k.id}`)}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700 }}>{k.prenom}</div>
                <div style={{ fontSize: 11, color: 'var(--t2)' }}>{k.nom || '—'}{k.deceased ? ' 🕊️' : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {enfants.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 24 }}>Aucun enfant enregistré pour ce mariage.</div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--bd)' }}>
        <button className="btn btn-danger" onClick={del}>Supprimer le mariage</button>
        {pere && (
          <button className="btn btn-sec" style={{ marginLeft: 'auto' }} onClick={() => router.push(`/monarbre/${pere.id}/mariage`)}>
            ✏ Modifier
          </button>
        )}
      </div>
    </div>
  );
}
