'use client';

/* ──────────────────────────────────────────────────────────
   DemoTree — Arbre exemple statique de Mamadou Ndiaye
────────────────────────────────────────────────────────── */

const GREEN = 'var(--green)';
const ROSE  = '#7A3A56';
const LINE  = 'rgba(163,201,126,0.6)';

// Largeur fixe de chaque colonne (paternal / maternal) pour un alignement parfait
const COL_W = 220;
const GAP   = 28; // espace entre les deux colonnes

type P = {
  ini: string;
  prenom: string;
  nom: string;
  genre: 'M' | 'F';
  lenyol?: string;
  deceased?: boolean;
  role?: string;
};

/* ── Données ── */
const GP_PP: P = { ini: 'KD', prenom: 'Khady',      nom: 'DIALLO',     lenyol: 'Ndiaye',   deceased: true, genre: 'F', role: 'G-Mère' };
const GP_MP: P = { ini: 'CD', prenom: 'Cheikh',      nom: 'DIALLO',                         deceased: true, genre: 'M', role: 'G-Père' };
const GP_PM: P = { ini: 'AN', prenom: 'Astou',       nom: 'NDIAYE',     lenyol: 'Sow',      deceased: true, genre: 'F', role: 'G-Mère' };
const GP_MM: P = { ini: 'IN', prenom: 'Ibrahima',    nom: 'NDIAYE',                         deceased: true, genre: 'M', role: 'G-Père' };
const PERE: P  = { ini: 'AD', prenom: 'Abdoulaye',   nom: 'DIALLO',     lenyol: 'Ndiaye',   deceased: true, genre: 'M', role: 'Père' };
const MERE: P  = { ini: 'FN', prenom: 'Fatou',       nom: 'NDIAYE',     lenyol: 'Sow',      deceased: false, genre: 'F', role: 'Mère' };

/* ── Carte grand-parent (petite) ── */
function GpCard({ p }: { p: P }) {
  return (
    <div className="parent-card" style={{ pointerEvents: 'none', minWidth: 90 }}>
      <div className="parent-photo" style={{ background: p.genre === 'M' ? GREEN : ROSE, width: 32, height: 32, fontSize: 11 }}>
        {p.ini}
      </div>
      <div className="parent-role">{p.role}</div>
      <div className="parent-prenom" style={{ fontSize: 11 }}>{p.prenom}</div>
      <div className="parent-nom" style={{ fontSize: 10 }}>{p.nom}</div>
      {p.lenyol && (
        <div style={{ fontSize: 9, color: 'var(--gold)', marginTop: 3 }}>⬡ {p.lenyol}</div>
      )}
      <div style={{ fontSize: 9, marginTop: 3, color: p.deceased ? 'var(--t3)' : '#2D7A54' }}>
        {p.deceased ? '🕊️ Décédé·e' : '🟢 En vie'}
      </div>
    </div>
  );
}

/* ── Carte parent (moyenne) ── */
function ParentCard({ p }: { p: P }) {
  return (
    <div className="parent-card" style={{ pointerEvents: 'none' }}>
      <div className="parent-photo" style={{ background: p.genre === 'M' ? GREEN : ROSE }}>
        {p.ini}
      </div>
      <div className="parent-role">{p.role}</div>
      <div className="parent-prenom">{p.prenom}</div>
      <div className="parent-nom">{p.nom}</div>
      {p.lenyol && (
        <div style={{ fontSize: 9, color: 'var(--gold)', marginTop: 3 }}>⬡ {p.lenyol}</div>
      )}
      <div style={{ fontSize: 9, marginTop: 3, color: p.deceased ? 'var(--t3)' : '#2D7A54' }}>
        {p.deceased ? '🕊️ Décédé·e' : '🟢 En vie'}
      </div>
    </div>
  );
}

export default function DemoTree() {
  return (
    <section style={{ padding: '64px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
            borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 600,
            color: 'var(--green)', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Exemple d'arbre
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 600, color: 'var(--t1)', marginBottom: 10,
          }}>
            La famille <em>Ndiaye</em>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', maxWidth: 420, margin: '0 auto' }}>
            Chaque arbre préserve trois générations : grands-parents, parents et enfants, avec la lignée et le foyer familial.
          </p>
        </div>

        {/* ── Arbre ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Ligne 1 — Grands-parents */}
          <div style={{ display: 'flex', gap: GAP }}>
            <div style={{ width: COL_W, display: 'flex', justifyContent: 'center', gap: 6 }}>
              <GpCard p={GP_PP} />
              <GpCard p={GP_MP} />
            </div>
            <div style={{ width: COL_W, display: 'flex', justifyContent: 'center', gap: 6 }}>
              <GpCard p={GP_PM} />
              <GpCard p={GP_MM} />
            </div>
          </div>

          {/* Ligne 2 — Y-curves GP → Parents */}
          <div style={{ display: 'flex', gap: GAP }}>
            <svg width={COL_W} height="28" viewBox={`0 0 ${COL_W} 28`} style={{ display: 'block' }}>
              <path d={`M ${COL_W * 0.25} 0 C ${COL_W * 0.25} 14, ${COL_W * 0.5} 14, ${COL_W * 0.5} 28`} stroke={LINE} strokeWidth="1.5" fill="none" />
              <path d={`M ${COL_W * 0.75} 0 C ${COL_W * 0.75} 14, ${COL_W * 0.5} 14, ${COL_W * 0.5} 28`} stroke={LINE} strokeWidth="1.5" fill="none" />
            </svg>
            <svg width={COL_W} height="28" viewBox={`0 0 ${COL_W} 28`} style={{ display: 'block' }}>
              <path d={`M ${COL_W * 0.25} 0 C ${COL_W * 0.25} 14, ${COL_W * 0.5} 14, ${COL_W * 0.5} 28`} stroke={LINE} strokeWidth="1.5" fill="none" />
              <path d={`M ${COL_W * 0.75} 0 C ${COL_W * 0.75} 14, ${COL_W * 0.5} 14, ${COL_W * 0.5} 28`} stroke={LINE} strokeWidth="1.5" fill="none" />
            </svg>
          </div>

          {/* Ligne 3 — Parents */}
          <div style={{ display: 'flex', gap: GAP }}>
            <div style={{ width: COL_W, display: 'flex', justifyContent: 'center' }}>
              <ParentCard p={PERE} />
            </div>
            <div style={{ width: COL_W, display: 'flex', justifyContent: 'center' }}>
              <ParentCard p={MERE} />
            </div>
          </div>

          {/* Courbe parents → focal */}
          <svg width={COL_W * 2 + GAP} height="36" viewBox={`0 0 ${COL_W * 2 + GAP} 36`} style={{ display: 'block' }}>
            <path
              d={`M ${COL_W / 2} 0 C ${COL_W / 2} 18, ${COL_W + GAP / 2} 18, ${COL_W + GAP / 2} 36`}
              stroke={LINE} strokeWidth="1.5" fill="none"
            />
            <path
              d={`M ${COL_W + GAP + COL_W / 2} 0 C ${COL_W + GAP + COL_W / 2} 18, ${COL_W + GAP / 2} 18, ${COL_W + GAP / 2} 36`}
              stroke={LINE} strokeWidth="1.5" fill="none"
            />
          </svg>

          {/* Personne focale — Mamadou */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(163,201,126,0.9)', marginBottom: 2 }} />
            <div className="focus-card M-focus" style={{ minWidth: 160, pointerEvents: 'none' }}>
              <div className="focus-photo" style={{ background: GREEN }}>MN</div>
              <div className="focus-prenom">Mamadou</div>
              <div className="focus-nom">NDIAYE</div>
              <div className="focus-tags" style={{ marginTop: 8 }}>
                <span className="f-tag dead">🕊️ Décédé·e</span>
              </div>
              <div className="focus-tags">
                <span className="f-tag hinya">⬡ Lenyol Sow</span>
              </div>
              <div className="focus-tags">
                <span className="f-tag loc">📍 Dakar</span>
              </div>
            </div>
          </div>

        </div>

        {/* Légende */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { color: GREEN,  label: 'Homme' },
            { color: ROSE,   label: 'Femme' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t2)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
