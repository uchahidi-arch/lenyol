'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import TreeView from '@/components/app/TreeView';
import AddRelationModal from '@/components/app/AddRelationModal';
import RelierModal from '@/components/app/RelierModal';
import { exportPersonPDF } from '@/lib/exportPDF';
import type { Person, Union } from '@/lib/types';
import { computeUnionScore } from '@/lib/reliability';

type FicheTab = 'fiche' | 'arbre';
type Role = 'pere' | 'mere' | 'enfant' | 'conjoint';

export default function MonArbrePersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { state, showToast } = useAppState();
  const { fetchPerson, fetchParentUnionOf } = useDB();

  const [tab, setTab] = useState<FicheTab>('fiche');
  const [loading, setLoading] = useState(true);
  const [relLoading, setRelLoading] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [parentUnion, setParentUnion] = useState<Union | null>(null);
  const [childUnions, setChildUnions] = useState<Union[]>([]);
  const [personMap, setPersonMap] = useState<Map<string, Person>>(new Map());
  const [relierTarget, setRelierTarget] = useState<Person | null>(null);
  const [modal, setModal] = useState<{ role: Role; personId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRelLoading(false);
    setPerson(null);
    setParentUnion(null);
    setChildUnions([]);
    setPersonMap(new Map());

    (async () => {
      const { supabase } = await import('@/lib/supabase');

      // Phase 1: fetch person only — show the page quickly
      const { data: pData } = await supabase.from('persons').select('*').eq('id', id).single();
      if (cancelled) return;

      setPerson(pData as Person | null);
      setLoading(false);
      if (!pData) return;

      // Phase 2: fetch relationships in parallel
      setRelLoading(true);
      const [{ data: cuData }, { data: puData }, { data: dcData }] = await Promise.all([
        supabase.from('unions').select('*').or(`pere_id.eq.${id},mere_id.eq.${id}`),
        supabase.from('unions').select('*').contains('enfants_ids', [id]).limit(1),
        supabase.from('persons').select('*').eq('pere_id', id),
      ]);
      if (cancelled) return;

      const cus = (cuData as Union[] | null) ?? [];
      const pu = (puData as Union[] | null)?.[0] ?? null;

      setChildUnions(cus);
      setParentUnion(pu);

      // Batch-fetch all related persons
      const allIds = new Set<string>();
      if (pu?.pere_id) allIds.add(pu.pere_id);
      if (pu?.mere_id) allIds.add(pu.mere_id);
      cus.forEach(u => {
        u.enfants_ids.forEach(eid => allIds.add(eid));
        if (u.pere_id && u.pere_id !== id) allIds.add(u.pere_id);
        if (u.mere_id && u.mere_id !== id) allIds.add(u.mere_id);
      });

      if (allIds.size > 0) {
        const { data: batchData } = await supabase.from('persons').select('*').in('id', [...allIds]);
        if (cancelled) return;
        const pMap = new Map<string, Person>();
        ((batchData as Person[] | null) ?? []).forEach(pp => pMap.set(pp.id, pp));
        ((dcData as Person[] | null) ?? []).forEach(pp => pMap.set(pp.id, pp));
        setPersonMap(pMap);
      }

      if (!cancelled) setRelLoading(false);
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

  const navigateTo = (pid: string) => router.push(`/monarbre/${pid}`);

  const modalPerson = modal
    ? [...state.myPersons, ...state.allPersons].find(p => p.id === modal.personId) ?? null
    : null;

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

  const birthYear = person.naiss_date ? String(new Date(person.naiss_date).getFullYear()) : '';
  const deathYear = person.deces_date ? String(new Date(person.deces_date).getFullYear()) : '';
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
              <span style={{ padding: '4px 12px', borderRadius: 20, background: 'var(--bg)', fontSize: 13, color: 'var(--green2)' }}>
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
              person.naiss_lieu || (person.naiss_date ? `Né·e en ${new Date(person.naiss_date).getFullYear()}` : null),
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
            {relLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <div className="spin" style={{ width: 20, height: 20, borderWidth: 2 }} />
              </div>
            ) : (() => {
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

              return (
                <>
                  {rows.length === 0 ? (
                    <p style={{ color: 'var(--t3)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                      Aucune relation enregistrée.
                    </p>
                  ) : (
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
                  )}

                  {/* Fiabilité des liens */}
                  {(() => {
                    const scoredUnions: Array<{ union: Union; label: string }> = []
                    if (parentUnion) scoredUnions.push({ union: parentUnion, label: 'Union parentale' })
                    childUnions.forEach((u, i) => {
                      const partnerId = u.pere_id === id ? u.mere_id : u.pere_id
                      const partner = partnerId ? personMap.get(partnerId) : undefined
                      const label = partner
                        ? `Union avec ${partner.prenom} ${partner.nom}`
                        : `Union ${i + 1}`
                      scoredUnions.push({ union: u, label })
                    })
                    if (scoredUnions.length === 0) return null

                    const badgeColor: Record<string, string> = {
                      faible: '#dc2626',
                      moyen: '#ea580c',
                      'élevé': '#16a34a',
                    }
                    const badgeBg: Record<string, string> = {
                      faible: '#fef2f2',
                      moyen: '#fff7ed',
                      'élevé': '#f0fdf4',
                    }

                    return (
                      <section style={{ marginTop: 24 }}>
                        <h2 style={sectionHead}>Fiabilité des liens</h2>
                        <div style={card}>
                          {scoredUnions.map(({ union: u, label: uLabel }, i) => {
                            const { score, level, label: scoreLabel } = computeUnionScore(u, personMap)
                            return (
                              <div
                                key={u.id}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 0',
                                  borderBottom: i < scoredUnions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{
                                  fontSize: 12, color: 'var(--t3)', width: 100, flexShrink: 0,
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}>
                                  {uLabel}
                                </span>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 20,
                                  background: badgeBg[level], color: badgeColor[level],
                                  fontSize: 12, fontWeight: 700,
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  flexShrink: 0,
                                }}>
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </span>
                                <span style={{
                                  fontSize: 13, color: 'var(--t2)',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  fontWeight: 600, flexShrink: 0,
                                }}>
                                  {score} / 100
                                </span>
                                <span style={{
                                  fontSize: 12, color: 'var(--t3)',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                }}>
                                  {scoreLabel}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })()}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                    <button
                      onClick={() => router.push(`/monarbre/${id}/modifier`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                        background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => router.push(`/monarbre/nouveau?relation=parent&relatedId=${id}`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                        background: 'none', color: 'var(--t1)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Ajouter un parent
                    </button>
                    <button
                      onClick={() => router.push(`/monarbre/nouveau?relation=enfant&relatedId=${id}`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                        background: 'none', color: 'var(--t1)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Ajouter un enfant
                    </button>
                    <button
                      onClick={() => router.push(`/monarbre/${id}/mariage`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                        background: 'none', color: 'var(--t1)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Ajouter un mariage
                    </button>
                    <button
                      onClick={() => router.push(`/timeline?focus=${id}`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                        background: 'none', color: 'var(--t1)', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Voir la timeline
                    </button>
                  </div>
                </>
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

            {/* Coordonnées */}
            {(person.metier || person.telephone || person.adresse) && (
              <section style={{ marginTop: 28 }}>
                <h2 style={sectionHead}>Coordonnées</h2>
                <div style={card}>
                  {person.metier && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0',
                      borderBottom: (person.telephone || person.adresse) ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize: 20, width: 30, flexShrink: 0 }}>💼</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
                          Profession
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, marginTop: 2 }}>
                          {person.metier}
                        </div>
                      </div>
                    </div>
                  )}
                  {person.telephone && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0',
                      borderBottom: person.adresse ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}>
                      <span style={{ fontSize: 20, width: 30, flexShrink: 0 }}>📱</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
                          Téléphone
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, marginTop: 2 }}>
                          {person.telephone}
                        </div>
                      </div>
                    </div>
                  )}
                  {person.adresse && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0',
                    }}>
                      <span style={{ fontSize: 20, width: 30, flexShrink: 0 }}>📍</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
                          Adresse
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, marginTop: 2 }}>
                          {person.adresse}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── ARBRE TAB ── */}
        {tab === 'arbre' && (
          <div style={{ minHeight: '400px', position: 'relative' }}>
            <TreeView
              personId={id}
              scope="ma"
              onBack={() => setTab('fiche')}
              onNavigateTo={navigateTo}
              onEditPerson={(p) => router.push(`/monarbre/${p.id}/modifier`)}
              onAddUnion={(forId) => router.push(`/monarbre/${forId || id}/mariage`)}
              onModifyUnion={(unionId) => router.push(`/monarbre/${id}/mariage?unionId=${unionId}`)}
              onAddRelation={(role, personId) => setModal({ role: role as Role, personId })}
              onExportPDF={(pid) => exportPersonPDF(pid, 'ma', makeExportCtx())}
              onRelier={(p) => {
                if (!user) { router.push('/'); return; }
                setRelierTarget(p);
              }}
            />
          </div>
        )}

        {/* Bandeau Ajouté par */}
        {(person.created_by_name || person.created_at) && (
          <div style={{
            borderTop: '1px solid #f0ede8', marginTop: 40, padding: '16px 0',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 13, color: '#aaa',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--green2)', color: '#fff',
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

      {modal && modalPerson && (
        <AddRelationModal
          role={modal.role}
          forPerson={modalPerson}
          onClose={() => setModal(null)}
          onCreateNew={(unionId) => {
            setModal(null);
            const searchParams = new URLSearchParams({ relation: modal.role, relatedId: modal.personId });
            if (unionId) searchParams.set('unionId', unionId);
            router.push(`/monarbre/nouveau?${searchParams.toString()}`);
          }}
          onDone={(linkedId) => {
            setModal(null);
            router.push(`/monarbre/${linkedId}`);
          }}
        />
      )}

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
