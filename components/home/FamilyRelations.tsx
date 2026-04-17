const LINKS = [
  { a: 'Famille Ndiaye', b: 'Famille Diallo', type: 'Alliance' },
  { a: 'Famille Fall',   b: 'Famille Sow',   type: 'Lignée maternelle' },
  { a: 'Famille Diop',   b: 'Famille Kane',  type: 'Origine commune' },
];

export default function FamilyRelations() {
  return (
    <section className="lnu-relations" id="relations">
      <div className="lnu-relations-inner">

        <div className="lnu-section-hd">
          <span className="lnu-eyebrow">Relations entre familles</span>
          <h2 className="lnu-section-title">Les familles se relient entre elles</h2>
          <p className="lnu-section-sub">
            Lenyol permet de relier des familles lorsque des liens sont confirmés par les deux parties.
            Alliances, origines communes, lignées maternelles — tout est documenté.
          </p>
        </div>

        <div className="lnu-rel-layout">
          <div className="lnu-rel-schema">
            {LINKS.map((l, i) => (
              <div key={i} className="lnu-rel-row">
                <span className="lnu-rel-node">{l.a}</span>
                <span className="lnu-rel-connector">
                  <span className="lnu-rel-line" />
                  <span className="lnu-rel-type">{l.type}</span>
                  <span className="lnu-rel-line" />
                </span>
                <span className="lnu-rel-node">{l.b}</span>
              </div>
            ))}
          </div>

          <div className="lnu-rel-info">
            <div className="lnu-rel-info-item">
              <span className="lnu-rel-info-ico">✓</span>
              <span>Chaque lien est validé par les deux familles concernées</span>
            </div>
            <div className="lnu-rel-info-item">
              <span className="lnu-rel-info-ico">✓</span>
              <span>Les types de liens sont précis : alliance, lignée, origine</span>
            </div>
            <div className="lnu-rel-info-item">
              <span className="lnu-rel-info-ico">✓</span>
              <span>Toute connexion peut être refusée ou révoquée</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
