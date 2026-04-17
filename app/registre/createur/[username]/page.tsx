'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PersonCard from '@/components/app/PersonCard';
import type { Person } from '@/lib/types';

export const dynamicParams = true;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function CreateurProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const decodedName = decodeURIComponent(username);

  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const pageSize = 1000;
      let page = 0;
      let all: Person[] = [];
      while (true) {
        const { data } = await supabase
          .from('persons')
          .select('*')
          .eq('created_by_name', decodedName)
          .order('prenom', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data as Person[]);
        if (data.length < pageSize) break;
        page++;
      }
      setPersons(all);
      setLoading(false);
    });
  }, [decodedName]);

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

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb */}
        <div className="explorer-topbar">
          <Link href="/registre" className="bc-item-v2" style={{ textDecoration: 'none' }}>Registre</Link>
          <span className="bc-sep-v2">›</span>
          <Link href="/registre/createur" className="bc-item-v2" style={{ textDecoration: 'none' }}>Créateurs</Link>
          <span className="bc-sep-v2">›</span>
          <span className="bc-current-v2">{decodedName}</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* En-tête profil */}
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
              alignItems: 'center',
              gap: '16px',
            }}>
              <div className="pc-av M">{initials(decodedName)}</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)', fontFamily: "'Cormorant Garamond', serif" }}>
                  {decodedName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '3px' }}>
                  {persons.length} personne{persons.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Grille PersonCard */}
          {persons.length === 0 ? (
            <div className="empty-grid">Aucune fiche trouvée.</div>
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
