interface ContributionProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

export default function Contribution({ onOpenAuth }: ContributionProps) {
  return (
    <section className="lnu-contrib" id="contribution">
      <div className="lnu-contrib-inner">

        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Contribution</span>
          <h2 className="lnu-section-title">Enrichissez le registre</h2>
          <p className="lnu-section-sub">
            Chaque utilisateur peut contribuer. Le registre grandit grâce à la communauté —
            chaque profil ajouté renforce l'ensemble.
          </p>
        </div>

        <div className="lnu-contrib-actions">
          <button className="lnu-contrib-btn-pri" onClick={() => onOpenAuth('signup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Ajouter une personne
          </button>
          <button className="lnu-contrib-btn-sec" onClick={() => onOpenAuth('signup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Créer une famille
          </button>
        </div>

        <p className="lnu-contrib-note">
          Un compte gratuit suffit pour contribuer.
        </p>

      </div>
    </section>
  );
}
