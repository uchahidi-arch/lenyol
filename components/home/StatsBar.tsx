'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCountUp } from '@/hooks/useCountUp';

interface Stats {
  persons: number;
  families: number;
  localites: number;
  regions: number;
}

interface TopItem { name: string; count: number }

export default function StatsBar() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ persons: 0, families: 0, localites: 0, regions: 0 });
  const [topFamilies, setTopFamilies] = useState<TopItem[]>([]);
  const [topRegions, setTopRegions] = useState<TopItem[]>([]);
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [personsRes, clansRes, localitesRes, regionsRes, recentRes] = await Promise.all([
          supabase.from('persons').select('*', { count: 'exact', head: true }),
          supabase.from('persons').select('clan'),
          supabase.from('persons').select('localite'),
          supabase.from('persons').select('region'),
          supabase.from('persons').select('nom, prenom').order('created_at', { ascending: false }).limit(8),
        ]);

        const clans = (clansRes.data || []).map((x: any) => x.clan).filter(Boolean);
        const locs  = (localitesRes.data || []).map((x: any) => x.localite).filter(Boolean);
        const regs  = (regionsRes.data || []).map((x: any) => x.region).filter(Boolean);

        const countMap = (arr: string[]) =>
          arr.reduce<Record<string, number>>((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});

        const toTop = (map: Record<string, number>, n = 5): TopItem[] =>
          Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));

        setStats({
          persons:   personsRes.count || 0,
          families:  [...new Set(clans)].length,
          localites: [...new Set(locs)].length,
          regions:   [...new Set(regs)].length,
        });
        setTopFamilies(toTop(countMap(clans)));
        setTopRegions(toTop(countMap(regs)));
        setRecentNames(
          (recentRes.data || [])
            .map((x: any) => [x.prenom, x.nom].filter(Boolean).join(' '))
            .filter(Boolean)
            .slice(0, 6)
        );
      } catch (e) {
        console.warn('[StatsBar]', e);
      }
    };
    load();
  }, []);

  return (
    <section className="lnu-explore" id="explorer">
      <div className="lnu-explore-inner">

        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Explorer le registre</span>
          <h2 className="lnu-section-title">Ce que contient Lenyol</h2>
          <p className="lnu-section-sub">Des données réelles, enrichies par la communauté.</p>
        </div>

        {/* Compteurs */}
        <div className="lnu-counters">
          <StatCell value={stats.persons}   label="Personnes"  onClick={() => router.push('/registre')} />
          <StatCell value={stats.families}  label="Familles"   onClick={() => router.push('/registre')} />
          <StatCell value={stats.localites} label="Localités"  />
          <StatCell value={stats.regions}   label="Régions"    />
        </div>

        {/* Listes */}
        <div className="lnu-lists">
          <div className="lnu-list-block">
            <div className="lnu-list-title">Familles les plus représentées</div>
            <table className="lnu-table">
              <tbody>
                {topFamilies.length > 0
                  ? topFamilies.map(f => (
                    <tr key={f.name} className="lnu-tr" onClick={() => router.push(`/registre?q=${encodeURIComponent(f.name)}&cat=Famille`)}>
                      <td className="lnu-td-name">{f.name}</td>
                      <td className="lnu-td-count">{f.count} personnes</td>
                      <td className="lnu-td-arrow">→</td>
                    </tr>
                  ))
                  : [1,2,3,4,5].map(i => <tr key={i} className="lnu-tr lnu-tr-ghost"><td colSpan={3}>&nbsp;</td></tr>)
                }
              </tbody>
            </table>
          </div>

          <div className="lnu-list-block">
            <div className="lnu-list-title">Régions les plus actives</div>
            <table className="lnu-table">
              <tbody>
                {topRegions.length > 0
                  ? topRegions.map(r => (
                    <tr key={r.name} className="lnu-tr" onClick={() => router.push(`/registre?region=${encodeURIComponent(r.name)}`)}>
                      <td className="lnu-td-name">{r.name}</td>
                      <td className="lnu-td-count">{r.count} personnes</td>
                      <td className="lnu-td-arrow">→</td>
                    </tr>
                  ))
                  : [1,2,3,4,5].map(i => <tr key={i} className="lnu-tr lnu-tr-ghost"><td colSpan={3}>&nbsp;</td></tr>)
                }
              </tbody>
            </table>
          </div>

          <div className="lnu-list-block">
            <div className="lnu-list-title">Noms récemment ajoutés</div>
            <ul className="lnu-name-list">
              {recentNames.length > 0
                ? recentNames.map(n => <li key={n} className="lnu-name-item">{n}</li>)
                : [1,2,3,4,5,6].map(i => <li key={i} className="lnu-name-item lnu-name-ghost">&nbsp;</li>)
              }
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}

function StatCell({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className={`lnu-counter${onClick ? ' clickable' : ''}`} onClick={onClick}>
      <div className="lnu-counter-num">{value > 0 ? count : '—'}</div>
      <div className="lnu-counter-lbl">{label}</div>
    </div>
  );
}
