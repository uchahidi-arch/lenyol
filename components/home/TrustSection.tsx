const ITEMS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Données contrôlées',
    body: 'Chaque famille gère ses propres données. Rien n\'est partagé sans votre accord explicite.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Validation communautaire',
    body: 'Les liens entre familles sont confirmés par les deux parties. Aucune connexion n\'est imposée.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Confidentialité',
    body: 'Vos informations personnelles ne sont jamais revendues. Vous pouvez supprimer votre compte à tout moment.',
  },
];

export default function TrustSection() {
  return (
    <section className="lnu-trust" id="confiance">
      <div className="lnu-trust-inner">
        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Confiance</span>
          <h2 className="lnu-section-title">Vos données vous appartiennent</h2>
        </div>

        <div className="lnu-trust-items">
          {ITEMS.map(item => (
            <div key={item.title} className="lnu-trust-item">
              <div className="lnu-trust-ico">{item.icon}</div>
              <div className="lnu-trust-title">{item.title}</div>
              <p className="lnu-trust-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
