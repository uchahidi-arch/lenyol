'use client';

import HomeFooter from '@/components/home/HomeFooter';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';

export default function GriotPage() {
  return (
    <>
      <AboutNavWrapper />

      <main style={{
        paddingTop: '64px',
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <span style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.18em',
            color: 'var(--green)',
            fontFamily: 'Outfit, sans-serif',
            marginBottom: '20px',
          }}>
            Bientôt disponible
          </span>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            color: 'var(--t1)',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Griot
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--t3)',
            fontFamily: 'Outfit, sans-serif',
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            Les chroniques orales et récits des griots comoriens arrivent bientôt.
          </p>
        </div>
      </main>

      <HomeFooter />
    </>
  );
}
