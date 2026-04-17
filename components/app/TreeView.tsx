'use client';

import { useState, useEffect } from 'react';
import { useDB } from '@/hooks/useDB';
import { useAuth } from '@/hooks/useAuth';
import type { Person, Union } from '@/lib/types';

type RelationRole = 'pere' | 'mere' | 'enfant' | 'conjoint';

interface TreeViewProps {
  personId: string;
  scope: 'ma' | 'reg';
  onBack: () => void;
  onNavigateTo: (id: string) => void;
  onEditPerson?: (p: Person) => void;
  onAddUnion?: (forId: string, conjointGenre?: 'M' | 'F') => void;
  onModifyUnion?: (unionId: string) => void;
  onAddRelation?: (role: RelationRole, personId: string) => void;
  onExportPDF?: (personId: string) => void;
  onRelier?: (person: Person) => void;
}

function ini(p: Person) {
  return ((p.prenom?.[0] || '?') + (p.nom?.[0] || '?')).toUpperCase();
}
function ligneeStr(p: Person) {
  return [[p.prefix_lignee, p.clan].filter(Boolean).join(' '), p.galle].filter(Boolean).join(' · ');
}

export default function TreeView({
  personId,
  scope,
  onBack,
  onNavigateTo,
  onEditPerson,
  onAddUnion,
  onModifyUnion,
  onAddRelation,
  onExportPDF,
  onRelier,
}: TreeViewProps) {
  const { state, fetchPerson, fetchUnionsOf, fetchParentUnionOf, toggleMasque } = useDB();
  const { user } = useAuth();

  const [person, setPerson]     = useState<Person | null>(null);
  const [unions, setUnions]     = useState<Union[]>([]);
  const [parentUnion, setParentUnion] = useState<Union | null>(null);
  const [activeUnionId, setActiveUnionId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [gpUnionPere, setGpUnionPere] = useState<Union | null>(null);
  const [gpUnionMere, setGpUnionMere] = useState<Union | null>(null);

  // Resolved persons cache
  const [persons, setPersons] = useState<Record<string, Person>>({});

  useEffect(() => {
    load();
  }, [personId]);

  const load = async () => {
    setLoading(true);
    const p = scope === 'ma'
      ? state.myPersons.find(x => x.id === personId) || await fetchPerson(personId)
      : await fetchPerson(personId);
    if (!p) { setLoading(false); return; }
    setPerson(p);

    const myUnions = scope === 'ma'
      ? state.myUnions.filter(u => u.pere_id === personId || u.mere_id === personId)
      : await fetchUnionsOf(personId);
    setUnions(myUnions);
    setActiveUnionId(myUnions[0]?.id || null);

    const pu = scope === 'ma'
      ? state.myUnions.find(u => (u.enfants_ids || []).includes(personId)) || null
      : await fetchParentUnionOf(personId);
    setParentUnion(pu);

    // Fetch GP unions (niveau +2)
    let gpUp: Union | null = null;
    let gpUm: Union | null = null;
    if (pu?.pere_id) {
      gpUp = scope === 'ma'
        ? state.myUnions.find(u => (u.enfants_ids || []).includes(pu.pere_id!)) || null
        : await fetchParentUnionOf(pu.pere_id);
    }
    if (pu?.mere_id) {
      gpUm = scope === 'ma'
        ? state.myUnions.find(u => (u.enfants_ids || []).includes(pu.mere_id!)) || null
        : await fetchParentUnionOf(pu.mere_id);
    }
    setGpUnionPere(gpUp);
    setGpUnionMere(gpUm);

    // Fetch all related persons
    const idsToFetch = new Set<string>();
    if (pu) {
      if (pu.pere_id) idsToFetch.add(pu.pere_id);
      if (pu.mere_id) idsToFetch.add(pu.mere_id);
    }
    if (gpUp?.pere_id) idsToFetch.add(gpUp.pere_id);
    if (gpUp?.mere_id) idsToFetch.add(gpUp.mere_id);
    if (gpUm?.pere_id) idsToFetch.add(gpUm.pere_id);
    if (gpUm?.mere_id) idsToFetch.add(gpUm.mere_id);
    myUnions.forEach(u => {
      const ptId = u.pere_id === personId ? u.mere_id : u.pere_id;
      if (ptId) idsToFetch.add(ptId);
      (u.enfants_ids || []).forEach(k => idsToFetch.add(k));
    });
    idsToFetch.delete(personId);

    const resolved: Record<string, Person> = {};
    const allKnown = [...state.myPersons, ...state.allPersons];
    for (const id of idsToFetch) {
      const cached = allKnown.find(x => x.id === id);
      resolved[id] = cached || (await fetchPerson(id)) as Person;
    }
    setPersons(resolved);
    setLoading(false);
  };

  const getP = (id?: string | null): Person | null => {
    if (!id) return null;
    return persons[id] || state.myPersons.find(x => x.id === id) || state.allPersons.find(x => x.id === id) || null;
  };

  const activeUnion = unions.find(u => u.id === activeUnionId) || null;
  const partnerId = activeUnion
    ? (activeUnion.pere_id === personId ? activeUnion.mere_id : activeUnion.pere_id)
    : null;
  const partner  = getP(partnerId);
  const père      = getP(parentUnion?.pere_id);
  const mère      = getP(parentUnion?.mere_id);
  const children  = (activeUnion?.enfants_ids || []).map(id => getP(id)).filter(Boolean) as Person[];

  // Grands-parents (niveau +2)
  const gpPP = getP(gpUnionPere?.pere_id);  // Grand-père paternel
  const gpMP = getP(gpUnionPere?.mere_id);  // Grand-mère paternelle
  const gpPM = getP(gpUnionMere?.pere_id);  // Grand-père maternel
  const gpMM = getP(gpUnionMere?.mere_id);  // Grand-mère maternelle

  // Largeur commune des colonnes GP : si au moins un GP existe d'un côté, les deux colonnes
  // parent prennent 268px pour que la courbe Y (25%/75%) reste centrée
  const hasAnyGp = !!(gpPP || gpMP || gpPM || gpMM);
  const gpColMinWidth = hasAnyGp ? 268 : undefined;

  const canEdit = scope === 'ma' && !!user && !person?.external_ref && person?.owner_id === user.id;
  const isOwner = person && user && person.owner_id !== user.id;

  // Centrer la vue sur la carte focale après chargement
  useEffect(() => {
    if (!loading && person) {
      const wrapEl = document.querySelector('.tree-wrapper.open') as HTMLElement | null;
      const focusEl = document.getElementById('zone-union') as HTMLElement | null;
      if (!wrapEl || !focusEl) return;
      // Centrer horizontalement sur la carte focale
      const wrapW = wrapEl.clientWidth;
      const scrollW = wrapEl.scrollWidth;
      const focusLeft = focusEl.offsetLeft;
      const focusW = focusEl.offsetWidth;
      const targetLeft = focusLeft + focusW / 2 - wrapW / 2;
      wrapEl.scrollLeft = Math.max(0, targetLeft);
    }
  }, [loading, person]);

  if (loading) {
    return (
      <div className="tree-wrapper open">
        <button className="btn btn-sec tree-close-btn" onClick={onBack}>⬅ Retour</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spin" />
        </div>
      </div>
    );
  }

  if (!person) return null;

  return (
    <div className="tree-wrapper open" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
    }}>
      <style>{`
        @keyframes treeBlobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -40px) scale(1.08); }
        }
        @keyframes treeBlobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-25px, 35px) scale(0.94); }
        }
        @keyframes treeBlobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, 25px) scale(1.05); }
        }
      `}</style>

      {/* Blobs décoratifs animés */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', left: '-60px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163,201,126,0.22) 0%, transparent 70%)',
          animation: 'treeBlobFloat1 9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '-80px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(106,45,79,0.12) 0%, transparent 70%)',
          animation: 'treeBlobFloat2 13s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '35%',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,106,79,0.14) 0%, transparent 70%)',
          animation: 'treeBlobFloat3 11s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '55%', left: '10%',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,189,160,0.3) 0%, transparent 70%)',
          animation: 'treeBlobFloat2 15s ease-in-out infinite 2s',
        }} />
      </div>

      <button className="btn btn-sec tree-close-btn" style={{ position: 'relative', zIndex: 2 }} onClick={onBack}>⬅ Retour</button>

      <div className="tree-zone-inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* ── PARENTS + GRANDS-PARENTS ── */}
        {(père || mère) && (
          <div id="zone-parents" style={{ width: '100%' }}>
            <div className="tree-zone" style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px' }}>

                {/* ── Colonne Père (+ ses parents) ── */}
                {père && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...(gpColMinWidth ? { minWidth: gpColMinWidth } : {}) }}>
                    {(gpPP || gpMP) && (
                      <>
                        {/* Conteneur 268px pour que le GP unique soit centré au-dessus du père */}
                        <div style={{ width: 268, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {gpPP && <ParentCard person={gpPP} role="G-Père" onClick={() => onNavigateTo(gpPP.id)} />}
                          {gpMP && <ParentCard person={gpMP} role="G-Mère" onClick={() => onNavigateTo(gpMP.id)} />}
                        </div>
                        {gpPP && gpMP ? (
                          /* 2 GP : courbes en Y convergeant au centre */
                          <svg width="268" height="32" viewBox="0 0 268 32" style={{ display: 'block' }}>
                            <path d="M 67 0 C 67 16, 134 16, 134 32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" />
                            <path d="M 201 0 C 201 16, 134 16, 134 32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" />
                          </svg>
                        ) : (
                          /* 1 seul GP : trait droit centré (x=134 = milieu des 268px) */
                          <svg width="268" height="32" viewBox="0 0 268 32" style={{ display: 'block' }}>
                            <line x1="134" y1="0" x2="134" y2="32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" />
                          </svg>
                        )}
                      </>
                    )}
                    <ParentCard person={père} role="Père" onClick={() => onNavigateTo(père.id)} />
                  </div>
                )}

                {/* ── Connecteur horizontal père–mère ── */}
                {père && mère && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="pc-line" style={{ background: 'rgba(163,201,126,0.6)', height: '2px' }} />
                    <div className="pc-dot" style={{ background: 'rgba(163,201,126,0.8)', width: '10px', height: '10px' }} />
                    <div className="pc-line" style={{ background: 'rgba(163,201,126,0.6)', height: '2px' }} />
                  </div>
                )}

                {/* ── Colonne Mère (+ ses parents) ── */}
                {mère && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...(gpColMinWidth ? { minWidth: gpColMinWidth } : {}) }}>
                    {(gpPM || gpMM) && (
                      <>
                        {/* Conteneur 268px pour que le GP unique soit centré au-dessus de la mère */}
                        <div style={{ width: 268, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {gpPM && <ParentCard person={gpPM} role="G-Père" onClick={() => onNavigateTo(gpPM.id)} />}
                          {gpMM && <ParentCard person={gpMM} role="G-Mère" onClick={() => onNavigateTo(gpMM.id)} />}
                        </div>
                        {gpPM && gpMM ? (
                          /* 2 GP : courbes en Y convergeant au centre */
                          <svg width="268" height="32" viewBox="0 0 268 32" style={{ display: 'block' }}>
                            <path d="M 67 0 C 67 16, 134 16, 134 32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" />
                            <path d="M 201 0 C 201 16, 134 16, 134 32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" />
                          </svg>
                        ) : (
                          /* 1 seul GP : trait droit centré (x=134 = milieu des 268px) */
                          <svg width="268" height="32" viewBox="0 0 268 32" style={{ display: 'block' }}>
                            <line x1="134" y1="0" x2="134" y2="32" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" />
                          </svg>
                        )}
                      </>
                    )}
                    <ParentCard person={mère} role="Mère" onClick={() => onNavigateTo(mère.id)} />
                  </div>
                )}

              </div>

              {/* ── Courbe Y parents → personne centrale ── */}
              {père && mère ? (
                <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none" style={{ display: 'block' }}>
                  <path d="M 25 0 C 25 18, 50 18, 50 36" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                  <path d="M 75 0 C 75 18, 50 18, 50 36" stroke="rgba(163,201,126,0.6)" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
              ) : (
                <div style={{ width: '2px', height: '28px', background: 'rgba(163,201,126,0.7)', margin: '0 auto' }} />
              )}
              </div>
            </div>
          </div>
        )}

        {/* ── UNION ROW ── */}
        <div id="zone-union" style={{ width: '100%' }}>
          <div className="tree-zone" style={{ paddingTop: 0, paddingBottom: 0 }}>
            {/* Layout 3 colonnes : conjoint-gauche | focal (centré) | conjoint-droite */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>

              {/* Colonne gauche — conjoint si personne est F */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {person.genre === 'F' && partner && (
                  <>
                    <PartnerCard person={partner} onClick={() => onNavigateTo(partner.id)} />
                    <div className="union-line" style={{ background: 'rgba(163,201,126,0.6)', height: '2px' }}>
                      {canEdit && activeUnion && (
                        <button className="union-edit-btn" onClick={() => onModifyUnion?.(activeUnion.id)}>✏</button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Personne focale — toujours centrée, ne rétrécit pas */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Dot de jonction centré juste au-dessus de la carte focale */}
                {(parentUnion || partner) && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'rgba(163,201,126,0.9)',
                    marginBottom: 2,
                    flexShrink: 0,
                  }} />
                )}
                <FocusCard
                  person={person}
                  canEdit={canEdit}
                  isReg={scope === 'reg'}
                  isOwner={!!isOwner}
                  onEdit={() => onEditPerson?.(person)}
                  onAddUnion={(conjointGenre?: 'M' | 'F') => onAddUnion?.(person.id, conjointGenre)}
                  onAddRelation={(role: RelationRole) => onAddRelation?.(role, person.id)}
                  onExportPDF={() => onExportPDF?.(person.id)}
                  onRelier={() => onRelier?.(person)}
                  onToggleMasque={() => toggleMasque(person)}
                  parentUnion={parentUnion}
                  hasPartner={!!partner}
                />
              </div>

              {/* Colonne droite — conjoint si personne est M */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                {person.genre === 'M' && partner && (
                  <>
                    <div className="union-line" style={{ background: 'rgba(163,201,126,0.6)', height: '2px' }}>
                      {canEdit && activeUnion && (
                        <button className="union-edit-btn" onClick={() => onModifyUnion?.(activeUnion.id)}>✏</button>
                      )}
                    </div>
                    <PartnerCard person={partner} onClick={() => onNavigateTo(partner.id)} />
                  </>
                )}
                {canEdit && activeUnion && !partner && (
                  <button className="union-edit-btn" style={{ marginLeft: 8 }} onClick={() => onModifyUnion?.(activeUnion.id)}>✏</button>
                )}
              </div>

            </div>
            {activeUnionId && <div className="v-line" style={{ margin: '0 auto' }} />}
          </div>
        </div>

        {/* ── UNION TABS (multiple marriages) ── */}
        {unions.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 32px', width: '100%' }}>
            <div className="union-tabs">
              {unions.map(u => {
                const ptId = u.pere_id === personId ? u.mere_id : u.pere_id;
                const pt = getP(ptId);
                const ct = (u.enfants_ids || []).length;
                return (
                  <button
                    key={u.id}
                    className={`u-tab${activeUnionId === u.id ? ' on' : ''}`}
                    onClick={() => setActiveUnionId(u.id)}
                  >
                    Avec {pt ? pt.prenom : '?'}
                    {ct > 0 && (
                      <span style={{
                        fontSize: '8px', background: 'var(--gold-bg)', color: 'var(--gold)',
                        borderRadius: '10px', padding: '0 5px', border: '1px solid var(--gold-bd)',
                        marginLeft: '4px',
                      }}>
                        {ct}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EDIT UNION BTN ── */}
        {canEdit && activeUnion && (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 4 }}>
            <button
              className="btn btn-sec"
              style={{ fontSize: 11, padding: '3px 12px' }}
              onClick={() => onModifyUnion?.(activeUnion.id)}
            >
              ✏ Modifier ce mariage
            </button>
          </div>
        )}

        {/* ── CHILDREN ── */}
        <div className="children-area">
          {children.length === 0 ? (
            <div className="no-children">
              Aucun enfant.
              {canEdit && activeUnion && (
                <button
                  className="btn btn-sec"
                  style={{ marginLeft: '8px', fontSize: '10px' }}
                  onClick={() => onAddRelation?.('enfant', person.id)}
                >
                  + Ajouter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="children-label">Enfants ({children.length})</div>
              <div className="children-grid">
                {children
                  .filter(k => scope === 'ma' || !k.masque)
                  .map(k => (
                  <div
                    key={k.id}
                    className={`child-card ${k.genre || 'M'}`}
                    onClick={() => onNavigateTo(k.id)}
                    style={k.masque ? { opacity: 0.55 } : undefined}
                  >
                    <div className={`child-photo ${k.genre || 'M'}`}>
                      {k.photo_url
                        ? <img src={k.photo_url} alt={k.prenom} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : ini(k)
                      }
                    </div>
                    <div className="child-prenom">
                      {k.prenom}{k.deceased ? ' 🕊️' : ''}
                      {k.masque && ' 🔒'}
                    </div>
                    <div className="child-nom">{k.nom || '—'}</div>
                    {(ligneeStr(k) || k.localite) && (
                      <div className="child-sub">{ligneeStr(k) || k.localite}</div>
                    )}
                  </div>
                ))}
                {/* Placeholder enfants masqués — visible uniquement dans le registre */}
                {scope === 'reg' && children.filter(k => k.masque).length > 0 && (
                  <div className="child-card M" style={{ pointerEvents: 'none', opacity: 0.45, minWidth: 80 }}>
                    <div className="child-photo M" style={{ fontSize: 14 }}>🔒</div>
                    <div className="child-prenom" style={{ fontSize: 10 }}>
                      {children.filter(k => k.masque).length} masqué{children.filter(k => k.masque).length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── INFO STRIP ── */}
        <InfoStrip person={person} unions={unions} canEdit={canEdit} onEdit={() => onEditPerson?.(person)} onAddUnion={() => onAddUnion?.(person.id)} />
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ParentCard({ person, role, onClick }: { person: Person; role: string; onClick: () => void }) {
  const genre = person.genre || 'M';
  const isGp = role.startsWith('G-');
  const cls = isGp ? `parent-card ${genre} gp-${genre}` : `parent-card ${genre}`;
  return (
    <div className={cls} onClick={onClick}>
      <div className={`parent-photo ${person.genre || 'M'}`}>
        {person.photo_url
          ? <img src={person.photo_url} alt={person.prenom} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : ini(person)
        }
      </div>
      <div className="parent-role">{role}</div>
      <div className="parent-prenom">{person.prenom}</div>
      <div className="parent-nom">{person.nom || '—'}</div>
      {ligneeStr(person) && <div className="parent-sub">{ligneeStr(person)}</div>}
    </div>
  );
}

function PartnerCard({ person, onClick }: { person: Person; onClick: () => void }) {
  return (
    <div className={`partner-card ${person.genre || 'M'}`} onClick={onClick}>
      <div className={`partner-photo ${person.genre || 'M'}`}>
        {person.photo_url
          ? <img src={person.photo_url} alt={person.prenom} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : ini(person)
        }
      </div>
      <div className="partner-role">{person.genre === 'M' ? 'Mari' : 'Épouse'}</div>
      <div className="partner-prenom">{person.prenom}</div>
      <div className="partner-nom">{person.nom || '—'}</div>
      {ligneeStr(person) && <div className="partner-sub">{ligneeStr(person)}</div>}
    </div>
  );
}

function FocusCard({
  person, canEdit, isReg, isOwner,
  onEdit, onAddUnion, onAddRelation, onExportPDF, onRelier, onToggleMasque,
  parentUnion, hasPartner,
}: any) {
  const isHomme = person.genre === 'M';
  const conjointGenreAttendu: 'M' | 'F' = isHomme ? 'F' : 'M';
  const hasPere = parentUnion?.pere_id;
  const hasMere = parentUnion?.mere_id;
  const { user } = useAuth();

  return (
    <div className={`focus-card ${isHomme ? 'M-focus' : 'F-focus'} popIn`}>
      <div className="focus-photo">
        {person.photo_url
          ? <img src={person.photo_url} alt={person.prenom} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : ini(person)
        }
      </div>
      <div className="focus-prenom">{person.prenom}</div>
      <div className="focus-nom">{person.nom || '—'}</div>

      <div className="focus-tags">
        {person.deceased
          ? <span className="f-tag dead">🕊️ Décédé·e</span>
          : <span className="f-tag alive">🟢 En vie</span>
        }
        {person.masque && (
          <span className="f-tag" style={{ background: 'var(--warm2)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
            🔒 Masqué
          </span>
        )}
      </div>

      <div className="focus-tags">
        {person.clan && <span className="f-tag hinya">⬡ {person.prefix_lignee || 'Lenyol'} {person.clan}</span>}
        {person.localite && <span className="f-tag loc">📍 {person.localite}</span>}
      </div>

      {person.daho && (
        <div className="focus-daho" style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '4px' }}>
          Galle · {person.daho}
        </div>
      )}

      {/* PDF export */}
      {user && (
        <button className="btn-pdf" onClick={onExportPDF}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Obtenir l'arbre
        </button>
      )}

      <div className="focus-actions">
        {canEdit && (
          <>
            <button className="btn btn-pri" onClick={onEdit}>✏ Modifier</button>
            <button className="btn btn-sec" onClick={onAddUnion}>+ Mariage</button>
            {!person.deceased && (
              <button
                className="btn btn-sec"
                style={{ fontSize: '11px', color: person.masque ? 'var(--t2)' : undefined }}
                onClick={onToggleMasque}
                title={person.masque ? 'Rendre visible dans le registre' : 'Masquer dans le registre public'}
              >
                {person.masque ? '👁 Démasquer' : '🔒 Masquer'}
              </button>
            )}
          </>
        )}
        {isReg && user && isOwner && (
          <button className="btn btn-pri" style={{ fontSize: '11px' }} onClick={onRelier}>
            🔗 Relier à ma famille
          </button>
        )}
        {person.external_ref && (
          <div style={{
            fontSize: '9px', color: 'var(--gold)', background: 'var(--gold-bg)',
            border: '1px solid var(--gold-bd)', borderRadius: '100px', padding: '2px 9px', marginTop: '4px',
          }}>
            🔗 Fiche externe — lecture seule
          </div>
        )}
      </div>

      {canEdit && (
        <div className="quick-actions">
          {!hasPere && <button className="qa-btn pere" onClick={() => onAddRelation?.('pere')}>+ Père</button>}
          {!hasMere && <button className="qa-btn mere" onClick={() => onAddRelation?.('mere')}>+ Mère</button>}
          <button className="qa-btn enfant" onClick={() => onAddRelation?.('enfant')}>+ Enfant</button>
          {!hasPartner && <button className="qa-btn conjoint" onClick={() => onAddRelation?.('conjoint')}>{isHomme ? '+ Conjointe' : '+ Conjoint'}</button>}
        </div>
      )}
    </div>
  );
}

function InfoStrip({ person, unions, canEdit, onEdit, onAddUnion }: any) {
  const chips: [string, any][] = [];
  if (unions.length) chips.push(['Mariages', unions.length]);
  const kids = unions.reduce((s: number, u: Union) => s + (u.enfants_ids || []).length, 0);
  if (kids) chips.push(['Enfants', kids]);
  if (person.metier) chips.push(['Métier', person.metier]);
  if (person.naiss_lieu) chips.push(['Né·e à', person.naiss_lieu]);
  if (person.naiss_date) chips.push(['Naissance', person.naiss_date]);
  if (person.deces_date) chips.push(['Décès', person.deces_date]);
  if (person.notes) chips.push(['Notes', person.notes.substring(0, 80) + (person.notes.length > 80 ? '…' : '')]);

  return (
    <div className="info-strip">
      {chips.map(([l, v]) => (
        <div key={l} className="info-chip">
          <div className="ic-lbl">{l}</div>
          <div className="ic-val">{v}</div>
        </div>
      ))}
      {person.created_by_name && (
        <div className="info-chip" style={{ marginLeft: 0 }}>
          <div className="ic-lbl">Ajouté par</div>
          <div className="ic-creator">
            ✍ {person.created_by_name}
            {person.created_at && ` · ${new Date(person.created_at).toLocaleDateString('fr-FR')}`}
          </div>
        </div>
      )}
      {canEdit && (
        <div className="info-actions">
          <button className="btn btn-sec" onClick={onEdit}>✏ Modifier</button>
          <button className="btn btn-pri" onClick={onAddUnion}>+ Mariage</button>
        </div>
      )}
    </div>
  );
}
