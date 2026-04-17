'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/slugify';

export default function LenyolIndexPage() {
  const router = useRouter();
  const [lenyolGroups, setLenyolGroups] = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('persons')
        .select('clan, prefix_lignee')
        .not('clan', 'is', null);

      const groups: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        const key = (p.prefix_lignee || 'Lenyol') + ' ' + p.clan;
        groups[key] = (groups[key] || 0) + 1;
      });

      const sorted = Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }));

      setLenyolGroups(sorted);
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
          <span className="bc-current-v2">Par Lenyol</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="folder-grid">
              <div className="empty-grid">
                <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
              </div>
            </div>
          ) : lenyolGroups.length === 0 ? (
            <div className="empty-grid">Aucun lenyol trouvé.</div>
          ) : (
            <div className="folder-grid">
              {lenyolGroups.map(({ label, count }) => (
                <div
                  key={label}
                  className="exp-card fadein"
                  onClick={() => router.push(`/registre/lenyol/${slugify(label)}`)}
                >
                  <div className="exp-ico">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="13,2 23,7.5 23,18.5 13,24 3,18.5 3,7.5" stroke="#2D5A3D" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <div className="exp-title">{label}</div>
                  <div className="exp-sub">{count} personne{count !== 1 ? 's' : ''}</div>
                </div>
              ))}
              <div
                className="exp-card fadein"
                onClick={() => router.push(`/registre/lenyol/__sans__`)}
              >
                <div className="exp-ico">❓</div>
                <div className="exp-title">Sans Lenyol</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
