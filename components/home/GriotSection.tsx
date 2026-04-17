import Link from 'next/link';

export default function GriotSection() {
  return (
    <section className="lng-section" id="sect-griot">

      <div className="lng-bg-orbs">
        <div className="lng-orb lng-orb-1" />
        <div className="lng-orb lng-orb-2" />
      </div>

      <div className="lng-inner">
        <span className="lng-eyebrow">Le Griot Numérique</span>

        <h2 className="lng-title">
          Votre histoire mérite<br />d'être racontée.
        </h2>

        <p className="lng-body">
Inspiré du rôle du griot, Lenyol vous permet de générer, écrire et partager les chroniques de votre famille, afin de préserver votre mémoire sur le long terme.
        </p>

        <Link href="/griot" className="lng-cta lng-cta--lg">
          Découvrir le Griot
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>

    </section>
  );
}
