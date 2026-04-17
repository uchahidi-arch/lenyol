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

function yearStr(d?: string | null): string {
  if (!d) return '';
  const m = d.match(/^(\d{4})/);
  return m ? m[1] : '';
}

function InfoRow({ label, value, isPrivate }: {
  label: string;
  value?: string | null;
  isPrivate?: boolean;
}) {
  if (!value && !isPrivate) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '16px',
      padding: '11px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <span style={{
        fontSize: '12px', color: 'var(--t3)', width: '148px',
        flexShrink: 0, paddingTop: '1px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {label}
      </span>
      {isPrivate
        ? <em style={{ fontSize: '14px', color: 'var(--t3)', fontStyle: 'italic' }}>Privé</em>
        : <span style={{
            fontSize: '14px', color: 'var(--t1)', fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5,
          }}>
            {value}
          </span>
      }
    </div>
  );
}

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

  const birthYear = yearStr(person.naiss_date);
  const deathYear = yearStr(person.deces_date);
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

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    padding: '11px 0',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  };

  const rowLast: React.CSSProperties = { ...rowStyle, borderBottom: 'none' };

  const subGroupLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: 'var(--t3)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 8px 0',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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

        {/* Name */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 700,
          color: 'var(--t1)',
          lineHeight: 1.15,
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
        }}>
          {person.prenom} {person.nom}
        </h1>

        {(birthYear || deathYear || person.deceased) && (
          <p style={{
            fontSize: '16px', color: 'var(--t3)', margin: '0 0 28px 0',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {birthYear || '?'}{person.deceased ? ` – ${deathYear || '?'}` : ''}
          </p>
        )}

        {/* Tabs */}
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
            <section style={{ marginBottom: '36px' }}>
              <h2 style={sectionHead}>Informations</h2>
              <div style={card}>
                <InfoRow label="Naissance" value={person.naiss_date} />
                <InfoRow label="Décès" value={person.deces_date} />
                <InfoRow label="Ethnie" value={person.ethnie} />
                <InfoRow
                  label="Lenyol (lignée)"
                  value={[person.prefix_lignee, person.clan].filter(Boolean).join(' ') || null}
                />
                <InfoRow label="Caste" value={person.caste} />
                <InfoRow label="Royaume d'origine" value={person.royaume} />
                <InfoRow label="Région" value={person.region} />
                <InfoRow label="Localité" value={person.localite} />
              </div>
            </section>

            {/* Parents */}
            {(parentUnion?.pere_id || parentUnion?.mere_id) && (
              <section style={{ marginBottom: '36px' }}>
                <h2 style={sectionHead}>Parents</h2>
                <div style={card}>
                  {parentUnion.pere_id && (
                    <div style={parentUnion.mere_id ? rowStyle : rowLast}>
                      <span style={{ fontSize: '12px', color: 'var(--t3)', width: '148px', flexShrink: 0 }}>Père</span>
                      <PersonLink pid={parentUnion.pere_id} />
                    </div>
                  )}
                  {parentUnion.mere_id && (
                    <div style={rowLast}>
                      <span style={{ fontSize: '12px', color: 'var(--t3)', width: '148px', flexShrink: 0 }}>Mère</span>
                      <PersonLink pid={parentUnion.mere_id} />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Frères et sœurs */}
            {(fullSibIds.length > 0 || halfFatherIds.length > 0 || halfMotherIds.length > 0) && (
              <section style={{ marginBottom: '36px' }}>
                <h2 style={sectionHead}>Frères et sœurs</h2>

                {fullSibIds.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={subGroupLabel}>Même père et même mère</p>
                    <div style={card}>
                      {fullSibIds.map((pid, i) => (
                        <div key={pid} style={i === fullSibIds.length - 1 ? rowLast : rowStyle}>
                          <PersonLink pid={pid} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {halfFatherIds.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={subGroupLabel}>Même père seulement</p>
                    <div style={card}>
                      {halfFatherIds.map((pid, i) => (
                        <div key={pid} style={i === halfFatherIds.length - 1 ? rowLast : rowStyle}>
                          <PersonLink pid={pid} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {halfMotherIds.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={subGroupLabel}>Même mère seulement</p>
                    <div style={card}>
                      {halfMotherIds.map((pid, i) => (
                        <div key={pid} style={i === halfMotherIds.length - 1 ? rowLast : rowStyle}>
                          <PersonLink pid={pid} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Enfants */}
            {childIds.length > 0 && (
              <section style={{ marginBottom: '36px' }}>
                <h2 style={sectionHead}>Enfants</h2>
                <div style={card}>
                  {childIds.map((pid, i) => (
                    <div key={pid} style={i === childIds.length - 1 ? rowLast : rowStyle}>
                      <PersonLink pid={pid} />
                    </div>
                  ))}
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
              onBack={() => router.back()}
              onNavigateTo={navigateTo}
              onExportPDF={(pid) => exportPersonPDF(pid, 'reg', makeExportCtx())}
              onRelier={(p) => {
                if (!user) { router.push('/'); return; }
                setRelierTarget(p);
              }}
            />
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
