'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type MapPerson = {
  id: string;
  prenom: string;
  nom: string;
  localite: string | null;
  region: string | null;
  naiss_lieu: string | null;
  clan: string | null;
  ethnie: string | null;
  naiss_annee: number | null;
};

const REGION_COORDS: Record<string, [number, number]> = {
  'Dakar':       [14.6928, -17.4467],
  'Thiès':       [14.7833, -16.9333],
  'Diourbel':    [14.6500, -16.2333],
  'Fatick':      [14.3390, -16.4115],
  'Kaolack':     [14.1520, -16.0758],
  'Saint-Louis': [16.0180, -16.4897],
  'Louga':       [15.6144, -16.2242],
  'Ziguinchor':  [12.5826, -16.2719],
  'Kolda':       [12.8986, -14.9410],
  'Tambacounda': [13.7707, -13.6673],
  'Matam':       [15.6559, -13.2557],
  'Kédougou':    [12.5560, -12.1747],
  'Kaffrine':    [14.1059, -15.5508],
  'Sédhiou':     [12.7080, -15.5570],
  'Touba':       [14.8500, -15.8833],
};

function seededOffset(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return [((h & 0xff) / 255 - 0.5) * 0.6, (((h >> 8) & 0xff) / 255 - 0.5) * 0.6];
}

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}

function loadCSS(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

export default function CartePage() {
  const { user } = useAuth();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const clusterRef   = useRef<any>(null);
  const layersRef    = useRef<{ layer: any; person: MapPerson }[]>([]);
  const cleanupRef   = useRef<(() => void) | null>(null);

  const [persons,       setPersons]       = useState<MapPerson[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [isMobile,      setIsMobile]      = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [ethnie,        setEthnie]        = useState('');
  const [clan,          setClan]          = useState('');

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = (mobile: boolean) => { setIsMobile(mobile); if (mobile) setSidebarOpen(false); };
    apply(mq.matches);
    const h = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Fetch persons
  useEffect(() => {
    if (!user) return;
    supabase
      .from('persons')
      .select('id, prenom, nom, localite, region, naiss_lieu, clan, ethnie, naiss_annee')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        setPersons(((data ?? []) as MapPerson[]).filter(p => p.region || p.localite));
        setLoading(false);
      });
  }, [user?.id]);

  // Derived lists for filters
  const regionCounts = (() => {
    const m: Record<string, number> = {};
    persons.forEach(p => { if (p.region) m[p.region] = (m[p.region] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  })();
  const ethnies = [...new Set(persons.map(p => p.ethnie).filter(Boolean) as string[])].sort();
  const clans   = [...new Set(persons.map(p => p.clan).filter(Boolean)   as string[])].sort();

  // Filter application
  const applyFilters = useCallback((e: string, c: string) => {
    if (!clusterRef.current) return;
    clusterRef.current.clearLayers();
    layersRef.current.forEach(({ layer, person }) => {
      if ((!e || person.ethnie === e) && (!c || person.clan === c))
        clusterRef.current.addLayer(layer);
    });
  }, []);

  useEffect(() => {
    applyFilters(ethnie, clan);
  }, [ethnie, clan, applyFilters]);

  // Sidebar toggle with map resize
  const toggleSidebar = (next: boolean) => {
    setSidebarOpen(next);
    setTimeout(() => mapRef.current?.invalidateSize(), 300);
  };

  // Map init
  useEffect(() => {
    if (loading || persons.length === 0 || mapRef.current || !containerRef.current) return;
    let active = true;

    (async () => {
      loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
      loadCSS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');
      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
      if (!active || !containerRef.current) return;

      const L = (window as any).L;

      const map = L.map(containerRef.current, {
        center: [14.4974, -14.4524],
        zoom: 6,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const cluster = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
      });
      clusterRef.current = cluster;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:20px;height:20px;background:#113B2E;border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -24],
      });

      const layers: typeof layersRef.current = [];

      persons.forEach(p => {
        const base = REGION_COORDS[p.region ?? ''];
        if (!base) return;
        const [dlat, dlng] = seededOffset(p.id);
        const marker = L.marker([base[0] + dlat, base[1] + dlng], { icon });

        marker.bindPopup(
          `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:180px;padding:2px 0">
            <div style="font-weight:700;font-size:14px;color:#0D1410;margin-bottom:6px">
              ${p.prenom}${p.nom ? ' ' + p.nom : ''}
            </div>
            ${p.region    ? `<div style="font-size:12px;color:#3A5045;margin-bottom:3px">📍 ${p.region}${p.localite ? ' · ' + p.localite : ''}</div>` : ''}
            ${p.ethnie    ? `<div style="font-size:12px;color:#3A5045;margin-bottom:3px">Ethnie : ${p.ethnie}</div>` : ''}
            ${p.clan      ? `<div style="font-size:12px;color:#3A5045;margin-bottom:3px">Clan : ${p.clan}</div>` : ''}
            ${p.naiss_annee ? `<div style="font-size:12px;color:#7A9080;margin-bottom:10px">Né(e) en ${p.naiss_annee}</div>` : '<div style="margin-bottom:10px"></div>'}
            <button class="crt-fiche" data-id="${p.id}"
              style="background:#113B2E;color:#fff;border:none;border-radius:8px;padding:7px 0;
                     width:100%;font-size:12px;font-weight:600;cursor:pointer;
                     font-family:'Plus Jakarta Sans',sans-serif;transition:background .15s">
              Voir la fiche →
            </button>
          </div>`,
          { maxWidth: 260, className: 'crt-popup' }
        );

        layers.push({ layer: marker, person: p });
      });

      layersRef.current = layers;
      layers.forEach(({ layer }) => cluster.addLayer(layer));
      map.addLayer(cluster);

      // Popup button navigation
      const el = containerRef.current!;
      const onClick = (e: MouseEvent) => {
        const btn = (e.target as Element).closest<HTMLElement>('.crt-fiche');
        if (btn?.dataset.id) routerRef.current.push(`/monarbre/${btn.dataset.id}`);
      };
      el.addEventListener('click', onClick);

      cleanupRef.current = () => {
        el.removeEventListener('click', onClick);
        map.remove();
        mapRef.current = null;
        clusterRef.current = null;
        layersRef.current = [];
      };
    })();

    return () => {
      active = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [loading, persons]);

  const zoomTo = (region: string) => {
    const c = REGION_COORDS[region];
    if (c && mapRef.current) mapRef.current.flyTo(c, 10, { duration: 1.2 });
  };

  // ── Styles ──────────────────────────────────────────────

  const labelSt: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.12em', color: 'var(--t3)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginBottom: '8px', paddingLeft: '14px', display: 'block',
  };

  const selectSt: React.CSSProperties = {
    width: '100%', padding: '6px 10px', borderRadius: '8px',
    background: 'var(--bg)', border: '1px solid var(--bd)',
    color: 'var(--t1)', fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none', cursor: 'pointer', marginBottom: '16px',
    WebkitAppearance: 'none', appearance: 'none',
  };

  // ── Shared sidebar content ───────────────────────────────

  const sidebarContent = (
    <>
      <div style={{
        background: 'var(--warm2)', borderRadius: '8px',
        padding: '10px 14px', marginBottom: '16px', marginLeft: '6px', marginRight: '6px',
        border: '1px solid var(--bd)',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1, fontFamily: "'Playfair Display',serif", color: 'var(--green)' }}>
          {persons.length}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '3px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          personnes localisées
        </div>
      </div>

      <span style={labelSt}>Ethnie</span>
      <select value={ethnie} onChange={e => setEthnie(e.target.value)} style={selectSt}>
        <option value="">Toutes les ethnies</option>
        {ethnies.map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <span style={labelSt}>Clan</span>
      <select value={clan} onChange={e => setClan(e.target.value)} style={selectSt}>
        <option value="">Tous les clans</option>
        {clans.map(v => <option key={v} value={v}>{v}</option>)}
      </select>

      <span style={labelSt}>Par région</span>
      {regionCounts.length === 0
        ? <div style={{ fontSize: '12px', color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans',sans-serif", paddingLeft: '4px' }}>Aucune donnée.</div>
        : regionCounts.map(([region, count]) => (
          <button
            key={region}
            onClick={() => zoomTo(region)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '6px 14px', borderRadius: '8px',
              background: 'transparent', border: 'none',
              color: 'var(--t1)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px',
              cursor: 'pointer', marginBottom: '1px', transition: 'background .12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span>{region}</span>
            <span style={{
              background: 'var(--green-bg)', borderRadius: '20px',
              padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--green)',
            }}>{count}</span>
          </button>
        ))
      }
    </>
  );

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Popup button hover style */}
      <style>{`.crt-fiche:hover { opacity: .85 !important; } .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 30px rgba(0,0,0,.15) !important; border: 1px solid #e5e7eb; } .leaflet-popup-content { margin: 14px 16px !important; }`}</style>

      <div style={{ display: 'flex', height: 'calc(100vh - 96px)', overflow: 'hidden', position: 'relative' }}>

        {/* ── Desktop sidebar ── */}
        {!isMobile && (
          <aside style={{
            width: sidebarOpen ? '192px' : '0px',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--cream)',
            backdropFilter: 'blur(14px)',
            borderRight: sidebarOpen ? '1px solid var(--bd)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '8px',
          }}>
            <div style={{ width: '192px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 8px 4px' }}>
                <button
                  onClick={() => toggleSidebar(false)}
                  title="Réduire"
                  style={{
                    width: '28px', height: '28px', border: '1px solid var(--bd)',
                    borderRadius: '8px', background: 'var(--warm)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', color: 'var(--t2)',
                  }}
                >‹</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 32px 4px' }}>
                {sidebarContent}
              </div>
            </div>
          </aside>
        )}

        {/* Sidebar show button (desktop, collapsed) */}
        {!isMobile && !sidebarOpen && (
          <button
            onClick={() => toggleSidebar(true)}
            title="Afficher les filtres"
            style={{
              position: 'fixed', left: '8px', top: '50vh', transform: 'translateY(-50%)',
              width: '28px', height: '48px', border: '1px solid var(--bd)',
              borderRadius: '8px', background: 'var(--cream)', backdropFilter: 'blur(8px)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: 'var(--t2)', zIndex: 200, boxShadow: 'var(--sh)',
            }}
          >›</button>
        )}

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg)', zIndex: 10 }}>
              <div className="spin" />
            </div>
          )}
          {!loading && persons.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg)', zIndex: 10, gap: '12px',
            }}>
              <svg width="48" height="48" fill="none" stroke="var(--t3)" strokeWidth="1.5" viewBox="0 0 24 24">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: '16px', color: 'var(--t1)' }}>
                Aucune personne localisée
              </div>
              <div style={{ fontSize: '13px', color: 'var(--t3)', textAlign: 'center', maxWidth: '280px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Ajoutez une région ou une localité à vos personnes pour les voir ici.
              </div>
            </div>
          )}
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* ── Mobile bottom sheet ── */}
        {isMobile && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 500,
            background: 'var(--cream)',
            backdropFilter: 'blur(14px)',
            borderRadius: '16px 16px 0 0',
            borderTop: '1px solid var(--bd)',
            boxShadow: 'var(--sh)',
            height: sheetExpanded ? '65vh' : '52px',
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div
              onClick={() => setSheetExpanded(v => !v)}
              style={{
                cursor: 'pointer', padding: '10px 16px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: sheetExpanded ? '1px solid var(--bd)' : 'none',
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '12px', color: 'var(--t2)', fontWeight: 600 }}>
                {persons.length} personnes localisées
              </span>
              <div style={{ width: '28px', height: '3px', background: 'var(--bd)', borderRadius: '2px' }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '13px', color: 'var(--t3)' }}>
                {sheetExpanded ? '↓' : '↑'}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
