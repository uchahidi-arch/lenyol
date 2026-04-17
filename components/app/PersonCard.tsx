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

function ligneeStr(p: Person): string {
  return [[p.prefix_lignee, p.clan].filter(Boolean).join(' '), p.daho]
    .filter(Boolean).join(' · ');
}

export default function PersonCard({ person, onClick, bulkMode, selected, onSelect }: PersonCardProps) {
  const p = person;
  const ini = initials(p);
  const lig = ligneeStr(p);

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
          style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', width: '16px', height: '16px',
          }}
          onClick={e => e.stopPropagation()}
        />
      )}

      {/* Avatar */}
      <div className={`pc-av ${p.genre || 'M'}`}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : ini
        }
      </div>

      {/* Name */}
      <div className="pc-prenom">{p.prenom}</div>
      {p.nom && <div className="pc-nom">{p.nom}</div>}

      {/* Tags */}
      <div className="pc-tags">
        {lig && (
          <span className="pc-tag hinya">⬡ {lig}</span>
        )}
        {p.deceased
          ? <span className="pc-tag status-dead">🕊️ Décédé·e</span>
          : <span className="pc-tag status-alive">🟢 En vie</span>
        }
        {p.masque && (
          <span className="pc-tag" style={{ background: 'var(--warm2)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
            🔒 Masqué
          </span>
        )}
      </div>
    </div>
  );
}
