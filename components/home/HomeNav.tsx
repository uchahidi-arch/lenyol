'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface HomeNavProps {
  onNavigateToApp: () => void;
  onOpenAuth: (tab: 'login' | 'signup') => void;
}

const SEARCH_CATS = ['Famille', 'Personne', 'Histoire', 'Royaume'];

export default function HomeNav({ onNavigateToApp, onOpenAuth }: HomeNavProps) {
  const { user, profile, signOut } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const isHome   = pathname === '/';

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [arbreOpen,    setArbreOpen]    = useState(false);
  const [racinesOpen,  setRacinesOpen]  = useState(false);
  const [userOpen,     setUserOpen]     = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [activeCat,    setActiveCat]    = useState('Famille');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (mobileOpen || searchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setArbreOpen(false); setRacinesOpen(false); setUserOpen(false); }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const displayName = profile
    ? [profile.prenom, profile.nom].filter(Boolean).join(' ')
    : user?.email?.split('@')[0] || '?';
  const initial   = displayName[0]?.toUpperCase() || '?';
  const firstName = displayName.split(' ')[0];

  const goHome = () => {
    setMobileOpen(false);
    if (isHome) window.scrollTo({ top: 0, behavior: 'smooth' });
    else router.push('/');
  };

  const close = () => {
    setMobileOpen(false);
    setArbreOpen(false);
    setRacinesOpen(false);
    setUserOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      setSearchOpen(false);
      router.push(`/registre?q=${encodeURIComponent(searchQ)}&cat=${activeCat}`);
    }
  };

  return (
    <>
      <nav className={`ln-nav${scrolled ? ' scrolled' : ''}`}>

        {/* Logo */}
        <button className="ln-logo" onClick={goHome}>Lenyol</button>

        {/* Desktop links */}
        <div className="ln-nav-center">

          {/* Arbre */}
          <div className="ln-link-wrap" onMouseEnter={() => setArbreOpen(true)} onMouseLeave={() => setArbreOpen(false)}>
            <button className="ln-link" onClick={() => setArbreOpen(v => !v)}>
              Arbre
              <svg className="ln-link-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className={`ln-dropdown${arbreOpen ? ' open' : ''}`}>
              <button className="ln-dd-item" onClick={() => { close(); router.push('/monarbre'); }}>Mon Arbre</button>
              <button className="ln-dd-item" onClick={() => { close(); onOpenAuth('signup'); }}>Créer un arbre</button>
              <div className="ln-dd-sep" />
              <button className="ln-dd-item" onClick={() => { close(); onNavigateToApp(); }}>Explorer le registre</button>
            </div>
          </div>

          {/* Racines */}
          <div className="ln-link-wrap" onMouseEnter={() => setRacinesOpen(true)} onMouseLeave={() => setRacinesOpen(false)}>
            <button className="ln-link" onClick={() => setRacinesOpen(v => !v)}>
              Racines
              <svg className="ln-link-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className={`ln-dropdown${racinesOpen ? ' open' : ''}`}>
              <div className="ln-dd-label">Explorer</div>
              <button className="ln-dd-item" onClick={() => { close(); router.push('/registre/lenyol'); }}>Lignées</button>
              <button className="ln-dd-item" onClick={() => { close(); onNavigateToApp(); }}>Royaumes</button>
              <button className="ln-dd-item" onClick={() => { close(); onNavigateToApp(); }}>Ethnies</button>
              <div className="ln-dd-sep" />
              <button className="ln-dd-item" onClick={() => { close(); onNavigateToApp(); }}>Noms de familles</button>
            </div>
          </div>

          {/* Griot */}
          <Link href="/chroniques" className="ln-link" onClick={close}>Griot</Link>

          {/* Rechercher */}
          <button className="ln-link" onClick={() => setSearchOpen(true)}>Rechercher</button>
        </div>

        {/* Right actions */}
        <div className="ln-actions">
          <button
            className="ln-search-icon-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {!user ? (
            <>
              <button className="ln-btn-login" onClick={() => onOpenAuth('login')}>Se connecter</button>
              <button className="ln-btn-subscribe" onClick={() => onOpenAuth('signup')}>S'abonner</button>
            </>
          ) : (
            <div className="ln-link-wrap" style={{ position: 'relative' }}>
              <div className="ln-user-chip" onClick={() => setUserOpen(v => !v)}>
                <span>{initial}</span>
                <span>{firstName}</span>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div className={`ln-user-dd${userOpen ? ' open' : ''}`}>
                <button className="ln-dd-item" onClick={() => { setUserOpen(false); router.push('/monarbre'); }}>Mon Arbre</button>
                <button className="ln-dd-item" onClick={() => { setUserOpen(false); router.push('/profil'); }}>Profil</button>
                <div className="ln-dd-sep" />
                <button className="ln-dd-item" style={{ color: '#c0392b' }} onClick={() => { signOut(); setUserOpen(false); }}>Déconnexion</button>
              </div>
            </div>
          )}

          {/* Burger */}
          <button className="ln-burger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen
              ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="ln-mobile-menu">
          <button className="ln-mm-link" onClick={() => { close(); router.push('/monarbre'); }}>Mon Arbre</button>
          <button className="ln-mm-link" onClick={() => { close(); onNavigateToApp(); }}>Registre</button>
          <button className="ln-mm-link" onClick={() => { close(); router.push('/registre/lenyol'); }}>Lignées</button>
          <Link href="/chroniques" className="ln-mm-link" onClick={close}>Griot</Link>
          <button className="ln-mm-link" onClick={() => { setMobileOpen(false); setSearchOpen(true); }}>Rechercher</button>
          <div className="ln-mm-divider" />
          <div className="ln-mm-auth">
            {!user ? (
              <>
                <button className="ln-mm-btn-s" onClick={() => { close(); onOpenAuth('login'); }}>Se connecter</button>
                <button className="ln-mm-btn-p" onClick={() => { close(); onOpenAuth('signup'); }}>S'abonner</button>
              </>
            ) : (
              <>
                <button className="ln-mm-btn-s" onClick={() => { close(); router.push('/profil'); }}>Mon profil</button>
                <button className="ln-mm-btn-s" onClick={() => { signOut(); close(); }}>Déconnexion</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search overlay */}
      <div className={`ln-search-overlay${searchOpen ? ' open' : ''}`}>
        <button className="ln-so-close" onClick={() => setSearchOpen(false)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <p className="ln-so-label">Que cherchez-vous ?</p>
        <form onSubmit={handleSearch} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="ln-so-bar">
            <input
              ref={searchInputRef}
              className="ln-so-input"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={`Chercher une ${activeCat.toLowerCase()}…`}
            />
            <button type="submit" className="ln-so-submit">Chercher</button>
          </div>
          <div className="ln-so-cats">
            {SEARCH_CATS.map(cat => (
              <button
                key={cat}
                type="button"
                className={`ln-so-cat${activeCat === cat ? ' on' : ''}`}
                onClick={() => setActiveCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </form>
      </div>
    </>
  );
}
