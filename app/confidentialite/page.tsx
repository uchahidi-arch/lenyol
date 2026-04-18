'use client';

import { useState } from 'react';
import Link from 'next/link';

const sections = [
  {
    title: 'Vos données vous appartiennent',
    content: `Toutes les informations que vous saisissez sur Lenyol — arbres généalogiques, fiches de personnes, liens familiaux, numéros de téléphone dans les arbres privés — restent votre propriété exclusive. Lenyol n'est qu'un gardien de votre mémoire, jamais son propriétaire.

Vous pouvez à tout moment exporter vos données au format GEDCOM depuis votre espace personnel. Vous pouvez également supprimer l'intégralité de votre compte et de vos données sur simple demande.`,
  },
  {
    title: 'Ce que nous collectons',
    content: `Lors de la création de votre compte : votre prénom et nom, votre adresse email pour l'authentification, votre pseudo comme identifiant public, et votre région d'origine de façon facultative.

Lors de l'utilisation : vos arbres généalogiques, fiches de personnes, unions et lignées, ainsi que des métadonnées de navigation anonymisées pour la stabilité du service.

Dans les arbres privés : les numéros de téléphone que vous ajoutez volontairement sont visibles uniquement par les membres que vous invitez explicitement. Ils ne sont jamais partagés ni accessibles publiquement.`,
  },
  {
    title: 'Ce que nous ne faisons jamais',
    content: `Lenyol s'engage formellement à ne jamais vendre vos données à des tiers, partager vos informations personnelles sans votre consentement explicite, utiliser vos données généalogiques à des fins commerciales ou publicitaires, transmettre vos données à des entreprises tierces hors cadre technique nécessaire, ni accéder à votre arbre privé sans votre autorisation.

Les données partagées dans le Registre sont uniquement celles que vous avez explicitement rendues publiques.`,
  },
  {
    title: 'Arbres privés',
    content: `Un arbre privé est un espace familial fermé. Seuls les membres que vous invitez par numéro de téléphone ou par lien peuvent le consulter, selon le rôle que vous leur attribuez — Lecteur, Contributeur ou Administrateur.

Aucun contenu d'un arbre privé n'est indexé par les moteurs de recherche ni visible dans le Registre public. Lenyol ne peut pas accéder à vos arbres privés sauf en cas d'obligation légale formelle.`,
  },
  {
    title: 'Vos droits',
    content: `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants : droit d'accès à vos données, droit de rectification de toute information inexacte, droit à l'effacement complet de votre compte et de vos données, droit à la portabilité au format GEDCOM, et droit d'opposition à tout traitement non essentiel.

Pour exercer l'un de ces droits, contactez-nous à contact@lenyol.com. Nous nous engageons à répondre dans un délai de 72 heures ouvrées.`,
  },
  {
    title: 'Supprimer votre compte',
    content: `Vous pouvez demander la suppression complète de votre compte à tout moment. Cela inclut votre profil et informations personnelles, l'intégralité de vos arbres généalogiques, vos unions et liens familiaux, et vos données d'authentification.

La suppression est définitive et irréversible. Nous vous recommandons d'exporter vos données au format GEDCOM avant de procéder. Pour initier la suppression, écrivez à contact@lenyol.com en indiquant votre adresse email de compte.`,
  },
  {
    title: 'Nous contacter',
    content: `Pour toute question relative à vos données, à la confidentialité ou pour exercer vos droits, contactez l'équipe Lenyol à l'adresse contact@lenyol.com. Nous répondons dans un délai de 72 heures ouvrées.

U-Data · Équipe Lenyol · Avril 2026`,
  },
];

export default function ConfidentialitePage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg, #f8f7f4)' }}>

      {/* Contenu */}
      <main style={{ flex: 1, maxWidth: '780px', margin: '0 auto', padding: '56px 32px 80px', width: '100%' }}>

        {/* Label */}
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#2d6a4f', marginBottom: '10px' }}>
          Confidentialité
        </div>

        {/* Titre */}
        <h1 style={{ fontSize: '38px', fontWeight: 700, fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#111', lineHeight: 1.15, margin: '0 0 12px' }}>
          Vos données vous appartiennent.
        </h1>

        {/* Sous-titre */}
        <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, margin: '0 0 32px', maxWidth: '560px' }}>
          Lenyol préserve votre mémoire familiale. Nous prenons la protection de vos données avec le plus haut niveau de sérieux.
        </p>

        {/* Barre */}
        <div style={{ height: '1px', background: '#e0ddd6', marginBottom: '40px' }} />

        {/* Accordéon */}
        {sections.map((s, i) => (
          <div key={i} style={{ borderBottom: '1px solid #e0ddd6' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#111', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {s.title}
              </span>
              <span style={{ fontSize: '20px', color: '#2d6a4f', fontWeight: 300, lineHeight: 1 }}>
                {open === i ? '−' : '+'}
              </span>
            </button>
            {open === i && (
              <div style={{ padding: '0 0 24px', fontSize: '14px', color: '#444', lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                {s.content}
              </div>
            )}
          </div>
        ))}

        {/* Bas de page */}
        <div style={{ marginTop: '48px', fontSize: '12px', color: '#999', borderTop: '1px solid #e0ddd6', paddingTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Dernière mise à jour : avril 2026</span>
          <Link href="/" style={{ color: '#2d6a4f', textDecoration: 'none' }}>← Retour à l'accueil</Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#0D1F17', padding: '48px 32px', color: '#a8c5a0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
          <div style={{ maxWidth: '280px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#a8c5a0', marginBottom: '12px' }}>Lenyol</div>
            <p style={{ fontSize: '13px', color: '#6a8f72', lineHeight: 1.7, margin: 0 }}>
              Préservez votre lignée. Transmettez votre histoire. La mémoire généalogique sénégalaise, pour les générations à venir.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4a6e52', marginBottom: '16px' }}>Plateforme</div>
              {['Mon Arbre', 'Registre', 'Griot & Racines'].map(l => (
                <div key={l} style={{ marginBottom: '10px' }}>
                  <Link href="/" style={{ fontSize: '14px', color: '#a8c5a0', textDecoration: 'none' }}>{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#4a6e52', marginBottom: '16px' }}>Informations</div>
              {['À propos', 'Confidentialité', 'Comment ça marche'].map(l => (
                <div key={l} style={{ marginBottom: '10px' }}>
                  <Link href="/" style={{ fontSize: '14px', color: '#a8c5a0', textDecoration: 'none' }}>{l}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '32px auto 0', borderTop: '1px solid #1a3a22', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4a6e52' }}>
          <span>© 2026 Lenyol · Développé par U-Data</span>
          <Link href="/confidentialite" style={{ color: '#4a6e52', textDecoration: 'none' }}>Politique de confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
