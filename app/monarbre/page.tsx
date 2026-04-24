'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import PersonCard from '@/components/app/PersonCard';
import type { Person, Tree } from '@/lib/types';

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function MonArbrePage() {
  const router        = useRouter();
  const { user, profile } = useAuth();
  const { state }     = useAppState();

  const { importGEDCOM, deleteTree, fetchUserTrees, loadMyData, createPrivateTree } = useDB();
  const gedcomRef = useRef<HTMLInputElement>(null);

  const [trees, setTrees]           = useState<Tree[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    fetchUserTrees().then(setTrees);
  }, [user]);

  const handleTreeSwitch = async (treeId: string | undefined) => {
    setActiveTreeId(treeId);
    await loadMyData(treeId);
  };

  const activeTree = trees.find(t => t.id === activeTreeId);

  const [searchQ, setSearchQ]         = useState('');
  const [aliveOnly, setAliveOnly]     = useState(false);
  const [genreFilter, setGenreFilter] = useState<'M' | 'F' | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window === 'undefined') return 'cards';
    return (localStorage.getItem('arbre-view') as 'cards' | 'list') ?? 'cards';
  });
  const [sortCol, setSortCol] = useState<'nom' | 'clan' | 'localite' | 'naiss'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const handleViewChange = (mode: 'cards' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('arbre-view', mode);
  };

  const myPersons = state.myPersons;
  const myUnions  = state.myUnions;
  const unions    = myUnions.length;

  const issues = useMemo(() => {
    const list: { personId: string; name: string; msg: string }[] = [];
    const currentYear = new Date().getFullYear();
    for (const p of myPersons) {
      const ny = p.naiss_annee;
      const dy = p.deces_annee;
      if (ny && dy && dy < ny)
        list.push({ personId: p.id, name: `${p.prenom} ${p.nom}`, msg: 'Décès avant naissance' });
      if (ny && ny > currentYear)
        list.push({ personId: p.id, name: `${p.prenom} ${p.nom}`, msg: 'Naissance dans le futur' });
    }
    for (const u of myUnions) {
      const pere = myPersons.find(p => p.id === u.pere_id);
      const mere = myPersons.find(p => p.id === u.mere_id);
      for (const childId of u.enfants_ids || []) {
        const child = myPersons.find(p => p.id === childId);
        if (!child) continue;
        const cy = child.naiss_annee;
        if (cy && pere?.naiss_annee && cy < pere.naiss_annee + 12)
          list.push({ personId: child.id, name: `${child.prenom} ${child.nom}`, msg: `Né avant que son père ait 12 ans` });
        if (cy && mere?.naiss_annee && cy < mere.naiss_annee + 12)
          list.push({ personId: child.id, name: `${child.prenom} ${child.nom}`, msg: `Né avant que sa mère ait 12 ans` });
        if (cy && pere?.deces_annee && cy > pere.deces_annee)
          list.push({ personId: child.id, name: `${child.prenom} ${child.nom}`, msg: `Né après le décès de son père` });
      }
    }
    return list;
  }, [myPersons, myUnions]);

  const [issuesOpen, setIssuesOpen] = useState(false);

  const generations = useMemo(() => {
    const years = myPersons
      .map(p => p.naiss_annee ?? null)
      .filter((y): y is number => y !== null && !isNaN(y));
    if (years.length === 0) return 1;
    return Math.max(1, Math.ceil((Math.max(...years) - Math.min(...years)) / 25) + 1);
  }, [myPersons]);

  const firstName = profile?.prenom || user?.email?.split('@')[0] || '';

  const filtered = useMemo(() => {
    let list = myPersons;
    if (aliveOnly) list = list.filter(p => !p.deceased);
    if (genreFilter) list = list.filter(p => p.genre === genreFilter);
    if (searchQ) {
      const q = normalize(searchQ);
      list = list.filter(p => {
        const target = normalize([p.prenom, p.nom, p.clan, p.localite].filter(Boolean).join(' '));
        return q.split(/\s+/).every(t => target.includes(t));
      });
    }
    return list;
  }, [myPersons, aliveOnly, genreFilter, searchQ]);

  useEffect(() => { setPage(0); }, [searchQ, aliveOnly, genreFilter]);

  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Bannière incohérences */}
      {issues.length > 0 && (
        <div style={{
          margin: '16px 32px 0 var(--page-left)',
          borderRadius: 8,
          border: '1px solid #f59e0b',
          background: '#fffbeb',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setIssuesOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {issues.length} incohérence{issues.length > 1 ? 's' : ''} détectée{issues.length > 1 ? 's' : ''}
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: issuesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {issuesOpen && (
            <ul style={{ margin: 0, padding: '0 14px 12px 14px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {issues.map((issue, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <button
                    onClick={() => router.push('/monarbre/' + issue.personId)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontWeight: 600, color: '#92400e', textDecoration: 'underline',
                      fontFamily: 'inherit', fontSize: 13,
                    }}
                  >
                    {issue.name}
                  </button>
                  <span style={{ color: '#78350f' }}>—</span>
                  <span style={{ color: '#92400e' }}>{issue.msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sélecteur d'arbre — affiché si l'utilisateur a plusieurs arbres */}
      {trees.length > 1 && (
        <div style={{
          padding: '10px 32px 10px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
          background: '#FAFAF9',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Arbre :</span>
          {trees.map(tree => (
            <button
              key={tree.id}
              onClick={() => handleTreeSwitch(tree.prive ? tree.id : undefined)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                border: '1px solid var(--bd)',
                background: (tree.prive ? activeTreeId === tree.id : activeTreeId === undefined) ? 'var(--green-bg)' : 'transparent',
                color: (tree.prive ? activeTreeId === tree.id : activeTreeId === undefined) ? 'var(--green)' : 'var(--t2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {tree.prive && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              {tree.nom}
            </button>
          ))}
        </div>
      )}

      {/* En-tête — titre + sous-titre uniquement, borderBottom = le délimiteur */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{
        padding: '48px 32px 40px var(--page-left)',
      }}>
        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 700,
          fontFamily: "'Cormorant Garamond', serif",
          color: 'var(--t1)',
          lineHeight: 1.2,
          margin: 0,
          marginBottom: '12px',
          letterSpacing: '-0.01em',
        }}>
          {activeTree?.prive && (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, marginBottom: 3 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )}
          {activeTree ? activeTree.nom : (firstName ? `${firstName}, votre lignée vous attend.` : 'Votre lignée vous attend.')}
        </h1>
        <p style={{
          fontSize: '15px',
          color: 'var(--t3)',
          lineHeight: 1.7,
          margin: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 400,
          maxWidth: '720px',
        }}>
          {activeTree?.prive
            ? 'Arbre privé — champs confidentiels visibles et modifiables.'
            : 'Votre famille, vos ancêtres, votre royaume — en un seul endroit.'}
        </p>
      </div>
      </div>

      {/* Barre stats — pleine largeur, juste après le délimiteur (état non vide) */}
      {myPersons.length > 0 && (
        <div style={{
          padding: '11px 32px 11px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
          background: '#FAFAF9',
          fontSize: 13,
          color: 'var(--t3)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
        }}>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{myPersons.length}</span>
          <span style={{ marginLeft: 4 }}>personne{myPersons.length > 1 ? 's' : ''}</span>
          <span style={{ margin: '0 8px', opacity: 0.35 }}>·</span>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{generations}</span>
          <span style={{ marginLeft: 4 }}>génération{generations > 1 ? 's' : ''}</span>
          <span style={{ margin: '0 8px', opacity: 0.35 }}>·</span>
          <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{unions}</span>
          <span style={{ marginLeft: 4 }}>famille{unions > 1 ? 's' : ''} connectée{unions > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Étapes — arbre vide, sous le délimiteur */}
      {myPersons.length === 0 && (
        <div style={{ padding: '28px 32px 8px var(--page-left)', display: 'flex', alignItems: 'flex-start', gap: 0, flexWrap: 'wrap' }}>
          {[
            { n: '1', titre: 'Ajoutez-vous', desc: 'Commencez par vous-même comme point de départ.' },
            { n: '2', titre: 'Ajoutez vos parents', desc: 'Reliez vos parents et grands-parents.' },
            { n: '3', titre: 'Remontez vers vos ancêtres', desc: 'Explorez et complétez votre lignée.' },
          ].map((step, i) => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '14px 16px',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 8,
                background: '#FAFAF9',
                maxWidth: 160,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.04em', opacity: 0.7 }}>
                  {step.n}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.3 }}>
                  {step.titre}
                </span>
                <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5 }}>
                  {step.desc}
                </span>
              </div>
              {i < 2 && (
                <div style={{ alignSelf: 'center', padding: '0 6px', color: 'var(--t3)', fontSize: 14, opacity: 0.4 }}>›</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions — toujours sous le délimiteur (ou sous les étapes) */}
      <div style={{ padding: '20px 32px 20px var(--page-left)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-pri" onClick={() => router.push('/monarbre/nouveau')} style={{ fontSize: 13 }}>
          Ajouter une personne
        </button>
        <button className="btn btn-sec" onClick={() => router.push('/monarbre/union/nouvelle')} style={{ fontSize: 13 }}>
          Ajouter un mariage
        </button>
        <input ref={gedcomRef} type="file" accept=".ged,.gedcom" style={{ display: 'none' }} onChange={importGEDCOM} />
        <button className="btn btn-sec" onClick={() => gedcomRef.current?.click()} style={{ fontSize: 13 }}>
          Importer GEDCOM
        </button>
        {myPersons.length > 0 && (
          <button
            className="btn btn-danger"
            style={{ fontSize: 13, marginLeft: 'auto' }}
            onClick={() => {
              if (confirm(`Supprimer tout votre arbre ? (${myPersons.length} personne${myPersons.length > 1 ? 's' : ''}) Cette action est irréversible.`)) {
                deleteTree();
              }
            }}
          >
            Supprimer mon arbre
          </button>
        )}
      </div>

      {/* Barre de filtres */}
      {myPersons.length > 0 && (
        <div style={{
          padding: '14px 32px 14px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
          background: '#FAFAF9',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          {/* Recherche */}
          <div className="exp-search" style={{ flex: 1, minWidth: 180, maxWidth: 280 }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher…"
            />
          </div>

          {/* Vivants */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={aliveOnly} onChange={e => setAliveOnly(e.target.checked)} />
            En vie seulement
          </label>

          {/* Genre */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`f-pill${genreFilter === 'M' ? ' on' : ''}`} onClick={() => setGenreFilter(g => g === 'M' ? null : 'M')}>Hommes</button>
            <button className={`f-pill${genreFilter === 'F' ? ' on' : ''}`} onClick={() => setGenreFilter(g => g === 'F' ? null : 'F')}>Femmes</button>
          </div>

          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
            {filtered.length} / {myPersons.length}
          </span>

          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              title="Vue cartes"
              onClick={() => handleViewChange('cards')}
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: '1px solid var(--bd)', cursor: 'pointer',
                background: viewMode === 'cards' ? 'var(--green-bg)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--green)' : 'var(--t3)',
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
                <rect x="0" y="0" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="0" width="5.5" height="5.5" rx="1"/>
                <rect x="0" y="7.5" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1"/>
              </svg>
            </button>
            <button
              title="Vue liste"
              onClick={() => handleViewChange('list')}
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: '1px solid var(--bd)', cursor: 'pointer',
                background: viewMode === 'list' ? 'var(--green-bg)' : 'transparent',
                color: viewMode === 'list' ? 'var(--green)' : 'var(--t3)',
                transition: 'all 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
                <rect x="0" y="0" width="13" height="2.5" rx="1"/><rect x="0" y="5" width="13" height="2.5" rx="1"/>
                <rect x="0" y="10" width="13" height="2.5" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Personnes */}
      {myPersons.length === 0 ? null : filtered.length === 0 ? (
        <div style={{ padding: '60px 32px 60px var(--page-left)', fontSize: 13, color: 'var(--t3)' }}>
          Aucun résultat pour cette recherche.
        </div>
      ) : viewMode === 'cards' ? (
        <>
          <div className="folder-grid" style={{ padding: '28px 32px 28px var(--page-left)' }}>
            {paginated.map(p => (
              <PersonCard
                key={p.id}
                person={p}
                onClick={() => router.push(`/monarbre/${p.id}`)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '20px 32px' }}>
              <button className="btn btn-sec" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Précédent</button>
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>{page + 1} / {totalPages}</span>
              <button className="btn btn-sec" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Suivant →</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ padding: '0 32px 40px var(--page-left)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {([
                    { key: 'nom',      label: 'Nom / Prénom',      width: '34%' },
                    { key: 'clan',     label: 'Clan / Lenyol',     width: '20%' },
                    { key: 'localite', label: 'Région / Localité', width: '26%' },
                    { key: 'naiss',    label: 'Naissance – Décès', width: '20%' },
                  ] as { key: typeof sortCol; label: string; width: string }[]).map(({ key, label, width }) => {
                    const active = sortCol === key;
                    return (
                      <th
                        key={key}
                        onClick={() => {
                          if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                          else { setSortCol(key); setSortDir('asc'); }
                        }}
                        style={{
                          width, padding: '10px 12px', textAlign: 'left',
                          fontSize: 11, fontWeight: 700,
                          color: active ? 'var(--green)' : 'var(--t3)',
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                          cursor: 'pointer', userSelect: 'none',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          borderBottom: '2px solid var(--bd)',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.15s',
                        }}
                      >
                        {label}
                        {active && <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[...paginated].sort((a, b) => {
                  let va = '', vb = '';
                  if (sortCol === 'nom')      { va = ((a.nom || '') + (a.prenom || '')).toLowerCase(); vb = ((b.nom || '') + (b.prenom || '')).toLowerCase(); }
                  else if (sortCol === 'clan')     { va = (a.clan || '').toLowerCase(); vb = (b.clan || '').toLowerCase(); }
                  else if (sortCol === 'localite') { va = ((a.region || '') + (a.localite || '')).toLowerCase(); vb = ((b.region || '') + (b.localite || '')).toLowerCase(); }
                  else if (sortCol === 'naiss')    { va = String(a.naiss_annee ?? 0); vb = String(b.naiss_annee ?? 0); }
                  const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                  return sortDir === 'asc' ? cmp : -cmp;
                }).map((p: Person, i) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/monarbre/${p.id}`)}
                    style={{
                      background: i % 2 === 0 ? 'var(--warm2)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'var(--warm2)' : 'transparent'; }}
                  >
                    <td style={{ padding: '11px 12px', fontSize: 14, fontWeight: 600, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.prenom} {p.nom}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.clan || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {[p.region, p.localite].filter(Boolean).join(' / ') || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.naiss_annee ? String(p.naiss_annee) : '?'}
                      {p.deceased && ` – ${p.deces_annee ? String(p.deces_annee) : '?'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '20px 32px' }}>
              <button className="btn btn-sec" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Précédent</button>
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>{page + 1} / {totalPages}</span>
              <button className="btn btn-sec" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Suivant →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
