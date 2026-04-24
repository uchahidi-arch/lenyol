'use client';

import { useEffect, useState } from 'react';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import HomeFooter from '@/components/home/HomeFooter';
import { useAuth } from '@/hooks/useAuth';

// Plans de subscription
const PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: '0€',
    period: '/mois',
    description: 'Pour découvrir Aswilia',
    features: [
      'Recherche de familles, personnes et localités',
      'Registre communautaire',
      'Fiche famille simplifiée',
      'Aperçu de l\'arbre (flou)',
      'Aperçu des chroniques Racines',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: '3,99€',
    period: '/mois',
    description: 'Pour préserver votre histoire',
    features: [
      'Tout le gratuit +',
      'Chroniques Racines complètes',
      'Arbre généalogique interactif',
      'Royaume d\'origine + rôle social',
      'Photo de profil + 25 photos familiales',
      'Export PDF A3',
      'Score de fiabilité des liens',
    ],
    cta: 'Choisir ce plan',
    popular: false,
  },
  {
    id: 'hero',
    name: 'Héro',
    price: '6,99€',
    period: '/mois',
    description: 'Pour partager en famille',
    features: [
      'Tout Essentiel +',
      '3 arbres privés + 15 invités + 2 co-éditeurs',
      'Carte des migrations interactive',
      'Timeline familiale',
      'Données enrichies',
      'IA sur photos',
      'Notifications intelligentes',
    ],
    cta: 'Choisir ce plan',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '14,99€',
    period: '/mois',
    description: 'L\'héritage complet',
    features: [
      'Tout Héro +',
      'Coffre familial',
      'Griot Numérique (texte + audio)',
      'Mémoire orale',
      'Livre familial PDF/print',
      'Capsule temporelle',
      'Mode héritage',
      'Suggestions IA d\'ancêtres communs',
    ],
    cta: 'Choisir ce plan',
    popular: false,
  },
];

// Mapping des rôles vers les plans
const ROLE_TO_PLAN: Record<string, string> = {
  user: 'gratuit',
  redacteur: 'essentiel',
  admin: 'premium',
};

export default function AbonnementPage() {
  const { profile, loading: authLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role) {
      setCurrentPlan(ROLE_TO_PLAN[profile.role] || 'gratuit');
    }
  }, [authLoading, profile?.role]);

  return (
    <>
      <AboutNavWrapper />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* En-tête */}
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
                Abonnement
              </span>
              <h1 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: 'var(--t1)',
                lineHeight: 1.1,
                marginBottom: '12px',
              }}>
                Choisissez votre plan
              </h1>
              <p style={{
                fontSize: '15px',
                color: 'var(--t3)',
                fontFamily: 'Outfit, sans-serif',
                maxWidth: '480px',
                lineHeight: 1.6,
              }}>
                Préservez et partagez votre héritage familial avec Aswilia. 
                Sélectionnez le plan qui correspond le mieux à vos besoins.
              </p>
            </div>
          </div>
        </section>

        {/* Plans Grid */}
        <section style={{ padding: '48px var(--page-left)', maxWidth: '1400px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="plans-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: 'white',
                  borderRadius: 'var(--r-lg)',
                  border: plan.popular ? '2px solid var(--green)' : '1px solid var(--bd)',
                  boxShadow: plan.popular ? 'var(--sh2)' : 'var(--sh)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Badge populaire */}
                {plan.popular && (
                  <div style={{
                    background: 'var(--green)',
                    color: 'white',
                    textAlign: 'center',
                    padding: '6px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}>
                    Plus populaire
                  </div>
                )}

                {/* En-tête du plan */}
                <div style={{ padding: '24px', paddingTop: plan.popular ? '20px' : '24px' }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--t1)',
                    marginBottom: '4px',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '16px' }}>
                    {plan.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--t1)' }}>
                      {plan.price}
                    </span>
                    <span style={{ color: 'var(--t3)', fontSize: '14px' }}>{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div style={{ flex: 1, padding: '0 24px 16px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: 'var(--t2)' }}>
                        <svg
                          style={{ width: '16px', height: '16px', color: 'var(--green)', flexShrink: 0, marginTop: '2px' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton */}
                <div style={{ padding: '24px', paddingTop: '0' }}>
                  {currentPlan === plan.id ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--green-bg)',
                        color: 'var(--green)',
                        fontWeight: 600,
                        borderRadius: 'var(--r-sm)',
                        cursor: 'default',
                        border: 'none',
                        fontSize: '14px',
                      }}
                    >
                      Plan actuel
                    </button>
                  ) : (
                    <button
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontWeight: 600,
                        borderRadius: 'var(--r-sm)',
                        transition: 'all .15s',
                        border: 'none',
                        fontSize: '14px',
                        cursor: 'pointer',
                        background: plan.popular ? 'var(--green)' : 'var(--green-bg)',
                        color: plan.popular ? 'white' : 'var(--green)',
                      }}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ 
          background: 'white', 
          borderTop: '1px solid var(--bd)', 
          padding: '64px var(--page-left)' 
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              marginBottom: '40px',
              color: 'var(--t1)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              Questions fréquentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: '8px', fontSize: '15px' }}>
                  Puis-je changer de plan à tout moment ?
                </h3>
                <p style={{ color: 'var(--t2)', fontSize: '14px', lineHeight: 1.6 }}>
                  Oui, vous pouvez upgrade ou downgrade votre plan à tout moment. 
                  Les changements prennent effet au prochain cycle de facturation.
                </p>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: '8px', fontSize: '15px' }}>
                  Quels moyens de paiement acceptez-vous ?
                </h3>
                <p style={{ color: 'var(--t2)', fontSize: '14px', lineHeight: 1.6 }}>
                  Nous acceptons les cartes bancaires (Visa, Mastercard), Wave et Orange Money.
                </p>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: '8px', fontSize: '15px' }}>
                  Puis-je utiliser Lenyol depuis l'Afrique ?
                </h3>
                <p style={{ color: 'var(--t2)', fontSize: '14px', lineHeight: 1.6 }}>
                  Oui, Lenyol est fait pour la diaspora et les familles en Afrique de l'Ouest. Nous acceptons les moyens de paiement locaux.
                </p>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: '8px', fontSize: '15px' }}>
                  Mes données sont-elles sécurisées ?
                </h3>
                <p style={{ color: 'var(--t2)', fontSize: '14px', lineHeight: 1.6 }}>
                  Oui, toutes vos données familiales sont chiffrées et hébergées de manière sécurisée. Vous restez propriétaire de votre histoire.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <HomeFooter />
    </>
  );
}