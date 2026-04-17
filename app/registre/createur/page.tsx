'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Creator = { id: string; name: string; count: number };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CreateurIndexPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const pageSize = 1000;
      let page = 0;
      let allRows: { created_by: string | null; created_by_name: string | null }[] = [];
      while (true) {
        const { data } = await supabase
          .from('persons')
          .select('created_by, created_by_name')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < pageSize) break;
        page++;
      }
      const acc: Record<string, { name: string; count: number }> = {};
      allRows.forEach((p: any) => {
        const id = p.created_by || '__anonyme__';
        const name = p.created_by_name || 'Anonyme';
        if (!acc[id]) acc[id] = { name, count: 0 };
        acc[id].count++;
      });
      const ranking = Object.entries(acc)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 20)
        .map(([id, { name, count }]) => ({ id, name, count }));
      setCreators(ranking);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb */}
        <div className="explorer-topbar">
          <Link href="/registre" className="bc-item-v2" style={{ textDecoration: 'none' }}>Registre</Link>
          <span className="bc-sep-v2">›</span>
          <span className="bc-current-v2">Créateurs</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="folder-grid">
              <div className="empty-grid">
                <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
              </div>
            </div>
          ) : creators.length === 0 ? (
            <div className="empty-grid">Aucun contributeur trouvé.</div>
          ) : (
            <div className="folder-grid">
              {creators.map(({ id, name, count }, idx) => (
                <div
                  key={id}
                  className="exp-card fadein"
                  onClick={() => router.push(`/registre/createur/${encodeURIComponent(name)}`)}
                >
                  {/* Medal / rang */}
                  {idx < 3 ? (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '18px' }}>
                      {MEDALS[idx]}
                    </div>
                  ) : (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      fontSize: '11px', fontWeight: 700, color: 'var(--t3)',
                      background: 'rgba(0,0,0,0.06)', borderRadius: '6px', padding: '2px 6px',
                    }}>
                      #{idx + 1}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="pc-av M" style={{ marginBottom: '10px' }}>
                    {initials(name)}
                  </div>

                  {/* Nom */}
                  <div className="exp-title">{name}</div>

                  {/* Compte */}
                  <div className="exp-sub">{count} personne{count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
