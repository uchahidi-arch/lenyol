'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import TreeView from '@/components/app/TreeView';
import RelierModal from '@/components/app/RelierModal';
import { exportPersonPDF } from '@/lib/exportPDF';
import type { Person, Union } from '@/lib/types';

type FicheTab = 'fiche' | 'arbre';



export default function PersonView({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { state, showToast } = useAppState();
  const { fetchPerson, fetchParentUnionOf } = useDB();

  const [tab, setTab] = useState<FicheTab>('fiche');
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [parentUnion, setParentUnion] = useState<Union | null>(null);
  const [childUnions, setChildUnions] = useState<Union[]>([]);
  const [personMap, setPersonMap] = useState<Map<string, Person>>(new Map());
  const [fullSibIds, setFullSibIds] = useState<string[]>([]);
  const [halfFatherIds, setHalfFatherIds] = useState<string[]>([]);
  const [halfMotherIds, setHalfMotherIds] = useState<string[]>([]);
  const [relierTarget, setRelierTarget] = useState<Person | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPerson(null);
    setParentUnion(null);
    setChildUnions([]);
    setPersonMap(new Map());
    setFullSibIds([]);
    setHalfFatherIds([]);
    setHalfMotherIds([]);

    (async () => {
      const { supabase } = await import('@/lib/supabase');

      const [{ data: pData }, { data: puData }, { data: cuData }] = await Promise.all([
        supabase.from('persons').select('*').eq('id', id).single(),
        supabase.from('unions').select('*').contains('enfants_ids', [id]).limit(1),
        supabase.from('unions').select('*').or(`pere_id.eq.${id},mere_id.eq.${id}`),
      ]);

      if (cancelled) return;

      const p = pData as Person | null;
      const pu = (puData as Union[] | null)?.[0] ?? null;
      const cus = (cuData as Union[] | null) ?? [];

      setPerson(p);
      setParentUnion(pu);
      setChildUnions(cus);

      let fullSibU: Union[] = [];
      let halfFatherU: Union[] = [];
      let halfMotherU: Union[] = [];

      if (pu) {
        const orParts: string[] = [];
        if (pu.pere_id) orParts.push(`pere_id.eq.${pu.pere_id}`);
        if (pu.mere_id) orParts.push(`mere_id.eq.${pu.mere_id}`);

        if (orParts.length > 0) {
          const { data: sibData } = await supabase
            .from('unions').select('*').or(orParts.join(','));
          if (cancelled) return;

          const allPU = (sibData as Union[] | null) ?? [];
          fullSibU = allPU.filter(u => u.pere_id === pu.pere_id && u.mere_id === pu.mere_id && u.id !== pu.id);
          halfFatherU = pu.pere_id
            ? allPU.filter(u => u.pere_id === pu.pere_id && u.mere_id !== pu.mere_id && u.id !== pu.id)
            : [];
          halfMotherU = pu.mere_id
            ? allPU.filter(u => u.mere_id === pu.mere_id && u.pere_id !== pu.pere_id && u.id !== pu.id)
            : [];
        }
      }

      const allIds = new Set<string>();
      if (pu?.pere_id) allIds.add(pu.pere_id);
      if (pu?.mere_id) allIds.add(pu.mere_id);

      const fullSibLocal = (pu?.enfants_ids ?? []).filter(eid => eid !== id);
      fullSibLocal.forEach(eid => allIds.add(eid));
      fullSibU.forEach(u => u.enfants_ids.forEach(eid => { if (eid !== id) allIds.add(eid); }));

      const hfIds: string[] = [];
      halfFatherU.forEach(u => u.enfants_ids.forEach(eid => {
        if (eid !== id) { hfIds.push(eid); allIds.add(eid); }
      }));

      const hmIds: string[] = [];
      halfMotherU.forEach(u => u.enfants_ids.forEach(eid => {
        if (eid !== id) { hmIds.push(eid); allIds.add(eid); }
      }));

      cus.forEach(u => u.enfants_ids.forEach(eid => allIds.add(eid)));

      if (allIds.size > 0) {
        const { data: batchData } = await supabase
          .from('persons').select('*').in('id', [...allIds]);
        if (cancelled) return;
        const pMap = new Map<string, Person>();
        ((batchData as Person[] | null) ?? []).forEach(pp => pMap.set(pp.id, pp));
        setPersonMap(pMap);
      }

      const allFullSibIds = [
        ...fullSibLocal,
        ...fullSibU.flatMap(u => u.enfants_ids.filter(eid => eid !== id)),
      ];
      setFullSibIds([...new Set(allFullSibIds)]);
      setHalfFatherIds([...new Set(hfIds)]);
      setHalfMotherIds([...new Set(hmIds)]);

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id]);

  function makeExportCtx() {
    const allPersons = [...state.myPersons, ...state.allPersons];
    const allUnions  = [...state.myUnions, ...state.allUnions];
    return {
      getPersonById: (pid: string) => allPersons.find(p => p.id === pid) ?? null,
      getParentUnionOf: (pid: string) => allUnions.find(u => (u.enfants_ids || []).includes(pid)) ?? null,
      fetchPerson,
      fetchParentUnionOf,
    };
  }

  const navigateTo = (pid: string) => router.push(`/registre/${pid}`);

  const PersonLink = ({ pid }: { pid: string }) => {
    const p = personMap.get(pid);
    if (!p) return <span style={{ fontSize: '14px', color: 'var(--t3)' }}>—</span>;
    if (p.masque) return <em style={{ fontSize: '14px', color: 'var(--t3)', fontStyle: 'italic' }}>Privé</em>;
    return (
      <button
        onClick={() => navigateTo(p.id)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: '14px', color: 'var(--green)', fontWeight: 500,
          textDecoration: 'underline', textDecorationStyle: 'dotted',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {p.prenom} {p.nom}
      </button>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spin" style={{ width: 28, height: 28, borderWidth: 2 }} />
      </div>
    );
  }

  if (!person) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--t3)' }}>
        Personne introuvable.
      </div>
    );
  }

  const birthYear = person.naiss_annee ? String(person.naiss_annee) : '';
  const deathYear = person.deces_annee ? String(person.deces_annee) : '';
  const childIds = [...new Set(childUnions.flatMap(u => u.enfants_ids))];

  const sectionHead: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--t1)',
    margin: '0 0 12px 0',
    letterSpacing: '-0.01em',
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    padding: '4px 20px',
    border: '1px solid var(--bd)',
    boxShadow: '0 2px 12px rgba(20,18,13,0.05)',
  };


  return (
    <>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', padding: '0 0 28px 0', cursor: 'pointer',
            fontSize: '13px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          ← Retour
        </button>

        {/* Avatar + Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: person.genre === 'M' ? '#1a3a2a' : '#5a2d4a', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, marginBottom: 16,
          }}>
            {(person.prenom?.[0] || '').toUpperCase()}{(person.nom?.[0] || '').toUpperCase()}
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700, color: 'var(--t1)',
            lineHeight: 1.15, margin: '0 0 6px 0', letterSpacing: '-0.02em',
          }}>
            {person.prenom} {person.nom?.toUpperCase()}
          </h1>

          {(birthYear || deathYear || person.deceased) && (
            <p style={{ fontSize: '16px', color: '#888', margin: '0 0 16px 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {birthYear || '?'}{person.deceased ? ` – ${deathYear || '?'}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {person.deceased && (
              <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f0f0f0', fontSize: 13, color: '#666' }}>
                Décédé-e
              </span>
            )}
            {person.ethnie && (
              <span style={{ padding: '4px 12px', borderRadius: 20, background: '#e8f5ee', fontSize: 13, color: '#2d5a3d' }}>
                {person.ethnie}
              </span>
            )}
            {person.region && (
              <span
                onClick={() => router.push(`/registre/${person.region}`)}
                style={{ padding: '4px 12px', borderRadius: 20, background: '#f0f4ff', fontSize: 13, color: '#3b5bdb', cursor: 'pointer' }}
              >
                {person.region}
              </span>
            )}
          </div>

          {/* Identité condensée */}
          {(() => {
            const parts = [
              person.naiss_lieu || (person.naiss_annee ? `Né·e en ${person.naiss_annee}` : null),
              person.localite,
              [person.prefix_lignee, person.clan].filter(Boolean).join(' ') || null,
              person.metier,
            ].filter(Boolean);
            return parts.length > 0 ? (
              <p style={{ fontSize: 13, color: '#aaa', margin: '14px 0 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6 }}>
                {parts.join(' · ')}
              </p>
            ) : null;
          })()}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: '0 0 0 0' }} />

        {/* Tabs — en haut */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--bd)', marginBottom: '32px' }}>
          {(['fiche', 'arbre'] as FicheTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 24px', marginBottom: '-2px',
                fontSize: '14px', fontWeight: 600,
                color: tab === t ? 'var(--green)' : 'var(--t3)',
                borderBottom: `2px solid ${tab === t ? 'var(--green)' : 'transparent'}`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.01em',
                transition: 'color 0.15s',
              }}
            >
              {t === 'fiche' ? 'Fiche' : 'Arbre'}
            </button>
          ))}
        </div>

        {/* ── FICHE TAB ── */}
        {tab === 'fiche' && (
          <div>
            {(() => {
              const partnerIds = [...new Set(
                childUnions
                  .map(u => u.pere_id === id ? u.mere_id : u.pere_id)
                  .filter((pid): pid is string => !!pid)
              )];
              const rows: { label: string; pid: string }[] = [];
              if (parentUnion?.pere_id) rows.push({ label: 'Père', pid: parentUnion.pere_id });
              if (parentUnion?.mere_id) rows.push({ label: 'Mère', pid: parentUnion.mere_id });
              partnerIds.forEach(pid => {
                const p = personMap.get(pid);
                const label = p?.genre === 'F' ? 'Épouse' : p?.genre === 'M' ? 'Mari' : 'Conjoint·e';
                rows.push({ label, pid });
              });
              childIds.forEach((pid, i) => rows.push({ label: i === 0 && childIds.length === 1 ? 'Enfant' : i === 0 ? 'Enfants' : '', pid }));

              if (rows.length === 0) return (
                <p style={{ color: 'var(--t3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                  Aucune relation enregistrée.
                </p>
              );
              return (
                <div style={card}>
                  {rows.map((r, i) => (
                    <div key={r.pid + i} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '12px 0',
                      borderBottom: i < rows.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--t3)', width: 100, flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {r.label}
                      </span>
                      <PersonLink pid={r.pid} />
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Notes */}
            {person.notes && (
              <section style={{ marginTop: 28 }}>
                <h2 style={sectionHead}>Notes</h2>
                <div style={{ ...card, padding: '16px 20px', fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>
                  {person.notes}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── ARBRE TAB ── */}
        {tab === 'arbre' && (
          <div style={{ height: '70vh', minHeight: '400px', position: 'relative' }}>
            <TreeView
              personId={id}
              scope="reg"
              onBack={() => setTab('fiche')}
              onNavigateTo={navigateTo}
              onExportPDF={(pid) => exportPersonPDF(pid, 'reg', makeExportCtx())}
              onRelier={(p) => {
                if (!user) { router.push('/'); return; }
                setRelierTarget(p);
              }}
            />
          </div>
        )}

        {/* Bandeau Ajouté par — sous les tabs */}
        {(person.created_by_name || person.created_at) && (
          <div style={{
            borderTop: '1px solid #f0ede8', marginTop: 40, padding: '16px 0',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 13, color: '#aaa',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#2d5a3d', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {(person.created_by_name?.[0] ?? 'U').toUpperCase()}
            </div>
            <span>
              Fiche créée par{' '}
              <strong style={{ color: '#555' }}>{person.created_by_name ?? 'Utilisateur'}</strong>
              {person.created_at && ` · ${new Date(person.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </span>
          </div>
        )}
      </div>

      {relierTarget && (
        <RelierModal
          isOpen={true}
          targetPerson={relierTarget}
          myPersons={state.myPersons}
          myUnions={state.myUnions}
          allUnions={state.allUnions}
          currentUserId={user?.id ?? ''}
          currentUserName={[profile?.prenom, profile?.nom].filter(Boolean).join(' ')}
          onSuccess={async () => {}}
          onToast={(msg, type) => showToast(msg, type)}
          onClose={() => setRelierTarget(null)}
          onDone={(linkedId) => {
            setRelierTarget(null);
            router.push(`/monarbre/${linkedId}`);
          }}
        />
      )}
    </>
  );
}
