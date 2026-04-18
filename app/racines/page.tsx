'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRacinesFilter } from './layout';

interface Article {
  id: string;
  titre: string;
  slug: string;
  resume: string | null;
  categorie: string;
  auteur: string;
  created_at: string;
}

const CATEGORIES = ['Tous', 'Royaumes', 'Lignées', 'Ethnies', 'Familles'];

const CAT_COLORS: Record<string, string> = {
  royaumes:           'var(--gold)',
  lignées:            'var(--green)',
  ethnies:            '#7c5cbf',
  'familles': 'var(--rose)',
};

function catColor(cat: string) {
  return CAT_COLORS[cat?.toLowerCase()] ?? 'var(--t3)';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RacinesPage() {
  const { profile } = useAuth();
  const canWrite = profile?.role === 'redacteur' || profile?.role === 'admin';
  const { categorie: activeFilter, setCategorie: setActiveFilter } = useRacinesFilter();

  const [articles, setArticles]     = useState<Article[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('articles')
        .select('id, titre, slug, resume, categorie, auteur, created_at')
        .eq('publie', true)
        .order('created_at', { ascending: false });
      setArticles((data ?? []) as Article[]);
      setLoading(false);
    });
  }, []);

  const filtered = activeFilter === 'Tous'
    ? articles
    : articles.filter(a => a.categorie?.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>

        {/* ── EN-TÊTE ── */}
        <section style={{
          padding: '64px 48px 36px var(--page-left)',
          borderBottom: '1px solid var(--bd)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.18em',
                color: 'var(--green)',
                fontFamily: 'Outfit, sans-serif',
                marginBottom: '10px',
              }}>
                Bibliothèque
              </span>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: 'var(--t1)',
                lineHeight: 1.1,
                marginBottom: '12px',
              }}>
                Racines
              </h1>
              <p style={{
                fontSize: '15px',
                color: 'var(--t3)',
                fontFamily: 'Outfit, sans-serif',
                maxWidth: '480px',
                lineHeight: 1.6,
              }}>
                Textes sur les royaumes, lignées, ethnies et familles du Sénégal.
              </p>
            </div>
            {canWrite && (
              <Link href="/racines/nouveau" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 20px',
                borderRadius: '100px',
                background: 'var(--green)',
                color: 'white',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                flexShrink: 0,
              }}>
                + Nouveau texte
              </Link>
            )}
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '100px',
                  border: activeFilter === cat ? '1px solid var(--green)' : '1px solid var(--bd)',
                  background: activeFilter === cat ? 'rgba(45,122,84,.08)' : 'transparent',
                  color: activeFilter === cat ? 'var(--green)' : 'var(--t3)',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  fontWeight: activeFilter === cat ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ── GRILLE ── */}
        <section style={{ padding: '48px 48px 96px var(--page-left)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 0',
              color: 'var(--t3)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
            }}>
              Aucun texte dans cette catégorie.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1px',
              background: 'var(--bd)',
              border: '1px solid var(--bd)',
            }}>
              {filtered.map(article => (
                <Link key={article.id} href={`/racines/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <article
                    style={{
                      background: 'var(--bg)',
                      padding: '28px 28px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      minHeight: '180px',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.12em',
                        color: catColor(article.categorie),
                        fontFamily: 'Outfit, sans-serif',
                      }}>
                        {article.categorie}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--t3)',
                        fontFamily: 'Outfit, sans-serif',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatDate(article.created_at)}
                      </span>
                    </div>

                    <h2 style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: 'var(--t1)',
                      margin: 0,
                    }}>
                      {article.titre}
                    </h2>

                    {article.resume && (
                      <p style={{
                        fontSize: '13px',
                        lineHeight: 1.65,
                        color: 'var(--t2)',
                        fontFamily: 'Outfit, sans-serif',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}>
                        {article.resume}
                      </p>
                    )}

                    <span style={{
                      fontSize: '11px',
                      color: 'var(--t3)',
                      fontFamily: 'Outfit, sans-serif',
                      marginTop: 'auto',
                    }}>
                      {article.auteur}
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

    </div>
  );
}
