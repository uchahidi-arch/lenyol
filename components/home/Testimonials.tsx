const TESTIMONIALS = [
  {
    quote: 'Enfin un outil pensé pour nous. J\'ai pu retrouver la lignée de ma grand-mère et remonter jusqu\'à l\'arrière-arrière-grand-père.',
    name: 'Aminata D.',
    origin: 'Dakar, Médina',
    genre: 'F',
  },
  {
    quote: 'Le Lenyol se propage tout seul. C\'est magique — plus besoin de tout réécrire pour chaque naissance.',
    name: 'Moussa B.',
    origin: 'Saint-Louis, Guet Ndar',
    genre: 'M',
  },
  {
    quote: 'J\'habite en France depuis 20 ans. Grâce à Lenyol, mes enfants connaissent enfin leur Galle et leur village d\'origine.',
    name: 'Rokhaya N.',
    origin: 'Diaspora · Paris',
    genre: 'F',
  },
];

export default function Testimonials() {
  return (
    <section className="home-section" style={{ background: 'var(--warm)' }}>
      <div className="home-inner">
        <div className="s-kicker">Témoignages</div>
        <h2 className="s-title">
          Ce que disent<br /><em>les familles</em>
        </h2>
        <div className="proof-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="proof-card">
              <p className="proof-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="proof-author">
                <div className={`proof-av ${t.genre}`}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="proof-name">{t.name}</div>
                  <div className="proof-origin">{t.origin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
