'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ConfidentialitePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header minimal */}
      <header style={{
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Image src="/logo.png" alt="Lenyol" width={120} height={33} style={{ objectFit: 'contain', width: 'auto', height: '33px' }} />
        </Link>
        <span style={{ fontSize: '12px', color: 'var(--t3)', marginLeft: 'auto' }}>
          <Link href="/" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>← Retour</Link>
        </span>
      </header>

      {/* Contenu */}
      <main style={{ flex: 1, maxWidth: '720px', margin: '0 auto', padding: '48px 24px', width: '100%' }}>

        {/* Titre */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--green)', marginBottom: '8px' }}>
            Politique de confidentialité
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--t1)', lineHeight: 1.2, margin: 0 }}>
            Vos données vous appartiennent
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--t3)', marginTop: '12px', lineHeight: 1.7 }}>
            Lenyol est une plateforme de mémoire généalogique sénégalaise. Nous prenons la protection de vos données très au sérieux.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            emoji: '🏛️',
            title: 'Vos données vous appartiennent',
            content: (
              <>
                <p>Toutes les informations que vous saisissez sur Lenyol — arbres généalogiques, fiches de personnes, liens familiaux — restent votre propriété exclusive.</p>
                <p>Vous pouvez à tout moment exporter vos données au format JSON ou GEDCOM depuis votre espace personnel. Vous pouvez également supprimer l'intégralité de votre compte et de vos données sur simple demande.</p>
              </>
            ),
          },
          {
            emoji: '📋',
            title: 'Ce que nous collectons',
            content: (
              <>
                <p>Lors de la création de votre compte, nous collectons :</p>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li><strong>Votre prénom et nom</strong> — pour personnaliser votre expérience</li>
                  <li><strong>Votre adresse email</strong> — pour l'authentification et les notifications</li>
                  <li><strong>Votre pseudo</strong> — votre identifiant public sur la plateforme</li>
                  <li><strong>Votre région d'origine</strong> (facultatif) — pour les suggestions géographiques</li>
                </ul>
                <p>Lors de l'utilisation :</p>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li><strong>Vos arbres généalogiques</strong> — fiches de personnes, unions, lignées</li>
                  <li><strong>Les métadonnées de navigation</strong> — logs techniques anonymisés pour la stabilité du service</li>
                </ul>
                <p>Nos données sont hébergées sur <strong>Supabase</strong> (infrastructure sécurisée, chiffrée en transit et au repos).</p>
              </>
            ),
          },
          {
            emoji: '🚫',
            title: 'Ce que nous ne faisons jamais',
            content: (
              <>
                <p>Lenyol s'engage formellement à ne jamais :</p>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li>Vendre vos données à des tiers</li>
                  <li>Partager vos informations personnelles sans votre consentement explicite</li>
                  <li>Utiliser vos données généalogiques à des fins commerciales ou publicitaires</li>
                  <li>Transmettre vos données à des entreprises tierces hors cadre technique nécessaire</li>
                  <li>Accéder à votre arbre privé sans votre autorisation</li>
                </ul>
                <p>Les données partagées publiquement dans le Registre sont uniquement celles que vous avez explicitement rendues publiques.</p>
              </>
            ),
          },
          {
            emoji: '🗑️',
            title: 'Supprimer votre compte et vos données',
            content: (
              <>
                <p>Vous pouvez demander la suppression complète de votre compte à tout moment. Cela inclut :</p>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li>Votre profil et informations personnelles</li>
                  <li>L'intégralité de vos arbres généalogiques</li>
                  <li>Vos unions et liens familiaux</li>
                  <li>Vos données d'authentification</li>
                </ul>
                <p>La suppression est <strong>définitive et irréversible</strong>. Nous vous recommandons d'exporter vos données avant de procéder.</p>
                <p>Pour initier la suppression, contactez-nous à l'adresse ci-dessous en indiquant votre email de compte.</p>
              </>
            ),
          },
          {
            emoji: '✉️',
            title: 'Contact pour toute question',
            content: (
              <>
                <p>Pour toute question relative à vos données, à la confidentialité ou pour exercer vos droits (accès, rectification, suppression) :</p>
                <div style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginTop: '12px',
                  display: 'inline-block',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>U-Data · Équipe Lenyol</div>
                  <div style={{ fontSize: '13px', color: 'var(--green)', marginTop: '4px' }}>contact@lenyol.com</div>
                </div>
                <p style={{ marginTop: '16px' }}>Nous nous engageons à répondre dans un délai de <strong>72 heures ouvrées</strong>.</p>
              </>
            ),
          },
        ].map(({ emoji, title, content }) => (
          <div
            key={title}
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.75)',
              borderRadius: '20px',
              padding: '28px 32px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>{emoji}</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--t1)' }}>
                {title}
              </h2>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--t2)', lineHeight: 1.8 }}>
              {content}
            </div>
          </div>
        ))}

        {/* Footer de page */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--t3)', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          Dernière mise à jour : avril 2026 · <Link href="/" style={{ color: 'var(--green)', textDecoration: 'none' }}>Retour à l'accueil</Link>
        </div>
      </main>
    </div>
  );
}
