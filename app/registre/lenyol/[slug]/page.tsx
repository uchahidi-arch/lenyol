'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PersonCard from '@/components/app/PersonCard';
import { slugify } from '@/lib/slugify';
import type { Person } from '@/lib/types';

export const dynamicParams = true;

export default function LenyolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [clan, setClan]         = useState<string | null>(null);
  const [persons, setPersons]   = useState<Person[]>([]);
  const [regions, setRegions]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
    if (typeof window === 'undefined') return 'cards';
    return (localStorage.getItem('registre-view') as 'cards' | 'list') ?? 'cards';
  });
  const [sortCol, setSortCol] = useState<'nom' | 'clan' | 'localite' | 'naiss'>('nom');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data: publicTrees } = await supabase.from('trees').select('id').eq('prive', false);
      const publicIds = (publicTrees ?? []).map((t: { id: string }) => t.id);
      const treeFilter = publicIds.length > 0
        ? `tree_id.is.null,tree_id.in.(${publicIds.join(',')})`
        : 'tree_id.is.null';

      // 1. Résoudre le slug → label complet (prefix_lignee + clan)
      const { data: clanData } = await supabase
        .from('persons')
        .select('clan, prefix_lignee')
        .not('clan', 'is', null)
        .or(treeFilter);

      const labels = [
        ...new Set(
          ((clanData ?? []) as { clan: string | null; prefix_lignee: string | null }[])
            .filter(r => Boolean(r.clan))
            .map(r => (r.prefix_lignee || 'Lenyol') + ' ' + r.clan!)
        ),
      ];

      const resolvedLabel = labels.find(l => slugify(l) === slug) ?? null;

      if (!resolvedLabel) { setNotFound(true); setLoading(false); return; }

      // Extraire le nom du clan depuis le label
      const resolvedClan = resolvedLabel.replace(/^(Lenyol|Wa|Galle)\s+/i, '').trim();
      setClan(resolvedLabel);

      // 2. Charger les personnes du lenyol
      const { data: pData } = await supabase
        .from('persons')
        .select('*')
        .eq('clan', resolvedClan)
        .or(treeFilter)
        .order('nom', { ascending: true });

      const list = (pData ?? []) as Person[];
      setPersons(list);
      setRegions([...new Set(list.map(p => p.region).filter((r): r is NonNullable<typeof r> => Boolean(r)) as string[])].sort());
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ position: 'relative', flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column' }}>
          <div className="folder-grid">
            <div className="empty-grid">
              <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !clan) {
    return (
      <div className="view-section">
        <div className="empty-grid">Lenyol introuvable.</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb */}
        <div className="explorer-topbar">
          <Link href="/registre" className="bc-item-v2" style={{ textDecoration: 'none' }}>Registre</Link>
          <span className="bc-sep-v2">›</span>
          <span className="bc-item-v2" style={{ color: 'var(--t2)', cursor: 'default' }}>Lenyol</span>
          <span className="bc-sep-v2">›</span>
          <span className="bc-current-v2">{clan}</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* En-tête */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '8px',
              boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--t1)' }}>
                  ⬡ {clan}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px' }}>
                  Lenyol · Lignée familiale
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { val: persons.length, label: 'personnes' },
                  { val: regions.length, label: 'région' + (regions.length !== 1 ? 's' : '') },
                ].map(({ val, label }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.6)', borderRadius: '12px',
                    padding: '8px 14px', textAlign: 'center', minWidth: '66px',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{val}</div>
                    <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Régions représentées */}
            {regions.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: '20px',
                padding: '16px 20px',
                marginBottom: '8px',
                boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: '10px' }}>
                  Présence géographique
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {regions.map(reg => (
                    <span
                      key={reg}
                      style={{
                        display: 'inline-block', padding: '4px 12px',
                        borderRadius: '100px',
                        background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
                        color: 'var(--green)', fontSize: '12px', fontWeight: 600,
                      }}
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle + liste */}
          {persons.length === 0 ? (
            <div className="empty-grid">Aucune personne enregistrée pour ce lenyol.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px 4px', gap: 2 }}>
                {(['cards', 'list'] as const).map((m, idx) => (
                  <button key={m} title={m === 'cards' ? 'Vue cartes' : 'Vue liste'}
                    onClick={() => { setViewMode(m); localStorage.setItem('registre-view', m); }}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--bd)', cursor: 'pointer', background: viewMode === m ? 'var(--green-bg)' : 'transparent', color: viewMode === m ? 'var(--green)' : 'var(--t3)' }}
                  >
                    {idx === 0
                      ? <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="0" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="0" width="5.5" height="5.5" rx="1"/><rect x="0" y="7.5" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="0" width="13" height="2.5" rx="1"/><rect x="0" y="5" width="13" height="2.5" rx="1"/><rect x="0" y="10" width="13" height="2.5" rx="1"/></svg>
                    }
                  </button>
                ))}
              </div>
              {viewMode === 'cards' ? (
                <div className="folder-grid">
                  {persons.map(p => (
                    <PersonCard key={p.id} person={p} onClick={() => router.push(`/registre/${p.id}`)} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0 24px 32px' }}>
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
                            <th key={key} onClick={() => { if (active) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(key); setSortDir('asc'); } }}
                              style={{ width, padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: active ? 'var(--green)' : 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer', userSelect: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '2px solid var(--bd)', whiteSpace: 'nowrap' }}>
                              {label}{active && <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[...persons].sort((a, b) => {
                        let va = '', vb = '';
                        if (sortCol === 'nom')      { va = ((a.nom||'')+(a.prenom||'')).toLowerCase(); vb = ((b.nom||'')+(b.prenom||'')).toLowerCase(); }
                        else if (sortCol === 'clan')     { va = (a.clan||'').toLowerCase(); vb = (b.clan||'').toLowerCase(); }
                        else if (sortCol === 'localite') { va = ((a.region||'')+(a.localite||'')).toLowerCase(); vb = ((b.region||'')+(b.localite||'')).toLowerCase(); }
                        else if (sortCol === 'naiss')    { va = String(a.naiss_annee??0); vb = String(b.naiss_annee??0); }
                        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                        return sortDir === 'asc' ? cmp : -cmp;
                      }).map((p, i) => (
                        <tr key={p.id} onClick={() => router.push(`/registre/${p.id}`)}
                          style={{ background: i%2===0 ? 'var(--warm2)' : 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.07)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i%2===0 ? 'var(--warm2)' : 'transparent'; }}
                        >
                          <td style={{ padding: '11px 12px', fontSize: 14, fontWeight: 600, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{p.prenom} {p.nom}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{p.clan || <span style={{ color: 'var(--t3)' }}>—</span>}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{[p.region, p.localite].filter(Boolean).join(' / ') || <span style={{ color: 'var(--t3)' }}>—</span>}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            {p.naiss_annee ? String(p.naiss_annee) : '?'}{p.deceased && ` – ${p.deces_annee ? String(p.deces_annee) : '?'}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
