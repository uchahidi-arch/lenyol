'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeroProps {
  onNavigateToApp: () => void;
  onOpenAuth?: (tab: 'login' | 'signup') => void;
}

const ACCENT = '#3B5C3F'; /* vert sénégalais */
const CHIPS = ['Ndiaye', 'Diop', 'Dakar', 'Fall', 'Saint-Louis', 'Thiès'];

export default function Hero({ onNavigateToApp }: HeroProps) {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [lieu, setLieu] = useState('');
  const [type, setType] = useState('Famille');

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const q = nom.trim() || lieu.trim();
    if (q) {
      router.push(`/registre?q=${encodeURIComponent(q)}&lieu=${encodeURIComponent(lieu)}&cat=${type}`);
    } else {
      onNavigateToApp();
    }
  };

  return (
    <section
      id="hero"
      style={{ backgroundColor: '#fff', padding: '80px 24px 72px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >

      {/* Eyebrow */}
      <p style={{
        color: ACCENT,
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        Lenyol
      </p>

      {/* Headline */}
      <h1 style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 400,
        fontSize: 'clamp(28px, 5vw, 48px)',
        color: '#000',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: '640px',
        marginBottom: '16px',
      }}>
        Chaque nom a une histoire. La vôtre commence ici.
      </h1>

      {/* Subtext */}
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '420px',
        lineHeight: 1.6,
        marginBottom: '40px',
      }}>
        Explorez le registre des familles sénégalaises et découvrez les liens entre les lignées.
      </p>

      {/* Search block */}
      <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '720px' }}>

        {/* Fields row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #d1d5db' }}>

          {/* Champ nom */}
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #d1d5db' }}>
            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', padding: '10px 14px 4px' }}>
              Nom de famille / Lignée
            </label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="ex. Diallo, Ndiaye…"
              autoComplete="off"
              style={{ background: '#fff', border: 'none', outline: 'none', color: '#000', fontSize: '14px', padding: '0 14px 10px', width: '100%' }}
              className="placeholder-gray-400"
            />
          </div>

          {/* Champ lieu */}
          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #d1d5db' }}>
            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', padding: '10px 14px 4px' }}>
              Ville ou région
            </label>
            <input
              type="text"
              value={lieu}
              onChange={e => setLieu(e.target.value)}
              placeholder="ex. Thiès, Casamance…"
              autoComplete="off"
              style={{ background: '#fff', border: 'none', outline: 'none', color: '#000', fontSize: '14px', padding: '0 14px 10px', width: '100%' }}
              className="placeholder-gray-400"
            />
          </div>

          {/* Select type */}
          <div style={{ flex: '0 1 130px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <label style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', padding: '10px 14px 4px' }}>
              Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ background: '#fff', border: 'none', outline: 'none', color: '#000', fontSize: '14px', padding: '0 30px 10px 14px', appearance: 'none', cursor: 'pointer', width: '100%' }}
            >
              {['Famille', 'Personne', 'Localité', 'Lignée'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: '12px', bottom: '14px', pointerEvents: 'none', color: '#9ca3af' }} width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>

        </div>

        {/* Search button */}
        <button
          type="submit"
          style={{
            width: '100%',
            backgroundColor: ACCENT,
            color: '#fff',
            border: 'none',
            padding: '13px',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            borderRadius: '0 0 4px 4px',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Trouver une famille
        </button>

        {/* Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0 20px', marginTop: '20px', justifyContent: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '12px', letterSpacing: '0.08em' }}>Fréquents —</span>
          {CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setNom(chip)}
              style={{ background: 'none', border: 'none', borderBottom: '1px solid transparent', color: ACCENT, fontSize: '14px', cursor: 'pointer', padding: '2px 0', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderBottomColor = ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
            >
              {chip}
            </button>
          ))}
        </div>

      </form>
    </section>
  );
}
