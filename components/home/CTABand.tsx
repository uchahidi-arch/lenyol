'use client';

import { useAuth } from '@/hooks/useAuth';

interface CTABandProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
  onNavigateToApp: () => void;
}

const PARTICLES = [
  { top: '8%',  left: '6%',  size: 3, color: 'rgba(255,255,255,0.10)', dur: '28s', delay: '0s'   },
  { top: '18%', left: '18%', size: 2, color: 'rgba(100,200,120,0.07)', dur: '36s', delay: '4s'   },
  { top: '72%', left: '9%',  size: 4, color: 'rgba(255,255,255,0.10)', dur: '22s', delay: '7s'   },
  { top: '88%', left: '25%', size: 2, color: 'rgba(100,200,120,0.07)', dur: '38s', delay: '2s'   },
  { top: '5%',  left: '40%', size: 3, color: 'rgba(255,255,255,0.10)', dur: '30s', delay: '11s'  },
  { top: '50%', left: '14%', size: 5, color: 'rgba(100,200,120,0.07)', dur: '24s', delay: '5s'   },
  { top: '35%', left: '55%', size: 2, color: 'rgba(255,255,255,0.10)', dur: '40s', delay: '9s'   },
  { top: '92%', left: '62%', size: 3, color: 'rgba(100,200,120,0.07)', dur: '26s', delay: '14s'  },
  { top: '15%', left: '74%', size: 4, color: 'rgba(255,255,255,0.10)', dur: '34s', delay: '3s'   },
  { top: '60%', left: '80%', size: 2, color: 'rgba(100,200,120,0.07)', dur: '20s', delay: '8s'   },
  { top: '78%', left: '90%', size: 5, color: 'rgba(255,255,255,0.10)', dur: '32s', delay: '1s'   },
  { top: '42%', left: '93%', size: 3, color: 'rgba(100,200,120,0.07)', dur: '37s', delay: '12s'  },
  { top: '25%', left: '33%', size: 2, color: 'rgba(255,255,255,0.10)', dur: '29s', delay: '6s'   },
  { top: '55%', left: '47%', size: 4, color: 'rgba(100,200,120,0.07)', dur: '23s', delay: '16s'  },
  { top: '82%', left: '70%', size: 2, color: 'rgba(255,255,255,0.10)', dur: '39s', delay: '10s'  },
  { top: '10%', left: '86%', size: 3, color: 'rgba(100,200,120,0.07)', dur: '25s', delay: '13s'  },
  { top: '65%', left: '30%', size: 5, color: 'rgba(255,255,255,0.10)', dur: '33s', delay: '0s'   },
  { top: '95%', left: '50%', size: 2, color: 'rgba(100,200,120,0.07)', dur: '21s', delay: '15s'  },
];

export default function CTABand({ onOpenAuth, onNavigateToApp }: CTABandProps) {
  const { user } = useAuth();

  // Masquer si l'utilisateur est connecté
  if (user) return null;

  return (
    <section className="cta-band" id="cta-band">
      {/* Particules flottantes */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            pointerEvents: 'none',
            zIndex: 0,
            animation: `particleFloat ${p.dur} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="cta-title">
          Commencez à tisser<br /><em>votre mémoire</em> aujourd&apos;hui
        </h2>
        <p className="cta-sub">
          Gratuit, sans publicité, sans revente de données.<br />
          Votre famille mérite mieux.
        </p>
        <div className="cta-btns">
          <button className="btn-hero btn-hero-p" onClick={() => onOpenAuth('signup')}>
            🌿 Créer mon arbre gratuit
          </button>
          <button className="btn-hero btn-hero-s" onClick={onNavigateToApp}>
            Explorer le registre
          </button>
        </div>
      </div>
    </section>
  );
}
