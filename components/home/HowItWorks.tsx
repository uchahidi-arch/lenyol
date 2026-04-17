const STEPS = [
  {
    num: '1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Recherchez',
    body: 'Tapez un nom de famille, une personne ou une localité dans la barre de recherche.',
  },
  {
    num: '2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Explorez',
    body: 'Naviguez dans les profils, les lignées et les liens entre familles enregistrées.',
  },
  {
    num: '3',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Connectez',
    body: 'Rejoignez le registre, ajoutez votre famille et reliez-la à d\'autres lignées confirmées.',
  },
];

export default function HowItWorks() {
  return (
    <section className="lnu-hiw" id="comment-ca-marche">
      <div className="lnu-hiw-inner">
        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Comment ça marche</span>
          <h2 className="lnu-section-title">Simple et rapide</h2>
          <p className="lnu-section-sub">Trois étapes pour accéder au registre et y contribuer.</p>
        </div>

        <div className="lnu-hiw-steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="lnu-hiw-step">
              <div className="lnu-hiw-num">{s.num}</div>
              <div className="lnu-hiw-icon">{s.icon}</div>
              <div className="lnu-hiw-title">{s.title}</div>
              <p className="lnu-hiw-body">{s.body}</p>
              {i < STEPS.length - 1 && <div className="lnu-hiw-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
