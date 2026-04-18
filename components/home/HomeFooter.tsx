import Link from 'next/link';

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="ln-footer">
      <div className="ln-footer-grid">

        {/* Col 1 — Brand */}
        <div>
          <div className="ln-footer-logo">Lenyol</div>
          <p className="ln-footer-tagline">
            Préservez votre lignée. Transmettez votre histoire.
            La mémoire généalogique sénégalaise, pour les générations à venir.
          </p>
        </div>

        {/* Col 2 — Plateforme */}
        <div>
          <div className="ln-footer-col-title">Plateforme</div>
          <div className="ln-footer-links">
            <Link href="/monarbre" className="ln-footer-link">Mon Arbre</Link>
            <Link href="/registre" className="ln-footer-link">Registre</Link>
            <Link href="/chroniques" className="ln-footer-link">Griot & Racines</Link>
          </div>
        </div>

        {/* Col 3 — Légal */}
        <div>
          <div className="ln-footer-col-title">Informations</div>
          <div className="ln-footer-links">
            <Link href="/about" className="ln-footer-link">À propos</Link>
            <Link href="/confidentialite" className="ln-footer-link">Confidentialité</Link>
            <Link href="/bienvenue" className="ln-footer-link">Comment ça marche</Link>
          </div>
        </div>

      </div>

      <div className="ln-footer-bottom">
        <span>© {year} Lenyol · Développé par <a href="https://u-data.fr" target="_blank" rel="noopener noreferrer">U-Data</a></span>
        <Link href="/confidentialite" className="">Politique de confidentialité</Link>
      </div>
    </footer>
  );
}
