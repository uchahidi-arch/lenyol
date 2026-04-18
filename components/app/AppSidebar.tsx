'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/hooks/useSidebar';
import { useAppState } from '@/hooks/useAppState';

/* ── Types exposés par chaque page via son contexte ── */
export interface RegistreSidebarCbs {
  jumpToEthnie: (name: string) => void;
  jumpToRegion: (name: string) => void;
  pickLenyol: (label: string) => void;
  loadNomField: () => void;
  filteredNomGroups: { label: string; count: number }[];
}

export interface RacinesFilterCbs {
  categorie: string;
  setCategorie: (v: string) => void;
}

const ETHNIES = ['Wolof', 'Peul', 'Sérère', 'Mandingue', 'Toucouleur', 'Diola'];

const REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kaffrine',
  'Kolda', 'Ziguinchor', 'Sédhiou', 'Tambacounda', 'Kédougou', 'Matam',
  'Saint-Louis', 'Louga', 'Touba',
];

const RACINES_CATS = ['Tous', 'Royaumes', 'Lignées', 'Ethnies', 'Familles'];

const ROYAUMES = ['Djolof', 'Cayor', 'Baol', 'Sine', 'Saloum', 'Walo', 'Fouta Toro', 'Gabu'];

const PERIODES = ['Avant 1500', 'XVIe siècle', 'XVIIe siècle', 'XVIIIe siècle', 'XIXe siècle', 'XXe siècle'];

interface Props {
  registreCbs?: React.RefObject<RegistreSidebarCbs | null>;
  racinesCbs?: RacinesFilterCbs;
}

function CollapsibleSection({
  title, open, onToggle, children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '2px' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '7px 14px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.12em', color: 'var(--t3)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
      >
        <span>{title}</span>
        <span style={{
          fontSize: '12px',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.18s',
          display: 'inline-block',
          lineHeight: 1,
        }}>›</span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '600px' : '0px',
        transition: 'max-height 0.22s ease',
      }}>
        <div style={{ padding: '2px 6px 8px 8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CheckItem({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '5px 6px', borderRadius: '7px', cursor: 'pointer',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '13px', color: checked ? '#1A3A2A' : 'var(--t1)',
      fontWeight: checked ? 600 : 400,
      userSelect: 'none',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{
        width: '14px', height: '14px', borderRadius: '4px', flexShrink: 0,
        border: checked ? '2px solid #1A3A2A' : '1.5px solid rgba(0,0,0,0.2)',
        background: checked ? '#1A3A2A' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s',
      }}>
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      {label}
    </label>
  );
}

export default function AppSidebar({ registreCbs, racinesCbs }: Props) {
  const { isOpen, toggle, nomQ, setNomQ } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useAppState();

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [checkedEthnies, setCheckedEthnies] = useState<Set<string>>(new Set());
  const [checkedRegions, setCheckedRegions] = useState<Set<string>>(new Set());
  const [checkedRoyaumes, setCheckedRoyaumes] = useState<Set<string>>(new Set());
  const [checkedPeriodes, setCheckedPeriodes] = useState<Set<string>>(new Set());

  function toggleSection(key: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleCheck(
    key: string,
    set: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    onCheck?: (v: string) => void,
  ) {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else {
        next.add(key);
        onCheck?.(key);
      }
      return next;
    });
  }

  const isRegistre  = pathname.startsWith('/registre');
  const isRacines   = pathname.startsWith('/racines');
  const isMonArbre  = pathname.startsWith('/monarbre');
  const isGriot     = pathname.startsWith('/griot');

  const recentPersons = [...(state.myPersons ?? [])]
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 6);

  const label = (s: string) => (
    <div style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '.12em', color: 'var(--t3)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      marginBottom: '8px', paddingLeft: '14px',
    }}>
      {s}
    </div>
  );

  const divider = (
    <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '12px 0 16px' }} />
  );

  const itemBtn = (text: string, onClick: () => void, active = false) => (
    <button
      key={text}
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '6px 14px', borderRadius: '8px', border: 'none',
        background: active ? 'var(--green-bg)' : 'transparent',
        color: active ? 'var(--green)' : 'var(--t1)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '13px', cursor: 'pointer',
        transition: 'background 0.12s', marginBottom: '1px',
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={e => !active && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--warm2)')}
      onMouseLeave={e => !active && ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
    >
      {text}
    </button>
  );

  return (
    <>
      {/* Bouton ouvrir quand fermé */}
      {!isOpen && (
        <button
          onClick={toggle}
          title="Afficher les filtres"
          style={{
            position: 'fixed', left: '8px', top: '50vh',
            transform: 'translateY(-50%)',
            width: '28px', height: '48px',
            border: '1px solid var(--bd)', borderRadius: '8px',
            background: 'rgba(252,252,250,0.95)', backdropFilter: 'blur(8px)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: 'var(--t2)', zIndex: 200,
            boxShadow: 'var(--sh)',
          }}
        >›</button>
      )}

      <aside style={{
        width: isOpen ? '192px' : '0px',
        flexShrink: 0,
        position: 'sticky',
        top: '72px',
        height: 'calc(100vh - 72px)',
        overflow: 'hidden',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        background: 'rgba(252,252,250,0.92)',
        backdropFilter: 'blur(14px)',
        borderRight: isOpen ? '1px solid rgba(0,0,0,0.07)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 90,
      }}>
        {/* Inner — fixed 192px pour éviter le rétrécissement pendant la transition */}
        <div style={{ width: '192px', display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Bouton fermer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 8px 4px' }}>
            <button
              onClick={toggle}
              title="Réduire"
              style={{
                width: '28px', height: '28px', border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '8px', background: 'rgba(255,255,255,0.9)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: 'var(--t2)',
              }}
            >‹</button>
          </div>

          {/* Contenu scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 32px 4px' }}>

            {/* ═══ REGISTRE ═══ */}
            {isRegistre && registreCbs?.current && (
              <>
                <CollapsibleSection
                  title="Région"
                  open={openSections.has('region')}
                  onToggle={() => toggleSection('region')}
                >
                  {REGIONS.map(r => (
                    <CheckItem
                      key={r} label={r}
                      checked={checkedRegions.has(r)}
                      onChange={() => toggleCheck(r, checkedRegions, setCheckedRegions,
                        () => registreCbs.current?.jumpToRegion(r))}
                    />
                  ))}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Ethnie"
                  open={openSections.has('ethnie')}
                  onToggle={() => toggleSection('ethnie')}
                >
                  {ETHNIES.map(e => (
                    <CheckItem
                      key={e} label={e}
                      checked={checkedEthnies.has(e)}
                      onChange={() => toggleCheck(e, checkedEthnies, setCheckedEthnies,
                        () => registreCbs.current?.jumpToEthnie(e))}
                    />
                  ))}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Royaume d'origine"
                  open={openSections.has('royaume')}
                  onToggle={() => toggleSection('royaume')}
                >
                  {ROYAUMES.map(r => (
                    <CheckItem
                      key={r} label={r}
                      checked={checkedRoyaumes.has(r)}
                      onChange={() => toggleCheck(r, checkedRoyaumes, setCheckedRoyaumes)}
                    />
                  ))}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Période"
                  open={openSections.has('periode')}
                  onToggle={() => toggleSection('periode')}
                >
                  {PERIODES.map(p => (
                    <CheckItem
                      key={p} label={p}
                      checked={checkedPeriodes.has(p)}
                      onChange={() => toggleCheck(p, checkedPeriodes, setCheckedPeriodes)}
                    />
                  ))}
                </CollapsibleSection>

                {divider}

                {label('Nom de famille')}
                <input
                  value={nomQ}
                  onChange={ev => {
                    setNomQ(ev.target.value);
                    if (registreCbs.current) {
                      registreCbs.current.loadNomField();
                    }
                  }}
                  placeholder="Rechercher…"
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.85)',
                    fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    outline: 'none', color: 'var(--t1)', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)')}
                />
                {nomQ.trim() && registreCbs.current.filteredNomGroups.slice(0, 8).map(({ label: l, count }) => (
                  <button
                    key={l}
                    onClick={() => { setNomQ(''); registreCbs.current!.pickLenyol(l); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '6px 10px', borderRadius: '8px', border: 'none',
                      background: 'transparent', cursor: 'pointer', marginTop: '2px',
                      fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{l}</span>
                    <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '8px' }}>{count}</span>
                  </button>
                ))}
              </>
            )}

            {/* ═══ RACINES ═══ */}
            {isRacines && racinesCbs && (
              <>
                {label('Catégorie')}
                {RACINES_CATS.map(c => itemBtn(c, () => racinesCbs.setCategorie(c), racinesCbs.categorie === c))}
              </>
            )}

            {/* ═══ MON ARBRE ═══ */}
            {isMonArbre && (
              <>
                {recentPersons.length > 0 && (
                  <>
                    {label('Récemment ajoutés')}
                    {recentPersons.map(p => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/monarbre/${p.id}`)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '6px 10px', borderRadius: '8px', border: 'none',
                          background: 'transparent', cursor: 'pointer', marginBottom: '1px',
                          fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.prenom} {p.nom || ''}
                        </div>
                        {p.localite && (
                          <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '1px' }}>{p.localite}</div>
                        )}
                      </button>
                    ))}
                    {divider}
                  </>
                )}

                {label('Mon Arbre')}
                {itemBtn('Toutes les personnes', () => router.push('/monarbre'))}
                {itemBtn('Ajouter une personne', () => router.push('/monarbre/nouveau'))}
                {itemBtn('Nouveau mariage', () => router.push('/monarbre/union/nouvelle'))}
              </>
            )}

            {/* ═══ GRIOT ═══ */}
            {isGriot && (
              <>
                {label('Bientôt disponible')}
                <div style={{ fontSize: '12px', color: 'var(--t3)', padding: '4px 10px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Les filtres Griot seront disponibles prochainement.
                </div>
              </>
            )}

          </div>
        </div>
      </aside>
    </>
  );
}
