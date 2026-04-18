'use client';

import { useState } from 'react';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import HomeFooter from '@/components/home/HomeFooter';

const faqs = [
  {
    q: 'Pourquoi Lenyol existe ?',
    a: "Les grands outils de généalogie ont été conçus pour d'autres cultures. Ils ignorent nos réalités : les noms sénégalais, le Lenyol, le Galle, la transmission orale. Lenyol est né pour combler ce vide — une plateforme pensée depuis le Sénégal, pour les familles sénégalaises.",
  },
  {
    q: 'Qui a créé Lenyol ?',
    a: "Lenyol a été conçu et développé par UCHAHIDI, à travers sa branche U-Data. Le projet est porté par une équipe convaincue que préserver la mémoire généalogique sénégalaise est une forme de souveraineté culturelle.",
  },
  {
    q: 'Comment fonctionne le registre ?',
    a: "Le registre est une base de données publique de personnes ajoutées par la communauté. Il est organisé par pays, région et localité. Tu peux y chercher un nom, une famille, ou explorer les lignées d'une région entière.",
  },
  {
    q: "Qu'est-ce que le Griot Numérique ?",
    a: "Le Griot Numérique est un outil à venir qui permettra de générer un récit textuel de ta lignée — comme si un griot racontait l'histoire de ta famille. Il s'appuie sur les données que tu as saisies dans ton arbre.",
  },
  {
    q: 'Comment devenir Fondateur ?',
    a: "Les Fondateurs sont les premiers membres qui rejoignent Lenyol avant son lancement officiel. En t'inscrivant maintenant, tu bénéficies d'un accès anticipé, d'un statut permanent de Fondateur visible sur ton profil, et tu contribues à lancer la plateforme.",
  },
  {
    q: 'Qui peut contribuer ?',
    a: "Tout le monde. Que tu sois de la diaspora sénégalaise ou sur place, à Dakar, à Touba ou à Ziguinchor, chaque arbre compte. Plus il y a de données, plus Lenyol devient utile pour l'ensemble de la communauté.",
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: "Oui. Tu contrôles ce que tu partages. Les données personnelles sensibles (date de naissance, contacts) restent privées par défaut. Seules les informations que tu choisis de rendre publiques apparaissent dans le registre.",
  },
  {
    q: 'Comment nous contacter ?',
    a: "Tu peux nous écrire à contact@lenyol.com. Pour les retours sur la plateforme ou les signalements d'erreurs, un formulaire de contact sera bientôt disponible directement depuis ton espace.",
  },
  {
    q: "Lenyol est-il disponible dans d'autres pays ?",
    a: "Lenyol est aujourd'hui centré sur le Sénégal, mais la plateforme est conçue pour s'ouvrir progressivement à d'autres pays d'Afrique de l'Ouest. Si tu fais partie de la diaspora ou d'une communauté hors du Sénégal, tu peux déjà t'inscrire et commencer ton arbre.",
  },
  {
    q: 'Comment migrer mon arbre depuis Geneanet ?',
    a: "Lenyol prendra en charge l'import de fichiers GEDCOM — le format standard utilisé par Geneanet et la plupart des outils de généalogie. Cette fonctionnalité est en cours de développement. En attendant, tu peux saisir tes données manuellement depuis Mon Arbre.",
  },
];

export default function AboutPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f9f9f7' }}>
      <AboutNavWrapper />

      <main style={{ flex: 1, paddingTop: '72px', paddingBottom: '120px' }}>

        {/* En-tête sobre */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{
          padding: '48px 32px 40px var(--page-left)',
        }}>
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
            À propos de Lenyol
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
            La première plateforme généalogique culturellement adaptée au Sénégal.
          </p>
        </div>
        </div>

        {/* FAQ accordion */}
        <div style={{
          maxWidth: '680px',
          padding: '40px 32px 0 var(--page-left)',
        }}>
          {faqs.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}
            >
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
                  {item.q}
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
                }}>
                  {item.a}
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
