'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/hooks/useAppState';
import type { Person, Union } from '@/lib/types';

// ─── Utilities ───────────────────────────────────────────────────

function normalize(s: string) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function esc(s: string | null | undefined): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// BFS: root person + all descendants
function collectBFS(rootId: string, persons: Person[], unions: Union[]): Person[] {
  const personMap = new Map(persons.map(p => [p.id, p]));
  const result: Person[] = [];
  const queue: string[] = [rootId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const person = personMap.get(id);
    if (person) result.push(person);
    for (const union of unions) {
      if (union.pere_id === id || union.mere_id === id) {
        for (const childId of union.enfants_ids ?? []) {
          if (!visited.has(childId)) queue.push(childId);
        }
      }
    }
  }

  return result;
}

// Convert image URL to data URL via canvas (handles CORS)
async function toDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')?.drawImage(img, 0, 0);
      try {
        resolve(c.toDataURL('image/jpeg'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ─── HTML page template (A4 = 794 × 1123 px at 96 dpi) ──────────

function buildPageHTML(
  person: Person,
  pere: Person | undefined,
  mere: Person | undefined,
  conjoints: Person[],
  enfants: Person[],
  photo: string | null,
  pageNum: number,
  total: number,
): string {
  const G = '#1a3d2e';
  const initials = ((person.prenom?.[0] || '') + (person.nom?.[0] || '')).toUpperCase();

  const photoEl = photo
    ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:white;font-weight:700;font-family:Georgia,serif;">${esc(initials)}</div>`;

  const badges = [person.ethnie, person.region, person.clan, person.galle].filter(Boolean) as string[];
  const badgeHTML = badges
    .map(b => `<span style="display:inline-block;padding:3px 11px;border-radius:20px;background:rgba(26,61,46,0.09);color:${G};font-size:11px;font-weight:600;font-family:sans-serif;">${esc(b)}</span>`)
    .join('');

  const birth = person.naiss_date
    ? new Date(person.naiss_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : person.naiss_annee ? String(person.naiss_annee) : null;
  const birthStr = [birth, person.naiss_lieu].filter(Boolean).join(' · ');

  const death = person.deceased
    ? (person.deces_date
        ? new Date(person.deces_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : person.deces_annee ? String(person.deces_annee) : null)
    : null;

  const location = [person.region, person.localite].filter(Boolean).join(' · ');

  const infoRows: [string, string][] = [
    ...(birthStr ? [['Naissance', birthStr] as [string, string]] : []),
    ...(death ? [['Décès', death] as [string, string]] : []),
    ...(location ? [['Région', location] as [string, string]] : []),
    ...(person.metier ? [['Métier', person.metier] as [string, string]] : []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((person as any).confrérie ? [['Confrérie', (person as any).confrérie] as [string, string]] : []),
    ...(person.caste ? [['Caste', person.caste] as [string, string]] : []),
    ...(person.royaume ? [['Royaume', person.royaume] as [string, string]] : []),
  ];

  const infoHTML = infoRows.map(([label, value]) => `
    <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
      <span style="min-width:78px;font-size:10px;color:#aaa;font-family:sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding-top:1px;">${esc(label)}</span>
      <span style="font-size:12px;color:#444;font-family:sans-serif;line-height:1.5;">${esc(value)}</span>
    </div>`).join('');

  const relRows: [string, string][] = [
    ...(pere ? [['Père', `${esc(pere.prenom)} ${esc(pere.nom)}`] as [string, string]] : []),
    ...(mere ? [['Mère', `${esc(mere.prenom)} ${esc(mere.nom)}`] as [string, string]] : []),
    ...(conjoints.length ? [['Conjoint(s)', conjoints.map(c => `${esc(c.prenom)} ${esc(c.nom)}`).join(', ')] as [string, string]] : []),
    ...(enfants.length ? [['Enfants', enfants.map(e => `${esc(e.prenom)} ${esc(e.nom)}`).join(' · ')] as [string, string]] : []),
  ];

  const relHTML = relRows.map(([label, value]) => `
    <div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
      <span style="min-width:78px;font-size:10px;color:#aaa;font-family:sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding-top:1px;">${esc(label)}</span>
      <span style="font-size:12px;color:#444;font-family:sans-serif;line-height:1.5;">${value}</span>
    </div>`).join('');

  const notesHTML = person.notes
    ? `<div style="margin-top:16px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;font-family:sans-serif;margin-bottom:6px;">Biographie</div>
        <p style="font-size:12px;color:#555;font-family:sans-serif;line-height:1.7;margin:0;max-height:180px;overflow:hidden;">${esc(person.notes)}</p>
       </div>`
    : '';

  return `<div style="width:794px;height:1123px;background:#fff;position:relative;overflow:hidden;box-sizing:border-box;">
  <div style="width:100%;height:5px;background:${G};"></div>
  <div style="padding:32px 52px 56px;">
    <div style="display:flex;justify-content:center;margin-bottom:14px;">
      <div style="width:100px;height:100px;border-radius:50%;background:${G};overflow:hidden;border:2px solid rgba(26,61,46,0.25);flex-shrink:0;">
        ${photoEl}
      </div>
    </div>
    <h1 style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:27px;font-weight:700;color:${G};margin:0 0 10px 0;line-height:1.2;">${esc(person.prenom)} ${esc(person.nom)}</h1>
    ${badges.length > 0
      ? `<div style="display:flex;justify-content:center;gap:5px;flex-wrap:wrap;margin-bottom:16px;">${badgeHTML}</div>`
      : '<div style="margin-bottom:16px;"></div>'}
    <div style="height:1px;background:rgba(26,61,46,0.14);margin-bottom:18px;"></div>
    <div style="display:flex;gap:28px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;font-family:sans-serif;margin-bottom:8px;">Informations</div>
        ${infoHTML || '<span style="font-size:12px;color:#ddd;font-family:sans-serif;">—</span>'}
        ${notesHTML}
      </div>
      <div style="width:210px;flex-shrink:0;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#bbb;font-family:sans-serif;margin-bottom:8px;">Relations</div>
        ${relHTML || '<span style="font-size:12px;color:#ddd;font-family:sans-serif;">—</span>'}
      </div>
    </div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:36px;background:${G};display:flex;align-items:center;justify-content:space-between;padding:0 52px;">
    <span style="font-size:10px;color:rgba(255,255,255,0.7);font-family:sans-serif;letter-spacing:0.04em;">Lenyol — Préserver notre mémoire collective</span>
    <span style="font-size:10px;color:rgba(255,255,255,0.45);font-family:sans-serif;">${pageNum} / ${total}</span>
  </div>
</div>`;
}

// ─── PDF generation ───────────────────────────────────────────────

async function generatePDF(
  ordered: Person[],
  persons: Person[],
  unions: Union[],
  onProgress: (current: number, total: number) => void,
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const personMap = new Map(persons.map(p => [p.id, p]));
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:-9999px;z-index:9999;pointer-events:none;';
  document.body.appendChild(wrapper);

  try {
    for (let i = 0; i < ordered.length; i++) {
      const person = ordered[i];
      onProgress(i + 1, ordered.length);

      if (i > 0) pdf.addPage();

      // Relations
      const personUnions = unions.filter(u => u.pere_id === person.id || u.mere_id === person.id);
      const parentUnion  = unions.find(u => (u.enfants_ids ?? []).includes(person.id));
      const pere = parentUnion?.pere_id ? personMap.get(parentUnion.pere_id) : undefined;
      const mere = parentUnion?.mere_id ? personMap.get(parentUnion.mere_id) : undefined;
      const conjoints = personUnions.flatMap(u => {
        const ids: string[] = [];
        if (u.pere_id && u.pere_id !== person.id) ids.push(u.pere_id);
        if (u.mere_id && u.mere_id !== person.id) ids.push(u.mere_id);
        return ids.map(id => personMap.get(id)).filter(Boolean) as Person[];
      });
      const enfants = personUnions.flatMap(u =>
        (u.enfants_ids ?? []).map(id => personMap.get(id)).filter(Boolean) as Person[]
      );

      // Photo (convert to data URL to avoid CORS issues)
      const photo = person.photo_url ? await toDataUrl(person.photo_url) : null;

      wrapper.innerHTML = buildPageHTML(person, pere, mere, conjoints, enfants, photo, i + 1, ordered.length);

      await document.fonts.ready;
      // Brief paint delay
      await new Promise(r => setTimeout(r, 40));

      const el = wrapper.firstElementChild as HTMLElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
  } finally {
    document.body.removeChild(wrapper);
  }

  const blob = pdf.output('blob');
  return URL.createObjectURL(blob);
}

// ─── Component ───────────────────────────────────────────────────

export default function LivrePage() {
  const { state } = useAppState();
  const [searchQ,  setSearchQ]  = useState('');
  const [selected, setSelected] = useState<Person | null>(null);
  const [step,     setStep]     = useState<'select' | 'generating' | 'done'>('select');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pdfUrl,   setPdfUrl]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return state.myPersons.slice(0, 30);
    const q = normalize(searchQ);
    return state.myPersons
      .filter(p => {
        const target = normalize([p.prenom, p.nom].filter(Boolean).join(' '));
        return q.split(/\s+/).every(t => target.includes(t));
      })
      .slice(0, 30);
  }, [state.myPersons, searchQ]);

  const descendantCount = useMemo(() => {
    if (!selected) return 0;
    return collectBFS(selected.id, state.myPersons, state.myUnions).length;
  }, [selected, state.myPersons, state.myUnions]);

  async function handleGenerate() {
    if (!selected) return;
    setStep('generating');
    setPdfUrl(null);
    setError(null);

    try {
      const ordered = collectBFS(selected.id, state.myPersons, state.myUnions);
      const url = await generatePDF(
        ordered,
        state.myPersons,
        state.myUnions,
        (current, total) => setProgress({ current, total }),
      );
      setPdfUrl(url);
      setStep('done');
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Une erreur est survenue lors de la génération. Veuillez réessayer.');
      setStep('select');
    }
  }

  const G = '#1a3d2e';

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '48px 32px 36px var(--page-left)' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: 700,
            fontFamily: "'Cormorant Garamond', serif",
            color: 'var(--t1)',
            lineHeight: 1.2,
            margin: '0 0 10px 0',
          }}>
            Livre de famille
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--t3)',
            margin: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            maxWidth: 560,
            lineHeight: 1.7,
          }}>
            Un livret PDF A4, une page par personne, de l'ancêtre choisi à toute sa descendance.
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '36px 32px 60px var(--page-left)', maxWidth: 720 }}>

        {/* ═══ STEP: SELECT ═══ */}
        {step === 'select' && (
          <>
            {state.myPersons.length === 0 ? (
              <div style={{
                padding: '40px 32px',
                border: '1px dashed var(--bd)',
                borderRadius: 12,
                textAlign: 'center',
                color: 'var(--t3)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14,
              }}>
                Votre arbre est vide. Ajoutez des personnes pour générer un livre.
              </div>
            ) : (
              <>
                {/* Search */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block', marginBottom: 8,
                    fontSize: 13, fontWeight: 600, color: 'var(--t2)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    Choisissez un ancêtre (point de départ)
                  </label>
                  <div className="exp-search" style={{ maxWidth: 360 }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      value={searchQ}
                      onChange={e => { setSearchQ(e.target.value); setSelected(null); }}
                      placeholder="Rechercher un nom…"
                    />
                  </div>
                </div>

                {/* Person list */}
                <div style={{
                  border: '1px solid var(--bd)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 24,
                  maxHeight: 360,
                  overflowY: 'auto',
                }}>
                  {filtered.length === 0 ? (
                    <div style={{
                      padding: '20px 16px',
                      fontSize: 13,
                      color: 'var(--t3)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      Aucun résultat.
                    </div>
                  ) : filtered.map((p, i) => {
                    const isSelected = selected?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          padding: '10px 14px',
                          border: 'none',
                          borderTop: i > 0 ? '1px solid var(--bd)' : 'none',
                          background: isSelected ? 'rgba(26,61,46,0.07)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--warm2)'; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isSelected ? G : 'var(--warm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 13, fontWeight: 700,
                          color: isSelected ? 'white' : 'var(--t2)',
                          overflow: 'hidden',
                        }}>
                          {p.photo_url
                            ? <img src={p.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : ((p.prenom[0] || '') + (p.nom[0] || '')).toUpperCase()
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 600,
                            color: isSelected ? G : 'var(--t1)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                            {p.prenom} {p.nom}
                          </div>
                          {(p.clan || p.region || p.naiss_annee) && (
                            <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 1 }}>
                              {[p.clan, p.region, p.naiss_annee ? `né ${p.naiss_annee}` : null].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected preview + generate */}
                {selected && (
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: 10,
                    border: `1px solid rgba(26,61,46,0.25)`,
                    background: 'rgba(26,61,46,0.04)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: G }}>
                        {selected.prenom} {selected.nom}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--t3)', marginLeft: 8 }}>
                        + {descendantCount - 1} descendant{descendantCount - 1 !== 1 ? 's' : ''}
                        {' '}→{' '}
                        <strong style={{ color: G }}>{descendantCount} page{descendantCount !== 1 ? 's' : ''}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px',
                    borderRadius: 8, background: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontSize: 13, color: '#b91c1c',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {error}
                  </div>
                )}

                <button
                  className="btn btn-pri"
                  onClick={handleGenerate}
                  disabled={!selected}
                  style={{ fontSize: 14, opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed' }}
                >
                  Générer le livre
                </button>
              </>
            )}
          </>
        )}

        {/* ═══ STEP: GENERATING ═══ */}
        {step === 'generating' && (
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 20,
            }}>
              <div className="spin" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>
                Génération en cours…
              </span>
            </div>

            {progress.total > 0 && (
              <>
                {/* Progress bar */}
                <div style={{
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--warm)',
                  marginBottom: 10,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(progress.current / progress.total) * 100}%`,
                    background: G,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
                  Page {progress.current} / {progress.total} — {selected?.prenom} {selected?.nom} et sa descendance
                </p>
              </>
            )}
          </div>
        )}

        {/* ═══ STEP: DONE ═══ */}
        {step === 'done' && pdfUrl && (
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 24,
              padding: '14px 18px',
              borderRadius: 10,
              background: 'rgba(26,61,46,0.06)',
              border: '1px solid rgba(26,61,46,0.2)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: G }}>
                Livre généré — {progress.total} page{progress.total !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href={pdfUrl}
                download={`livre-famille-${(selected?.nom || 'famille').toLowerCase().replace(/\s+/g, '-')}.pdf`}
                className="btn btn-pri"
                style={{ fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger le PDF
              </a>
              <button
                className="btn btn-sec"
                style={{ fontSize: 14 }}
                onClick={() => {
                  setStep('select');
                  setSelected(null);
                  setSearchQ('');
                  setPdfUrl(null);
                }}
              >
                Générer un autre livre
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
