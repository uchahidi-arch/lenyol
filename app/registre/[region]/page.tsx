'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PersonView from './_PersonView';

const SLUG_TO_ETHNIE: Record<string, string> = {
  wolof:       'Wolof',
  peul:        'Peul',
  serere:      'Sérère',
  mandingue:   'Mandingue',
  toucouleur:  'Toucouleur',
  diola:       'Diola',
};

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

const REGION_META: Record<string, { accent: string }> = {
  'Dakar':       { accent: '#1a3d2e' },
  'Thiès':       { accent: '#3d1a1a' },
  'Diourbel':    { accent: '#1a2e3d' },
  'Fatick':      { accent: '#2e1a3d' },
  'Kaolack':     { accent: '#1a3d2e' },
  'Saint-Louis': { accent: '#3d1a1a' },
  'Louga':       { accent: '#1a2e3d' },
  'Ziguinchor':  { accent: '#2e1a3d' },
  'Kolda':       { accent: '#1a3d2e' },
  'Tambacounda': { accent: '#3d1a1a' },
  'Matam':       { accent: '#1a2e3d' },
  'Kédougou':    { accent: '#2e1a3d' },
  'Kaffrine':    { accent: '#1a3d2e' },
  'Sédhiou':     { accent: '#3d1a1a' },
  'Touba':       { accent: '#1a2e3d' },
};

interface PersonRow {
  id: string;
  prenom: string | null;
  nom: string | null;
  ethnie: string | null;
  region: string | null;
  localite: string | null;
  naiss_annee: number | null;
  deces_annee: number | null;
  deceased: boolean | null;
}

function RegionView({ regionSlug }: { regionSlug: string }) {
  const router     = useRouter();
  const regionName = SLUG_TO_REGION[regionSlug];
  const meta       = REGION_META[regionName] ?? { accent: '#2e2e2e' };

  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('persons')
        .select('id, prenom, nom, ethnie, region, localite, naiss_annee, deces_annee, deceased')
        .eq('region', regionName)
        .eq('masque', false)
        .order('nom', { ascending: true });
      setPersons((data ?? []) as PersonRow[]);
      setLoading(false);
    });
  }, [regionName]);

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar / breadcrumb */}
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
            <span className="bc-current-v2">{regionName}</span>
          </div>
          {!loading && (
            <span style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>
              {persons.length} personne{persons.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="folder-grid">
            <div className="empty-grid">
              <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
            </div>
          </div>
        ) : persons.length === 0 ? (
          <div className="empty-grid">Aucune personne enregistrée pour cette région.</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Nom / Prénom',      width: '34%' },
                    { label: 'Ethnie',             width: '18%' },
                    { label: 'Région / Localité',  width: '28%' },
                    { label: 'Naissance – Décès',  width: '20%' },
                  ].map(({ label, width }) => (
                    <th
                      key={label}
                      style={{
                        width,
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--t3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        borderBottom: '2px solid var(--bd)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {persons.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/registre/${p.id}`)}
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.07)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent';
                    }}
                  >
                    <td style={{ padding: '11px 12px', fontSize: '14px', fontWeight: 600, color: meta.accent, fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.prenom} {p.nom?.toUpperCase()}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.ethnie || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {[p.region, p.localite].filter(Boolean).join(', ') || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.naiss_annee ?? '?'}
                      {p.deceased && ` – ${p.deces_annee ?? '†'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EthnieView({ ethnieLabel }: { ethnieLabel: string }) {
  const router = useRouter();
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('persons')
        .select('id, prenom, nom, ethnie, region, localite, naiss_annee, deces_annee, deceased')
        .eq('ethnie', ethnieLabel)
        .eq('masque', false)
        .order('nom', { ascending: true });
      setPersons((data ?? []) as PersonRow[]);
      setLoading(false);
    });
  }, [ethnieLabel]);

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="view-section" style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div className="explorer-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
            <span className="bc-item-v2" style={{ cursor: 'pointer' }} onClick={() => router.push('/registre')}>
              Registre
            </span>
            <span className="bc-sep-v2">›</span>
            <span className="bc-current-v2">{ethnieLabel}</span>
          </div>
          {!loading && (
            <span style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>
              {persons.length} personne{persons.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="folder-grid">
            <div className="empty-grid">
              <div className="spin" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
            </div>
          </div>
        ) : persons.length === 0 ? (
          <div className="empty-grid">Aucune personne enregistrée pour cette ethnie.</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Nom / Prénom',      width: '34%' },
                    { label: 'Ethnie',             width: '18%' },
                    { label: 'Région / Localité',  width: '28%' },
                    { label: 'Naissance – Décès',  width: '20%' },
                  ].map(({ label, width }) => (
                    <th key={label} style={{ width, padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '2px solid var(--bd)', whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {persons.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/registre/${p.id}`)}
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(45,106,79,0.07)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent'; }}
                  >
                    <td style={{ padding: '11px 12px', fontSize: '14px', fontWeight: 600, color: '#1a3d2e', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.prenom} {p.nom?.toUpperCase()}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.ethnie || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {[p.region, p.localite].filter(Boolean).join(', ') || <span style={{ color: 'var(--t3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--t2)', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      {p.naiss_annee ?? '?'}
                      {p.deceased && ` – ${p.deces_annee ?? '†'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ region: string }> }) {
  const { region } = use(params);

  if (SLUG_TO_REGION[region]) return <RegionView regionSlug={region} />;
  if (SLUG_TO_ETHNIE[region]) return <EthnieView ethnieLabel={SLUG_TO_ETHNIE[region]} />;

  return <PersonView id={region} />;
}
