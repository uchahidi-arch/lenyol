import Link from 'next/link';

const PROFILE = {
  nom: 'Mamadou Ndiaye',
  naissance: '1952 · Thiès',
  lenyol: 'Ndiaye',
  galle: 'Galle Ndiaye de Thiès',
  parents: { pere: 'Ibrahima Ndiaye', mere: 'Aïssatou Diallo' },
  enfants: 4,
  liens: ['Famille Diallo (Kaolack)', 'Famille Fall (Dakar)'],
};

export default function ProfileExample() {
  return (
    <section className="lnu-profile-ex" id="exemple-profil">
      <div className="lnu-profile-inner">

        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Exemple de profil</span>
          <h2 className="lnu-section-title">À quoi ressemble un profil</h2>
          <p className="lnu-section-sub">Chaque personne enregistrée dispose d'une fiche complète, reliée à sa lignée.</p>
        </div>

        <div className="lnu-profile-card">
          <div className="lnu-profile-header">
            <div className="lnu-profile-avatar">
              {PROFILE.nom.split(' ').map(w => w[0]).join('')}
            </div>
            <div>
              <div className="lnu-profile-name">{PROFILE.nom}</div>
              <div className="lnu-profile-meta">{PROFILE.naissance}</div>
            </div>
          </div>

          <div className="lnu-profile-fields">
            <div className="lnu-pf-row">
              <span className="lnu-pf-label">Lenyol</span>
              <span className="lnu-pf-value">{PROFILE.lenyol}</span>
            </div>
            <div className="lnu-pf-row">
              <span className="lnu-pf-label">Galle</span>
              <span className="lnu-pf-value">{PROFILE.galle}</span>
            </div>
            <div className="lnu-pf-row">
              <span className="lnu-pf-label">Père</span>
              <span className="lnu-pf-value lnu-pf-link">{PROFILE.parents.pere}</span>
            </div>
            <div className="lnu-pf-row">
              <span className="lnu-pf-label">Mère</span>
              <span className="lnu-pf-value lnu-pf-link">{PROFILE.parents.mere}</span>
            </div>
            <div className="lnu-pf-row">
              <span className="lnu-pf-label">Enfants</span>
              <span className="lnu-pf-value">{PROFILE.enfants} enregistrés</span>
            </div>
            <div className="lnu-pf-row lnu-pf-row-top">
              <span className="lnu-pf-label">Liens familles</span>
              <span className="lnu-pf-value">
                {PROFILE.liens.map(l => (
                  <span key={l} className="lnu-pf-badge">{l}</span>
                ))}
              </span>
            </div>
          </div>

          <Link href="/registre" className="lnu-profile-cta">
            Voir le profil complet →
          </Link>
        </div>

      </div>
    </section>
  );
}
