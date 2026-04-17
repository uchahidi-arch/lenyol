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

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      // 1. Résoudre le slug → label complet (prefix_lignee + clan)
      const { data: clanData } = await supabase
        .from('persons')
        .select('clan, prefix_lignee')
        .not('clan', 'is', null);

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

          {/* Grille PersonCard */}
          {persons.length === 0 ? (
            <div className="empty-grid">Aucune personne enregistrée pour ce lenyol.</div>
          ) : (
            <div className="folder-grid">
              {persons.map(p => (
                <PersonCard
                  key={p.id}
                  person={p}
                  onClick={() => router.push(`/registre/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
