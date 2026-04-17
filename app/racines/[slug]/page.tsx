'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HomeFooter from '@/components/home/HomeFooter';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import TreeView from '@/components/app/TreeView';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/lib/types';

interface Article {
  id: string;
  titre: string;
  slug: string;
  resume: string | null;
  contenu: string;
  image_url: string | null;
  categorie: string;
  auteur: string;
  created_at: string;
}

const CATEGORIE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  culture:    { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-bd)' },
  histoire:   { color: 'var(--gold)',  bg: 'var(--gold-bg)',  border: 'var(--gold-bd)'  },
  genealogie: { color: '#7c5cbf',      bg: 'rgba(124,92,191,0.1)', border: 'rgba(124,92,191,0.3)' },
  hinya:      { color: 'var(--rose)',  bg: 'var(--rose-bg)',  border: 'var(--rose-li)'  },
  royaumes:   { color: 'var(--gold)',  bg: 'var(--gold-bg)',  border: 'var(--gold-bd)'  },
  'lignées':  { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-bd)' },
  ethnies:    { color: '#7c5cbf',      bg: 'rgba(124,92,191,0.1)', border: 'rgba(124,92,191,0.3)' },
  'noms de familles': { color: 'var(--rose)', bg: 'var(--rose-bg)', border: 'var(--rose-li)' },
};

function ini(p: Person) {
  return ((p.prenom?.[0] ?? '?') + (p.nom?.[0] ?? '?')).toUpperCase();
}

function formatContenu(raw: string): string {
  return raw
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|p|ul|ol|li|blockquote|div)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

export default function RacinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const canWrite = profile?.role === 'redacteur' || profile?.role === 'admin';

  const [article, setArticle]       = useState<Article | null>(null);
  const [persons, setPersons]       = useState<Person[]>([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [treePersonId, setTreePersonId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleDelete = async () => {
    if (!article) return;
    setDeleting(true);
    await supabase.from('articles').delete().eq('id', article.id);
    router.push('/racines');
  };

  useEffect(() => {
    import('@/lib/supabase').then(async ({ supabase }) => {
      const { data: art } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('publie', true)
        .single();

      if (!art) { setNotFound(true); setLoading(false); return; }
      setArticle(art as Article);

      try {
        const { data: links } = await supabase
          .from('article_persons')
          .select('person_id')
          .eq('article_id', art.id);

        if (links && links.length > 0) {
          const ids = links.map((l: any) => l.person_id);
          const { data: pData } = await supabase
            .from('persons')
            .select('*')
            .in('id', ids);
          setPersons((pData ?? []) as Person[]);
        }
      } catch {
        // table article_persons pas encore créée
      }

      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <>
        <AboutNavWrapper />
        <main style={{ paddingTop: '64px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spin" />
        </main>
        <HomeFooter />
      </>
    );
  }

  if (notFound || !article) {
    return (
      <>
        <AboutNavWrapper />
        <main style={{ paddingTop: '64px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: 'var(--t1)' }}>
            Article introuvable
          </p>
          <Link href="/racines" style={{ color: 'var(--green)', fontFamily: 'Outfit, sans-serif', fontSize: '14px', textDecoration: 'none' }}>
            ← Retour aux Racines
          </Link>
        </main>
        <HomeFooter />
      </>
    );
  }

  const cs = CATEGORIE_COLORS[article.categorie?.toLowerCase()] ?? CATEGORIE_COLORS.culture;

  return (
    <>
      <AboutNavWrapper />

      {treePersonId && (
        <TreeView
          personId={treePersonId}
          scope="reg"
          onBack={() => setTreePersonId(null)}
          onNavigateTo={(id) => setTreePersonId(id)}
        />
      )}

      <main style={{ paddingTop: '64px' }}>

        {/* ── EN-TÊTE ARTICLE ── */}
        <section style={{
          background: 'var(--hero)',
          backgroundImage: article.image_url
            ? `linear-gradient(to bottom, rgba(10,26,18,0.72), rgba(10,26,18,0.92)), url(${JSON.stringify(article.image_url)})`
            : 'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(45,122,84,.45) 0%, transparent 65%),' +
              'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(122,83,14,.18) 0%, transparent 50%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: 'clamp(56px, 8vw, 96px) 48px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>

            {/* Breadcrumb + actions */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/racines" style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,.45)',
                fontFamily: 'Outfit, sans-serif',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                ← Racines
              </Link>
              {canWrite && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/racines/${slug}/modifier`} style={{
                    fontSize: '12px',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '5px 14px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,.12)',
                    border: '1px solid rgba(255,255,255,.25)',
                    color: 'rgba(255,255,255,.85)',
                  }}>
                    Modifier
                  </Link>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} style={{
                      fontSize: '12px',
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 600,
                      padding: '5px 14px',
                      borderRadius: '100px',
                      background: 'rgba(220,38,38,.18)',
                      border: '1px solid rgba(220,38,38,.35)',
                      color: 'rgba(255,180,180,.9)',
                      cursor: 'pointer',
                    }}>
                      Supprimer
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', fontFamily: 'Outfit, sans-serif' }}>Confirmer ?</span>
                      <button onClick={handleDelete} disabled={deleting} style={{
                        fontSize: '12px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        padding: '5px 14px',
                        borderRadius: '100px',
                        background: 'rgba(220,38,38,.7)',
                        border: 'none',
                        color: 'white',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                      }}>
                        {deleting ? '…' : 'Oui, supprimer'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)} style={{
                        fontSize: '12px',
                        fontFamily: 'Outfit, sans-serif',
                        padding: '5px 12px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,.1)',
                        border: '1px solid rgba(255,255,255,.2)',
                        color: 'rgba(255,255,255,.7)',
                        cursor: 'pointer',
                      }}>
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Catégorie */}
            <span style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              padding: '3px 12px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.22)',
              color: 'rgba(255,255,255,.8)',
              marginBottom: '20px',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {article.categorie}
            </span>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: '20px',
            }}>
              {article.titre}
            </h1>

            {article.resume && (
              <p style={{
                fontSize: 'clamp(0.9rem, 2vw, 1.0625rem)',
                lineHeight: 1.75,
                color: 'rgba(255,255,255,.62)',
                fontFamily: 'Outfit, sans-serif',
                maxWidth: '600px',
                margin: '0 auto 24px',
              }}>
                {article.resume}
              </p>
            )}

            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,.4)',
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <span>✍ {article.auteur}</span>
              <span>·</span>
              <span>
                {new Date(article.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </section>

        {/* ── CONTENU ── */}
        <section style={{ padding: 'clamp(40px, 6vw, 72px) 24px', maxWidth: '720px', margin: '0 auto' }}>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: formatContenu(article.contenu) }}
          />
        </section>

        {/* ── PERSONNES LIÉES ── */}
        {persons.length > 0 && (
          <section style={{ padding: '0 24px clamp(64px, 8vw, 96px)', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ height: '1px', background: 'var(--bd)', marginBottom: '48px' }} />

            <span style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.15em',
              marginBottom: '8px',
              color: 'var(--green)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              Arbre illustratif
            </span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--t1)',
            }}>
              Personnes mentionnées
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--t3)',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '28px',
            }}>
              Cliquez sur une personne pour explorer son arbre généalogique dans le registre.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {persons.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTreePersonId(p.id)}
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 16px rgba(20,18,13,0.07)',
                    transition: 'transform .15s, box-shadow .15s',
                    textAlign: 'left',
                    minWidth: '180px',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(20,18,13,0.14)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(20,18,13,0.07)';
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: p.genre === 'F' ? 'rgba(194,110,139,0.15)' : 'rgba(45,106,79,0.15)',
                    border: `2px solid ${p.genre === 'F' ? 'rgba(194,110,139,0.4)' : 'rgba(45,106,79,0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: p.genre === 'F' ? 'rgb(194,110,139)' : 'var(--green)',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : ini(p)
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--t1)',
                      fontFamily: 'Cormorant Garamond, serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {p.prenom} {p.nom}
                    </div>
                    {(p.clan || p.localite) && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--t3)',
                        fontFamily: 'Outfit, sans-serif',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {[p.prefix_lignee && p.clan ? `${p.prefix_lignee} ${p.clan}` : p.clan, p.localite].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>

                  <svg width="14" height="14" fill="none" stroke="var(--t3)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        )}

      </main>

      <HomeFooter />
    </>
  );
}
