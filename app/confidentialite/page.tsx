'use client';

import { useState } from 'react';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import HomeFooter from '@/components/home/HomeFooter';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9f9f7' }}>
      <AboutNavWrapper />

      <main style={{ flex: 1, paddingTop: '72px', paddingBottom: '120px' }}>

        {/* En-tête */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '48px 32px 40px var(--page-left)' }}>
            <h1 style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 700,
              fontFamily: "'Cormorant Garamond', serif",
              color: 'var(--t1)',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '12px',
              letterSpacing: '-0.01em',
            }}>
              Confidentialité & données personnelles
            </h1>
            <p style={{
              fontSize: '15px',
              color: 'var(--t3)',
              lineHeight: 1.7,
              margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              maxWidth: '720px',
            }}>
              Lenyol préserve votre mémoire familiale. Nous prenons la protection de vos données avec le plus haut niveau de sérieux.
            </p>
          </div>
        </div>

        {/* Accordéon */}
        <div style={{ maxWidth: '680px', padding: '40px 32px 0 var(--page-left)' }}>
          {sections.map((s, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: 'var(--t1)',
                  lineHeight: 1.4,
                }}>
                  {s.title}
                </span>
                <span style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--t3)',
                  fontSize: '18px',
                  lineHeight: 1,
                  transition: 'transform .2s',
                  transform: open === i ? 'rotate(45deg)' : 'none',
                }}>
                  +
                </span>
              </button>

              {open === i && (
                <p style={{
                  margin: '0 0 20px',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  color: 'var(--t2)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 400,
                  maxWidth: '560px',
                  whiteSpace: 'pre-line',
                }}>
                  {s.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
