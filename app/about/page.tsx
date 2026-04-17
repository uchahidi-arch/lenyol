import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import HomeFooter from '@/components/home/HomeFooter'
import AboutNavWrapper from '@/components/home/AboutNavWrapper'

export const metadata: Metadata = {
  title: 'À propos — Lenyol, Mémoire Généalogique Sénégalaise',
  description:
    "Lenyol est né d'un constat simple : aucun outil de généalogie ne reflète la réalité sénégalaise. Découvrez notre histoire et notre mission.",
}

const pillars = [
  {
    emoji: '🌿',
    title: 'Mémoire',
    text: "Préserver les lignées, les noms, les histoires avant qu'elles ne s'effacent.",
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    border: 'var(--green-bd)',
  },
  {
    emoji: '🔗',
    title: 'Connexion',
    text: 'Relier la diaspora à ses racines, et les familles entre elles.',
    color: 'var(--gold)',
    bg: 'var(--gold-bg)',
    border: 'var(--gold-bd)',
  },
  {
    emoji: '🏛️',
    title: 'Identité',
    text: "Affirmer la culture sénégalaise à travers un outil numérique qui lui ressemble.",
    color: 'var(--rose)',
    bg: 'var(--rose-bg)',
    border: 'var(--rose-li)',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* ── NAV ─────────────────────────────────────────── */}
      <AboutNavWrapper />

      <main style={{ paddingTop: '64px' }}>
        {/* ── SECTION 1 : HERO ────────────────────────────── */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '112px 48px',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--hero)',
            backgroundImage:
              'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(45,122,84,.45) 0%, transparent 65%),' +
              'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(122,83,14,.18) 0%, transparent 50%)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '768px', margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                marginBottom: '28px',
                padding: '6px 16px',
                borderRadius: '100px',
                background: 'rgba(45,122,84,.22)',
                border: '1px solid rgba(45,122,84,.45)',
                color: 'rgba(255,255,255,.7)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Notre histoire
            </span>
            <h1
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '28px',
              }}
            >
              Fait par des Sénégalais,
              <br />
              pour des Sénégalais.
            </h1>
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                lineHeight: 1.7,
                maxWidth: '640px',
                margin: '0 auto',
                color: 'rgba(255,255,255,.6)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Lenyol est né d&apos;un refus. Le refus que la mémoire sénégalaise se perde dans des
              outils pensés pour d&apos;autres.
            </p>
          </div>
        </section>

        {/* ── SECTION 2 : L'ORIGINE ───────────────────────── */}
        <section style={{ padding: '80px 48px', background: 'transparent' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                marginBottom: '20px',
                color: 'var(--green)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Origine
            </span>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                marginBottom: '36px',
                lineHeight: 1.25,
                color: 'var(--t1)',
              }}
            >
              Pourquoi Lenyol existe
            </h2>
            <div style={{ color: 'var(--t2)', fontFamily: 'Outfit, sans-serif', fontSize: '1.0625rem', lineHeight: 1.85 }}>
              <p style={{ marginBottom: '24px' }}>
                Les grands sites de généalogie mondiaux n&apos;ont pas été conçus pour nous. Ils
                ignorent le Lenyol, le Galle, la transmission matrilinéaire, les liens entre régions,
                les noms sénégalais, les réalités de nos familles. Résultat&nbsp;: des milliers de
                familles sénégalaises sans outil digne de leur histoire.
              </p>
              <p>
                Lenyol est né de ce constat. Une alternative pensée depuis le Sénégal, ancrée
                dans la culture sénégalaise, construite pour les familles sénégalaises — qu&apos;elles
                vivent à Dakar, à Paris, à Touba ou à New York.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3 : UCHAHIDI & U-DATA ──────────────── */}
        <section style={{ padding: '80px 48px', background: 'transparent' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                marginBottom: '20px',
                color: 'var(--gold)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Vision
            </span>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                marginBottom: '36px',
                lineHeight: 1.25,
                color: 'var(--t1)',
              }}
            >
              Un projet porté par une vision
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.85,
                color: 'var(--t2)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Lenyol n&apos;est pas né seul. Dans la logique d&apos;affirmer et de préserver
              l&apos;identité sénégalaise,{' '}
              <strong style={{ color: 'var(--t1)' }}>UCHAHIDI</strong> — à travers sa branche{' '}
              <strong style={{ color: 'var(--t1)' }}>U-Data</strong> — a accompagné le projet
              depuis ses premières heures jusqu&apos;à sa naissance. Parce que construire des
              outils numériques qui reflètent qui nous sommes, c&apos;est aussi une forme de
              souveraineté culturelle.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
              <div style={{ height: '1px', flex: 1, background: 'var(--bd)' }} />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  flexShrink: 0,
                  color: 'var(--gold)',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                UCHAHIDI × U-Data
              </span>
              <div style={{ height: '1px', flex: 1, background: 'var(--bd)' }} />
            </div>
          </div>
        </section>

        {/* ── SECTION 4 : MISSION ─────────────────────────── */}
        <section style={{ padding: '80px 48px', background: 'transparent' }}>
          <div style={{ maxWidth: '896px', margin: '0 auto' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                marginBottom: '20px',
                color: 'var(--green)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Mission
            </span>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                marginBottom: '28px',
                lineHeight: 1.25,
                color: 'var(--t1)',
              }}
            >
              Notre mission
            </h2>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                fontWeight: 500,
                marginBottom: '24px',
                lineHeight: 1.55,
                color: 'var(--t1)',
              }}
            >
              Connecter la nouvelle génération à ses origines.
            </p>
            <p
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.85,
                marginBottom: '64px',
                color: 'var(--t2)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Que tu sois né au Sénégal ou que tu aies grandi loin du pays, Lenyol
              est fait pour toi. Pour que tes enfants sachent d&apos;où ils viennent. Pour que le
              nom de ton arrière-grand-mère ne disparaisse pas. Pour que le Lenyol de ta famille
              traverse les générations. Pour que tu sois fier.
            </p>

            {/* Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
              }}
            >
              {pillars.map(({ emoji, title, text, color, bg, border }) => (
                <div
                  key={title}
                  style={{
                    borderRadius: 'var(--r-lg)',
                    padding: '28px',
                    background: bg,
                    border: `1px solid ${border}`,
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1 }}>{emoji}</div>
                  <h3
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      marginBottom: '12px',
                      color,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: 1.75,
                      color: 'var(--t2)',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5 : CTA ─────────────────────────────── */}
        <section
          style={{
            padding: '112px 48px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--hero)',
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(45,122,84,.35) 0%, transparent 60%),' +
              'radial-gradient(ellipse 50% 40% at 80% 20%, rgba(122,83,14,.15) 0%, transparent 50%)',
          }}
        >
          {/* Particules d'arrière-plan */}
          {[
            { top: '8%',  left: '7%',  size: 3, color: 'rgba(255,255,255,0.12)', delay: '0s',   dur: '28s' },
            { top: '15%', left: '22%', size: 2, color: 'rgba(100,200,120,0.08)', delay: '3s',   dur: '34s' },
            { top: '70%', left: '12%', size: 4, color: 'rgba(255,255,255,0.12)', delay: '6s',   dur: '22s' },
            { top: '85%', left: '30%', size: 2, color: 'rgba(100,200,120,0.08)', delay: '1s',   dur: '38s' },
            { top: '5%',  left: '48%', size: 3, color: 'rgba(255,255,255,0.12)', delay: '9s',   dur: '26s' },
            { top: '55%', left: '55%', size: 5, color: 'rgba(100,200,120,0.08)', delay: '4s',   dur: '32s' },
            { top: '90%', left: '60%', size: 2, color: 'rgba(255,255,255,0.12)', delay: '11s',  dur: '24s' },
            { top: '20%', left: '72%', size: 4, color: 'rgba(100,200,120,0.08)', delay: '7s',   dur: '36s' },
            { top: '75%', left: '80%', size: 3, color: 'rgba(255,255,255,0.12)', delay: '2s',   dur: '30s' },
            { top: '40%', left: '88%', size: 2, color: 'rgba(100,200,120,0.08)', delay: '13s',  dur: '20s' },
            { top: '30%', left: '3%',  size: 5, color: 'rgba(100,200,120,0.08)', delay: '5s',   dur: '40s' },
            { top: '60%', left: '38%', size: 2, color: 'rgba(255,255,255,0.12)', delay: '8s',   dur: '27s' },
            { top: '12%', left: '90%', size: 3, color: 'rgba(255,255,255,0.12)', delay: '15s',  dur: '33s' },
            { top: '48%', left: '18%', size: 4, color: 'rgba(100,200,120,0.08)', delay: '10s',  dur: '23s' },
            { top: '95%', left: '92%', size: 3, color: 'rgba(255,255,255,0.12)', delay: '0s',   dur: '29s' },
            { top: '35%', left: '65%', size: 2, color: 'rgba(100,200,120,0.08)', delay: '12s',  dur: '37s' },
            { top: '80%', left: '47%', size: 5, color: 'rgba(255,255,255,0.12)', delay: '16s',  dur: '21s' },
            { top: '22%', left: '52%', size: 3, color: 'rgba(100,200,120,0.08)', delay: '14s',  dur: '35s' },
          ].map((p, i) => (
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

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '768px', margin: '0 auto' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                marginBottom: '24px',
                color: 'rgba(255,255,255,.45)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Rejoindre
            </span>
            <h2
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.875rem, 4vw, 3rem)',
                fontWeight: 700,
                color: 'white',
                marginBottom: '32px',
                lineHeight: 1.15,
              }}
            >
              Plus qu&apos;un site,
              <br />
              une base de données vivante
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                marginBottom: '48px',
                maxWidth: '640px',
                margin: '0 auto 48px',
                lineHeight: 1.8,
                color: 'rgba(255,255,255,.58)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Lenyol n&apos;est pas seulement un endroit où consulter sa généalogie. C&apos;est un
              projet collectif. Chaque famille qui crée son arbre, chaque personne ajoutée, chaque
              Lenyol enregistré — tout cela construit une base de données capable de connecter tous
              les Sénégalais entre eux. Un jour, tu pourras découvrir que cette famille de Thiès
              est liée à la tienne. Que ce Sénégalais de Paris partage ton Galle. Lenyol grandit avec
              vous.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '100px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all .2s',
                  background: 'white',
                  color: 'var(--green)',
                  padding: '13px 28px',
                  fontSize: '14px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                🌿 Créer mon arbre
              </Link>
              <Link
                href="/registre"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '100px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all .2s',
                  color: 'white',
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.28)',
                  padding: '13px 28px',
                  fontSize: '14px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                🔍 Explorer le registre
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </>
  )
}
