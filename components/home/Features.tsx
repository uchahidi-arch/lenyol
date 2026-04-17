'use client';

import { useRef, useState, useEffect } from 'react';

const FEATURES = [
  {
    tier: 'Gratuit',
    tierColor: '#475569',
    title: 'Recherche dans le registre',
    desc: 'Cherchez n\'importe quelle famille, personne ou localité. Les résultats sont affichés en listes plates, accessibles sans compte.',
    bg: '#0C1A2E',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="28" width="200" height="44" rx="10" fill="white" opacity=".06" stroke="white" strokeWidth="1" strokeOpacity=".12"/>
        <circle cx="65" cy="50" r="9" stroke="#4A7A52" strokeWidth="2" opacity=".7"/>
        <line x1="72" y1="57" x2="78" y2="63" stroke="#4A7A52" strokeWidth="2.5" strokeLinecap="round" opacity=".7"/>
        <rect x="88" y="44" width="90" height="12" rx="3" fill="white" opacity=".12"/>
        <rect x="40" y="88" width="200" height="20" rx="6" fill="white" opacity=".05" stroke="white" strokeOpacity=".07" strokeWidth="1"/>
        <rect x="52" y="94" width="60" height="8" rx="2" fill="#4A7A52" opacity=".4"/>
        <rect x="124" y="96" width="40" height="5" rx="2" fill="white" opacity=".2"/>
        <rect x="40" y="116" width="200" height="20" rx="6" fill="white" opacity=".05" stroke="white" strokeOpacity=".07" strokeWidth="1"/>
        <rect x="52" y="122" width="80" height="8" rx="2" fill="#4A7A52" opacity=".3"/>
        <rect x="144" y="124" width="30" height="5" rx="2" fill="white" opacity=".15"/>
        <rect x="40" y="144" width="200" height="20" rx="6" fill="white" opacity=".05" stroke="white" strokeOpacity=".07" strokeWidth="1"/>
        <rect x="52" y="150" width="50" height="8" rx="2" fill="#4A7A52" opacity=".25"/>
      </svg>
    ),
  },
  {
    tier: 'Essentiel',
    tierColor: '#3B5C3F',
    title: 'Arbre visuel interactif',
    desc: 'Visualisez toute votre famille en arbre navigable. Remontez aux ancêtres, descendez aux enfants, d\'un clic.',
    bg: '#0D2218',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="112" y="130" width="56" height="30" rx="5" fill="#059669" opacity=".2" stroke="#10B981" strokeWidth="1" strokeOpacity=".4"/>
        <rect x="116" y="134" width="48" height="22" rx="4" fill="#059669" opacity=".3"/>
        <text x="140" y="148" textAnchor="middle" fill="#6EE7B7" fontSize="9" fontWeight="700" opacity=".9">Vous</text>
        <line x1="140" y1="130" x2="90" y2="100" stroke="#10B981" strokeWidth="1.5" strokeOpacity=".4"/>
        <line x1="140" y1="130" x2="190" y2="100" stroke="#10B981" strokeWidth="1.5" strokeOpacity=".4"/>
        <rect x="62" y="78" width="56" height="28" rx="5" fill="#065F46" opacity=".4" stroke="#10B981" strokeWidth="1" strokeOpacity=".3"/>
        <text x="90" y="95" textAnchor="middle" fill="#6EE7B7" fontSize="8" opacity=".7">Père</text>
        <rect x="162" y="78" width="56" height="28" rx="5" fill="#065F46" opacity=".4" stroke="#10B981" strokeWidth="1" strokeOpacity=".3"/>
        <text x="190" y="95" textAnchor="middle" fill="#6EE7B7" fontSize="8" opacity=".7">Mère</text>
        <line x1="90" y1="78" x2="60" y2="50" stroke="#10B981" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="90" y1="78" x2="112" y2="50" stroke="#10B981" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="190" y1="78" x2="168" y2="50" stroke="#10B981" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="190" y1="78" x2="214" y2="50" stroke="#10B981" strokeWidth="1" strokeOpacity=".25"/>
        <rect x="36" y="32" width="48" height="24" rx="4" fill="#064E3B" opacity=".5" stroke="#10B981" strokeWidth="1" strokeOpacity=".2"/>
        <rect x="88" y="32" width="48" height="24" rx="4" fill="#064E3B" opacity=".5" stroke="#10B981" strokeWidth="1" strokeOpacity=".2"/>
        <rect x="144" y="32" width="48" height="24" rx="4" fill="#064E3B" opacity=".5" stroke="#10B981" strokeWidth="1" strokeOpacity=".2"/>
        <rect x="196" y="32" width="48" height="24" rx="4" fill="#064E3B" opacity=".5" stroke="#10B981" strokeWidth="1" strokeOpacity=".2"/>
      </svg>
    ),
  },
  {
    tier: 'Essentiel',
    tierColor: '#3B5C3F',
    title: 'Ethnie, caste & royaume',
    desc: 'Accédez aux données complètes de lignée : ethnie, caste, royaume d\'origine. Les bases du profil ancestral.',
    bg: '#1C1004',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="24" width="200" height="132" rx="12" fill="white" opacity=".03" stroke="#F59E0B" strokeWidth="1" strokeOpacity=".15"/>
        <rect x="40" y="24" width="200" height="32" rx="12" fill="#F59E0B" opacity=".12"/>
        <text x="140" y="44" textAnchor="middle" fill="#FCD34D" fontSize="11" fontWeight="700" opacity=".8">Profil ancestral</text>
        <rect x="56" y="68" width="52" height="10" rx="3" fill="#F59E0B" opacity=".2"/>
        <text x="56" y="63" fill="#FCD34D" fontSize="8" fontWeight="700" opacity=".5">ETHNIE</text>
        <rect x="116" y="68" width="108" height="10" rx="3" fill="white" opacity=".1"/>
        <text x="116" y="63" fill="#FCD34D" fontSize="8" fontWeight="700" opacity=".5">VALEUR</text>
        <rect x="116" y="68" width="70" height="10" rx="3" fill="#F59E0B" opacity=".25"/>
        <rect x="56" y="90" width="52" height="10" rx="3" fill="#F59E0B" opacity=".2"/>
        <text x="56" y="85" fill="#FCD34D" fontSize="8" fontWeight="700" opacity=".5">CASTE</text>
        <rect x="116" y="90" width="55" height="10" rx="3" fill="white" opacity=".07"/>
        <rect x="172" y="90" width="10" height="10" rx="3" fill="#F59E0B" opacity=".4"/>
        <rect x="185" y="90" width="10" height="10" rx="3" fill="#F59E0B" opacity=".15"/>
        <text x="172" y="85" fill="#F59E0B" fontSize="7" opacity=".4">ESSENTIEL</text>
        <rect x="56" y="112" width="52" height="10" rx="3" fill="#F59E0B" opacity=".2"/>
        <text x="56" y="107" fill="#FCD34D" fontSize="8" fontWeight="700" opacity=".5">ROYAUME</text>
        <rect x="116" y="112" width="80" height="10" rx="3" fill="#F59E0B" opacity=".25"/>
        <rect x="56" y="134" width="52" height="10" rx="3" fill="#F59E0B" opacity=".2"/>
        <text x="56" y="129" fill="#FCD34D" fontSize="8" fontWeight="700" opacity=".5">ORIGINE</text>
        <rect x="116" y="134" width="60" height="10" rx="3" fill="#F59E0B" opacity=".2"/>
      </svg>
    ),
  },
  {
    tier: 'Essentiel',
    tierColor: '#3B5C3F',
    title: 'Export PDF',
    desc: 'Exportez l\'arbre d\'ascendance en PDF A3, prêt à imprimer et à offrir. Mise en page soignée.',
    bg: '#0E0E1A',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="74" y="14" width="108" height="140" rx="8" fill="#0D2E1A" opacity=".3" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".25"/>
        <rect x="74" y="14" width="108" height="20" rx="8" fill="#1A4D2E" opacity=".4"/>
        <rect x="74" y="26" width="108" height="8" fill="#1A4D2E" opacity=".2"/>
        <text x="128" y="28" textAnchor="middle" fill="#A8D4B0" fontSize="8" fontWeight="700" opacity=".7">PDF A3</text>
        <circle cx="120" cy="80" r="9" fill="#2D6B3A" opacity=".4" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".4"/>
        <circle cx="140" cy="64" r="7" fill="#2D6B3A" opacity=".35" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".3"/>
        <circle cx="158" cy="80" r="7" fill="#2D6B3A" opacity=".35" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".3"/>
        <line x1="120" y1="80" x2="140" y2="64" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".3"/>
        <line x1="120" y1="80" x2="107" y2="96" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".25"/>
        <line x1="158" y1="80" x2="172" y2="96" stroke="#6BAE7A" strokeWidth="1" strokeOpacity=".25"/>
        <rect x="90" y="112" width="76" height="5" rx="2" fill="#6BAE7A" opacity=".2"/>
        <rect x="98" y="121" width="60" height="5" rx="2" fill="#6BAE7A" opacity=".15"/>
        <rect x="204" y="136" width="32" height="32" rx="16" fill="#0A1F10" stroke="#6BAE7A" strokeWidth="1.5" strokeOpacity=".5"/>
        <path d="M220 141 L220 158 M214 153 L220 159 L226 153" stroke="#6BAE7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".8"/>
      </svg>
    ),
  },
  {
    tier: 'Héro',
    tierColor: '#7C3AED',
    title: 'Connexion entre familles',
    desc: 'Reliez votre arbre à celui d\'une autre famille. Les deux parties valident la connexion avant qu\'elle soit établie.',
    bg: '#110D1F',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="60" width="80" height="60" rx="10" fill="#7C3AED" opacity=".15" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".3"/>
        <circle cx="45" cy="82" r="8" fill="#7C3AED" opacity=".5" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".5"/>
        <circle cx="65" cy="82" r="8" fill="#7C3AED" opacity=".5" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".5"/>
        <circle cx="55" cy="100" r="6" fill="#7C3AED" opacity=".35" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".3"/>
        <text x="60" y="132" textAnchor="middle" fill="#A78BFA" fontSize="9" fontWeight="600" opacity=".6">Famille A</text>
        <rect x="180" y="60" width="80" height="60" rx="10" fill="#7C3AED" opacity=".15" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".3"/>
        <circle cx="205" cy="82" r="8" fill="#7C3AED" opacity=".5" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".5"/>
        <circle cx="225" cy="82" r="8" fill="#7C3AED" opacity=".5" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".5"/>
        <circle cx="215" cy="100" r="6" fill="#7C3AED" opacity=".35" stroke="#A78BFA" strokeWidth="1" strokeOpacity=".3"/>
        <text x="220" y="132" textAnchor="middle" fill="#A78BFA" fontSize="9" fontWeight="600" opacity=".6">Famille B</text>
        <path d="M102 90 C130 90 150 90 178 90" stroke="#A78BFA" strokeWidth="2" strokeDasharray="5 4" opacity=".5"/>
        <circle cx="140" cy="90" r="14" fill="#1E0A3C" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity=".7"/>
        <text x="140" y="95" textAnchor="middle" fill="#A78BFA" fontSize="13" fontWeight="800" opacity=".9">✓</text>
        <text x="140" y="116" textAnchor="middle" fill="#A78BFA" fontSize="8" opacity=".4">validé</text>
      </svg>
    ),
  },
  {
    tier: 'Héro',
    tierColor: '#7C3AED',
    title: 'Carte des migrations',
    desc: 'Visualisez les déplacements de votre famille à travers le Sénégal et l\'Afrique de l\'Ouest sur une carte interactive.',
    bg: '#071520',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="240" height="140" rx="10" fill="#0D3320" opacity=".15" stroke="#3B5C3F" strokeWidth="1" strokeOpacity=".2"/>
        <path d="M60 100 C80 60 120 40 160 55 C190 65 210 80 230 70" stroke="#3B5C3F" strokeWidth="2" strokeDasharray="4 3" opacity=".5"/>
        <circle cx="60" cy="100" r="7" fill="#2D6B3A" opacity=".6" stroke="#3B5C3F" strokeWidth="1.5" strokeOpacity=".8"/>
        <circle cx="160" cy="55" r="6" fill="#2D6B3A" opacity=".5" stroke="#3B5C3F" strokeWidth="1.5" strokeOpacity=".6"/>
        <circle cx="230" cy="70" r="5" fill="#2D6B3A" opacity=".4" stroke="#3B5C3F" strokeWidth="1.5" strokeOpacity=".5"/>
        <text x="60" y="116" textAnchor="middle" fill="#A8D4B0" fontSize="7" opacity=".6">Dakar</text>
        <text x="160" y="46" textAnchor="middle" fill="#A8D4B0" fontSize="7" opacity=".6">Thiès</text>
        <text x="230" y="61" textAnchor="middle" fill="#A8D4B0" fontSize="7" opacity=".5">Saint-Louis</text>
        <circle cx="60" cy="100" r="14" fill="#3B5C3F" opacity=".07"/>
        <circle cx="160" cy="55" r="11" fill="#3B5C3F" opacity=".06"/>
        <path d="M155 55 L162 50 L164 57 Z" fill="#3B5C3F" opacity=".6"/>
        <rect x="36" y="128" width="60" height="16" rx="5" fill="#0D3320" opacity=".5" stroke="#3B5C3F" strokeWidth="1" strokeOpacity=".3"/>
        <text x="66" y="139" textAnchor="middle" fill="#A8D4B0" fontSize="8" fontWeight="600" opacity=".7">3 générations</text>
      </svg>
    ),
  },
  {
    tier: 'Premium',
    tierColor: '#B45309',
    title: 'Griot Numérique & Audio',
    desc: 'Un griot personnalisé raconte l\'histoire de votre famille. Archives audio de griots réels, chroniques transmises à vos enfants.',
    bg: '#1A0E00',
    illustration: (
      <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="80" r="48" fill="#92400E" opacity=".12" stroke="#F59E0B" strokeWidth="1" strokeOpacity=".2"/>
        <circle cx="140" cy="80" r="32" fill="#92400E" opacity=".18" stroke="#F59E0B" strokeWidth="1" strokeOpacity=".3"/>
        <circle cx="140" cy="80" r="18" fill="#B45309" opacity=".4" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity=".6"/>
        <rect x="133" y="65" width="14" height="20" rx="4" fill="#FCD34D" opacity=".7"/>
        <path d="M127 83 C127 91 153 91 153 83" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity=".7" fill="none"/>
        <line x1="140" y1="91" x2="140" y2="97" stroke="#FCD34D" strokeWidth="2" opacity=".6"/>
        <line x1="133" y1="97" x2="147" y2="97" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
        <rect x="40" y="136" width="200" height="24" rx="12" fill="#92400E" opacity=".15" stroke="#F59E0B" strokeWidth="1" strokeOpacity=".2"/>
        <rect x="44" y="140" width="60" height="16" rx="10" fill="#F59E0B" opacity=".3"/>
        <rect x="108" y="144" width="108" height="8" rx="4" fill="#F59E0B" opacity=".15"/>
        <path d="M56 120 Q70 105 84 115 Q98 125 112 108 Q126 91 140 104 Q154 117 168 100 Q182 83 196 95" stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity=".35"/>
      </svg>
    ),
  },
];

export default function Features() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateButtons = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.scrollLeft = 0;
    el.addEventListener('scroll', updateButtons, { passive: true });
    updateButtons();
    return () => el.removeEventListener('scroll', updateButtons);
  }, []);

  const scroll = (dir: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'next' ? 620 : -620, behavior: 'smooth' });
  };

  return (
    <section className="lnf-section" id="fonctionnalites">
      <div className="lnf-header">
        <span className="lnf-eyebrow">Fonctionnalités</span>
        <h2 className="lnf-title">Tout ce dont votre famille a besoin</h2>
        <p className="lnf-sub">De la recherche gratuite au Griot personnalisé — choisissez votre niveau.</p>
      </div>

      <div className="lnf-track-wrap">

        {/* Bouton gauche */}
        <button
          className="lnf-nav-btn lnf-nav-prev"
          onClick={() => scroll('prev')}
          aria-label="Précédent"
          style={{ opacity: canPrev ? 1 : 0, pointerEvents: canPrev ? 'auto' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Bouton droite */}
        <button
          className="lnf-nav-btn lnf-nav-next"
          onClick={() => scroll('next')}
          aria-label="Suivant"
          style={{ opacity: canNext ? 1 : 0, pointerEvents: canNext ? 'auto' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div className="lnf-track" ref={trackRef}>
          {FEATURES.map(f => (
            <div key={f.title} className="lnf-card" style={{ '--card-bg': f.bg } as React.CSSProperties}>
              <div className="lnf-card-img" style={{ background: f.bg }}>
                {f.illustration}
              </div>
              <div className="lnf-card-body">
                <div className="lnf-card-title">{f.title}</div>
                <p className="lnf-card-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fondu droit pour signaler le scroll */}
        <div className="lnf-fade-right" />
      </div>
    </section>
  );
}
