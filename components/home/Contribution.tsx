interface ContributionProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
  isLoggedIn?: boolean;
  onGoToTree?: () => void;
}

export default function Contribution({ onOpenAuth, isLoggedIn, onGoToTree }: ContributionProps) {
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
          <button className="lnu-contrib-btn-pri" onClick={() => isLoggedIn ? onGoToTree?.() : onOpenAuth('signup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Ajouter une personne
          </button>
          <button className="lnu-contrib-btn-sec" onClick={() => isLoggedIn ? onGoToTree?.() : onOpenAuth('signup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v7"/><path d="M12 10c-2.5 0-5 1.5-5 4v4"/><path d="M12 10c2.5 0 5 1.5 5 4v4"/>
              <circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><circle cx="12" cy="3" r="2"/>
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
