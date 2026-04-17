'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HomeFooter from '@/components/home/HomeFooter';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import { useAuth } from '@/hooks/useAuth';

interface Article {
  id: string;
  titre: string;
  slug: string;
  resume: string | null;
  image_url: string | null;
  categorie: string;
  auteur: string;
  created_at: string;
}

const CATEGORIE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  culture:    { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-bd)' },
  histoire:   { color: 'var(--gold)',  bg: 'var(--gold-bg)',  border: 'var(--gold-bd)'  },
  genealogie: { color: '#7c5cbf',      bg: 'rgba(124,92,191,0.1)', border: 'rgba(124,92,191,0.3)' },
  lenyol:     { color: 'var(--rose)',  bg: 'var(--rose-bg)',  border: 'var(--rose-li)'  },
};

function getCatStyle(cat: string) {
  return CATEGORIE_COLORS[cat?.toLowerCase()] ?? CATEGORIE_COLORS.culture;
}

const HERO_PARTICLES = [
  { top: '74%', left: '5%',  size: 2, color: 'rgba(255,255,255,0.18)', dur: '22s', delay: '0s'  },
  { top: '83%', left: '16%', size: 3, color: 'rgba(76,175,128,0.14)',  dur: '30s', delay: '4s'  },
  { top: '71%', left: '29%', size: 2, color: 'rgba(255,255,255,0.12)', dur: '26s', delay: '8s'  },
  { top: '89%', left: '42%', size: 2, color: 'rgba(76,175,128,0.14)',  dur: '33s', delay: '2s'  },
  { top: '77%', left: '55%', size: 3, color: 'rgba(255,255,255,0.18)', dur: '24s', delay: '11s' },
  { top: '91%', left: '67%', size: 2, color: 'rgba(76,175,128,0.14)',  dur: '28s', delay: '6s'  },
  { top: '79%', left: '80%', size: 3, color: 'rgba(255,255,255,0.12)', dur: '36s', delay: '1s'  },
  { top: '73%', left: '92%', size: 2, color: 'rgba(76,175,128,0.14)',  dur: '20s', delay: '9s'  },
];

export default function ChroniquesPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'redacteur' || profile?.role === 'admin';

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('articles')
        .select('id, titre, slug, resume, image_url, categorie, auteur, created_at')
        .eq('publie', true)
        .order('created_at', { ascending: false });
      setArticles((data ?? []) as Article[]);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <AboutNavWrapper />

      <main style={{ paddingTop: '64px' }}>

        {/* ── HERO ── */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 48px',
          background: 'var(--hero)',
          backgroundImage:
            'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(45,122,84,.22) 0%, transparent 65%),' +
            'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(122,83,14,.10) 0%, transparent 50%),' +
            'repeating-linear-gradient(0deg, rgba(255,255,255,.008) 0, rgba(255,255,255,.008) 1px, transparent 0, transparent 52px),' +
            'repeating-linear-gradient(90deg, rgba(255,255,255,.008) 0, rgba(255,255,255,.008) 1px, transparent 0, transparent 52px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Orb vert — haut gauche */}
          <div style={{
            position: 'absolute', top: '-60px', left: '-80px',
            width: '380px', height: '380px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,122,84,.30) 0%, rgba(45,122,84,.08) 45%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'orbDrift 28s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Orb or — bas droite */}
          <div style={{
            position: 'absolute', bottom: '-40px', right: '-60px',
            width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(122,83,14,.22) 0%, rgba(122,83,14,.06) 45%, transparent 70%)',
            filter: 'blur(55px)',
            animation: 'orbDrift2 34s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Orb vert pâle — centre haut */}
          <div style={{
            position: 'absolute', top: '-30px', left: '50%',
            transform: 'translateX(-50%)',
            width: '260px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(76,175,128,.15) 0%, transparent 65%)',
            filter: 'blur(50px)',
            animation: 'orbDrift 40s ease-in-out 6s infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Grain texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '160px 160px',
            opacity: 0.045,
            mixBlendMode: 'overlay',
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Particules — orée basse */}
          {HERO_PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: p.top, left: p.left,
              width: `${p.size}px`, height: `${p.size}px`,
              borderRadius: '50%',
              background: p.color,
              animation: `particleFloat ${p.dur} ${p.delay} ease-in-out infinite`,
              pointerEvents: 'none', zIndex: 0,
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.15em',
              marginBottom: '20px',
              padding: '6px 16px',
              borderRadius: '100px',
              background: 'rgba(45,122,84,.22)',
              border: '1px solid rgba(45,122,84,.45)',
              color: 'rgba(255,255,255,.7)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              Mémoire &amp; Culture
            </span>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '20px',
            }}>
              Chroniques
            </h1>
            <p style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              lineHeight: 1.7,
              maxWidth: '540px',
              color: 'rgba(255,255,255,.6)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              Explorer les histoires et les lignées des familles sénégalaises.
            </p>
            {canWrite && (
              <Link href="/chroniques/nouveau" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '28px',
                padding: '10px 22px',
                borderRadius: '100px',
                background: 'rgba(45,122,84,.85)',
                border: '1px solid rgba(76,175,128,.5)',
                color: 'white',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background .2s',
              }}>
                + Nouvelle chronique
              </Link>
            )}
          </div>
        </section>

        {/* ── GRILLE CHRONIQUES ── */}
        <section style={{ padding: '64px 48px', maxWidth: '1100px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <div className="spin" />
            </div>
          ) : articles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 0',
              color: 'var(--t3)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
            }}>
              Aucune chronique publiée pour le moment.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '28px',
            }}>
              {articles.map(article => {
                const cs = getCatStyle(article.categorie);
                return (
                  <Link key={article.id} href={`/chroniques/${article.slug}`} style={{ textDecoration: 'none' }}>
                    <article
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.6)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
                        transition: 'transform .2s, box-shadow .2s',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(20,18,13,0.15)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(20,18,13,0.08)';
                      }}
                    >
                      {/* Image */}
                      {article.image_url && (
                        <div style={{ height: '200px', overflow: 'hidden', background: '#1a3a2a', flexShrink: 0 }}>
                          <img
                            src={article.image_url}
                            alt={article.titre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      {/* Corps */}
                      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* Catégorie */}
                        <span style={{
                          display: 'inline-block',
                          alignSelf: 'flex-start',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '.1em',
                          padding: '3px 10px',
                          borderRadius: '100px',
                          background: cs.bg,
                          border: `1px solid ${cs.border}`,
                          color: cs.color,
                          marginBottom: '12px',
                          fontFamily: 'Outfit, sans-serif',
                        }}>
                          {article.categorie}
                        </span>

                        {/* Titre */}
                        <h2 style={{
                          fontFamily: 'Cormorant Garamond, serif',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: 'var(--t1)',
                          marginBottom: '10px',
                        }}>
                          {article.titre}
                        </h2>

                        {/* Résumé */}
                        {article.resume && (
                          <p style={{
                            fontSize: '0.875rem',
                            lineHeight: 1.65,
                            color: 'var(--t2)',
                            fontFamily: 'Outfit, sans-serif',
                            marginBottom: '20px',
                            flex: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {article.resume}
                          </p>
                        )}

                        {/* Meta */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: 'var(--t3)',
                          fontFamily: 'Outfit, sans-serif',
                          marginTop: 'auto',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--bd)',
                        }}>
                          <span>✍ {article.auteur}</span>
                          <span>
                            {new Date(article.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>

      <HomeFooter />
    </>
  );
}
