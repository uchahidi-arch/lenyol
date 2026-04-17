import Link from 'next/link';

interface FinalCTAProps {
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

export default function FinalCTA({ onOpenAuth }: FinalCTAProps) {
  return (
    <section className="lnu-final-cta" id="commencer">
      <div className="lnu-final-cta-inner">
        <h2 className="lnu-final-title">Commencer maintenant</h2>
        <p className="lnu-final-sub">Rejoignez le registre des familles sénégalaises. Gratuit, sans engagement.</p>
        <div className="lnu-final-btns">
          <button className="lnu-final-btn-pri" onClick={() => onOpenAuth('signup')}>
            Créer un compte
          </button>
          <Link href="/registre" className="lnu-final-btn-sec">
            Explorer le registre
          </Link>
        </div>
      </div>
    </section>
  );
}
