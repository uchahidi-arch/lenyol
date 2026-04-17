const CONCEPTS = [
  {
    name: 'Lenyol',
    body: 'La lignée familiale. Le clan transmis de génération en génération, qui définit l\'appartenance et l\'identité profonde — présent chez les Wolof, Sérère, Peul et toutes les ethnies du Sénégal.',
  },
  {
    name: 'Galle',
    body: 'Le nom propre du foyer familial. Il porte l\'identité de la maison et voyage avec la famille à travers les générations, ancrant chacun dans son histoire.',
  },
  {
    name: 'Ba',
    body: 'Préfixe de filiation : "Ba Diallo" signifie "de la lignée Diallo", porteurs du nom du patriarche ou de la localité d\'origine.',
  },
  {
    name: 'Localité',
    body: 'Le village ou quartier d\'origine rattaché à la famille. Un ancrage géographique essentiel à l\'identité sénégalaise, de Dakar à Saint-Louis.',
  },
];

export default function HinyaSection() {
  return (
    <section className="hinya-section" id="sect-hinya">
      <div className="hinya-inner">
        {/* Left column */}
        <div>
          <div className="h-kicker">Culture Sénégalaise</div>
          <h2 className="h-title">
            Préservez le <em>Lenyol</em><br />et le Galle
          </h2>
          <p className="h-body">
            Dans les traditions sénégalaises — wolof, sérère, peul et bien d&apos;autres —
            l&apos;identité se transmet par la lignée familiale. Le Lenyol — la filiation —
            et le Galle — le foyer familial — sont au cœur de chaque famille.
            Lenyol les préserve automatiquement à travers toutes les générations.
          </p>
          <div className="h-concepts">
            {CONCEPTS.map((c) => (
              <div key={c.name} className="h-concept">
                <div className="h-c-name">{c.name}</div>
                <p className="h-c-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — visual demo */}
        <div className="h-visual">
          <div className="tree-demo">
            <div className="td-root">
              <div className="td-node f">Fatou · Lenyol Ndiaye</div>
              <div className="td-line" />
              <div className="td-row">
                <div className="td-node m" style={{ padding: '2px 14px', fontSize: '11px' }}>Moussa</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <div className="td-node f">Aminata · Lenyol Ndiaye ✓</div>
                  <div className="td-line" />
                  <div className="td-node f" style={{ fontSize: '11px' }}>Mariama · Lenyol Ndiaye ✓</div>
                </div>
              </div>
            </div>
            <p style={{ marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Le Lenyol se propage automatiquement<br />à toutes les descendantes féminines.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
