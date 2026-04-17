'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SLUG_TO_REGION: Record<string, string> = {
  dakar:         'Dakar',
  thies:         'Thiès',
  diourbel:      'Diourbel',
  fatick:        'Fatick',
  kaolack:       'Kaolack',
  'saint-louis': 'Saint-Louis',
  louga:         'Louga',
  ziguinchor:    'Ziguinchor',
  kolda:         'Kolda',
  tambacounda:   'Tambacounda',
  matam:         'Matam',
  kedougou:      'Kédougou',
  kaffrine:      'Kaffrine',
  sedhiou:       'Sédhiou',
  touba:         'Touba',
};

const REGION_META: Record<string, { accent: string; nameSenegalais: string }> = {
  'Dakar':       { accent: '#1a3d2e', nameSenegalais: 'Dakar'       },
  'Thiès':       { accent: '#3d1a1a', nameSenegalais: 'Thiès'       },
  'Diourbel':    { accent: '#1a2e3d', nameSenegalais: 'Diourbel'    },
  'Fatick':      { accent: '#2e1a3d', nameSenegalais: 'Fatick'      },
  'Kaolack':     { accent: '#1a3d2e', nameSenegalais: 'Kaolack'     },
  'Saint-Louis': { accent: '#3d1a1a', nameSenegalais: 'Saint-Louis' },
  'Louga':       { accent: '#1a2e3d', nameSenegalais: 'Louga'       },
  'Ziguinchor':  { accent: '#2e1a3d', nameSenegalais: 'Ziguinchor'  },
  'Kolda':       { accent: '#1a3d2e', nameSenegalais: 'Kolda'       },
  'Tambacounda': { accent: '#3d1a1a', nameSenegalais: 'Tambacounda' },
  'Matam':       { accent: '#1a2e3d', nameSenegalais: 'Matam'       },
  'Kédougou':    { accent: '#2e1a3d', nameSenegalais: 'Kédougou'    },
  'Kaffrine':    { accent: '#1a3d2e', nameSenegalais: 'Kaffrine'    },
  'Sédhiou':     { accent: '#3d1a1a', nameSenegalais: 'Sédhiou'     },
  'Touba':       { accent: '#1a2e3d', nameSenegalais: 'Touba'       },
};

function slugify(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface LocaliteRow { region: string; departement: string; localite: string }

export default function DepartementPage({
  params,
}: {
  params: Promise<{ region: string; departement: string }>;
}) {
  const { region: regionSlug, departement: departementSlug } = use(params);
  const router = useRouter();

  const regionName = SLUG_TO_REGION[regionSlug];
  const meta       = REGION_META[regionName] ?? { accent: '#2e2e2e', nameSenegalais: '' };

  const [localites, setLocalites]           = useState<string[]>([]);
  const [departementName, setDepartementName] = useState('');
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);

  useEffect(() => {
    if (!regionName) { setNotFound(true); setLoading(false); return; }

    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('localites')
        .select('region, departement, localite')
        .eq('region', regionName)
        .order('localite', { ascending: true });

      const rows = (data ?? []) as LocaliteRow[];
      const match = rows.filter(r => slugify(r.departement) === departementSlug);

      if (match.length === 0) { setNotFound(true); setLoading(false); return; }

      setDepartementName(match[0].departement);
      setLocalites(match.map(r => r.localite));
      setLoading(false);
    });
  }, [regionName, departementSlug]);

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

  if (notFound) {
    return (
      <div className="view-section">
        <div className="empty-grid">Département introuvable.</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb */}
        <div className="explorer-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span
              className="bc-item-v2"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push('/registre')}
            >
              Registre
            </span>
            <span className="bc-sep-v2">›</span>
            <span
              className="bc-item-v2"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/registre/${regionSlug}`)}
            >
              {regionName}
            </span>
            <span className="bc-sep-v2">›</span>
            <span className="bc-current-v2">{departementName}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>
            {meta.nameSenegalais}
          </span>
        </div>

        {/* Grille localités */}
        {localites.length === 0 ? (
          <div className="empty-grid">Aucune localité enregistrée pour ce département.</div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {localites.map(loc => (
                <div
                  key={loc}
                  className="fadein"
                  onClick={() => router.push(`/registre/localite/${regionSlug}/${departementSlug}/${slugify(loc)}`)}
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '20px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(20,18,13,0.14)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.08)';
                  }}
                >
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>🏘️</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: meta.accent, textAlign: 'center', lineHeight: 1.3 }}>
                    {loc}
                  </span>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
