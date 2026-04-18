'use client';

import type { Person } from '@/lib/types';

interface PersonCardProps {
  person: Person;
  onClick: (p: Person) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

function initials(p: Person) {
  return ((p.prenom?.[0] || '?') + (p.nom?.[0] || '?')).toUpperCase();
}

export default function PersonCard({ person, onClick, bulkMode, selected, onSelect }: PersonCardProps) {
  const p = person;

  return (
    <div
      className={`person-card${p.deceased ? ' deceased' : ''}${bulkMode ? ' bulk-select' : ''}`}
      onClick={() => bulkMode ? onSelect?.(p.id) : onClick(p)}
    >
      {/* Bulk checkbox */}
      {bulkMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect?.(p.id)}
          style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px' }}
          onClick={e => e.stopPropagation()}
        />
      )}

      {/* Localisation — en haut de la carte */}
      {(p.region || p.localite) && (
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          marginBottom: '10px',
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--t3)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}>
          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {[p.region, p.localite].filter(Boolean).join(' · ')}
        </div>
      )}

      {/* Avatar */}
      <div className={`pc-av ${p.genre || 'M'}`}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(p)
        }
      </div>

      {/* Nom */}
      <div className="pc-prenom">{p.prenom}</div>
      {p.nom && <div className="pc-nom">{p.nom}</div>}

      {/* Dates */}
      {(p.naiss_date || p.deces_date) && (
        <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '3px' }}>
          {p.naiss_date ? p.naiss_date.slice(0, 4) : '?'}
          {p.deces_date ? ` — ${p.deces_date.slice(0, 4)}` : ''}
        </div>
      )}

      {/* Tags généalogiques */}
      <div className="pc-tags" style={{ marginTop: '10px' }}>

        {/* Lenyol (branche du nom de famille) */}
        {p.clan && (
          <span className="pc-tag hinya">
            ⬡ {[p.prefix_lignee, p.clan].filter(Boolean).join(' ')}
          </span>
        )}

        {/* Galle (foyer) */}
        {p.galle && (
          <span className="pc-tag" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
            🏠 {p.galle}
          </span>
        )}

        {/* Ethnie */}
        {p.ethnie && (
          <span className="pc-tag" style={{ background: '#EDE9FE', color: '#5B21B6', border: '1px solid #DDD6FE' }}>
            {p.ethnie}
          </span>
        )}

        {/* Royaume */}
        {p.royaume && (
          <span className="pc-tag" style={{ background: '#FEF9C3', color: '#713F12', border: '1px solid #FEF08A' }}>
            ♔ {p.royaume}
          </span>
        )}

        {/* Confrérie */}
        {p.confrérie && (
          <span className="pc-tag" style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
            ☽ {p.confrérie}
          </span>
        )}

        {/* Caste */}
        {p.caste && (
          <span className="pc-tag" style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
            {p.caste}
          </span>
        )}

        {/* Statut vital */}
        {p.deceased
          ? <span className="pc-tag status-dead">🕊️ Décédé·e</span>
          : <span className="pc-tag status-alive">🟢 En vie</span>
        }

        {/* Masqué */}
        {p.masque && (
          <span className="pc-tag" style={{ background: 'var(--warm2)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
            🔒 Masqué
          </span>
        )}
      </div>
    </div>
  );
}
