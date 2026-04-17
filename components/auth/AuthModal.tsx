'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useAppState';

type Tab = 'login' | 'signup';

interface AuthModalProps {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
}

const REGIONS = [
  'Dakar',
  'Thiès',
  'Diourbel',
  'Fatick',
  'Kaolack',
  'Kaffrine',
  'Kolda',
  'Ziguinchor',
  'Sédhiou',
  'Tambacounda',
  'Kédougou',
  'Matam',
  'Saint-Louis',
  'Louga',
  'Touba',
];

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function friendlyError(msg: string) {
  if (!msg) return 'Erreur inconnue.';
  if (msg.includes('Invalid login')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Confirmez votre email.';
  if (msg.includes('already registered')) return 'Cet email est déjà utilisé.';
  if (msg.includes('Password should')) return 'Mot de passe trop court (8 caractères min).';
  return msg;
}

export default function AuthModal({ open, initialTab = 'login', onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const toast  = useToast();
  const router = useRouter();

  const [tab, setTab]   = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass]   = useState('');

  // Signup fields
  const [signupPrenom,   setSignupPrenom]   = useState('');
  const [signupNom,      setSignupNom]      = useState('');
  const [signupEmail,    setSignupEmail]    = useState('');
  const [signupPass,     setSignupPass]     = useState('');
  const [signupRegion,   setSignupRegion]   = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [cguAccepted,    setCguAccepted]    = useState(false);

  // Username validation
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  const checkUsername = (value: string) => {
    setSignupUsername(value);
    clearTimeout(usernameTimer.current);
    if (!value) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(value)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'ok');
    }, 400);
  };

  if (!open) return null;

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) return toast('Email et mot de passe requis.', 'error');
    setLoading(true);
    const error = await signIn(loginEmail, loginPass);
    setLoading(false);
    if (error) { toast(friendlyError(error), 'error'); return; }
    toast('Connexion réussie !', 'success');
    onClose();
  };

  const handleSignup = async () => {
    if (!signupPrenom || !signupEmail || !signupPass)
      return toast('Prénom, email et mot de passe requis.', 'error');
    if (signupPass.length < 8)
      return toast('Mot de passe trop court (8 caractères min).', 'error');
    if (!signupUsername || !USERNAME_REGEX.test(signupUsername))
      return toast('Pseudo invalide (3-20 car., lettres/chiffres/_).', 'error');
    if (usernameStatus === 'taken')
      return toast('Ce pseudo est déjà utilisé.', 'error');
    if (usernameStatus === 'checking')
      return toast('Vérification du pseudo en cours…', 'error');
    if (!cguAccepted)
      return toast('Vous devez accepter les conditions pour continuer.', 'error');

    setLoading(true);
    const error = await signUp(signupEmail, signupPass, {
      prenom: signupPrenom,
      nom: signupNom,
      region: signupRegion,
      username: signupUsername,
      cgu_accepted: true,
    });
    setLoading(false);
    if (error) { toast(friendlyError(error), 'error'); return; }
    onClose();
    router.push('/bienvenue');
  };

  return (
    <div className={`m-back${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' on' : ''}`} onClick={() => setTab('login')}>
            Se connecter
          </button>
          <button className={`auth-tab${tab === 'signup' ? ' on' : ''}`} onClick={() => setTab('signup')}>
            Créer un compte
          </button>
        </div>

        {/* Login */}
        {tab === 'login' && (
          <div className="m-body">
            <div className="auth-title">Bon retour !</div>
            <div className="auth-sub">Connectez-vous à votre arbre</div>
            <div className="f-row">
              <label className="f-lbl">Email *</label>
              <input
                className="f-input" type="email" placeholder="vous@email.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="f-row">
              <label className="f-lbl">Mot de passe *</label>
              <input
                className="f-input" type="password" placeholder="••••••••"
                value={loginPass} onChange={e => setLoginPass(e.target.value)}
                autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              className="btn btn-pri"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', marginTop: '4px' }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: 'var(--t3)' }}>
              Pas encore de compte ?{' '}
              <span onClick={() => setTab('signup')} style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }}>
                Créer un compte
              </span>
            </div>
          </div>
        )}

        {/* Signup */}
        {tab === 'signup' && (
          <div className="m-body">
            <div className="auth-title">Bienvenue !</div>
            <div className="auth-sub">Créez votre compte gratuitement</div>

            {/* Pseudo */}
            <div className="f-row">
              <label className="f-lbl">Pseudo * <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(3-20 car., lettres/chiffres/_)</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="f-input"
                  placeholder="adjchahidi…"
                  value={signupUsername}
                  onChange={e => checkUsername(e.target.value)}
                  style={{
                    paddingRight: '32px',
                    borderColor: usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? '#e53e3e'
                      : usernameStatus === 'ok' ? 'var(--green)' : undefined,
                  }}
                />
                {usernameStatus === 'checking' && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    <div className="spin" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  </span>
                )}
                {usernameStatus === 'ok' && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', fontSize: '14px' }}>✓</span>
                )}
              </div>
              {usernameStatus === 'taken' && (
                <div style={{ fontSize: '11px', color: '#e53e3e', marginTop: '3px' }}>Ce pseudo est déjà utilisé.</div>
              )}
              {usernameStatus === 'invalid' && signupUsername.length > 0 && (
                <div style={{ fontSize: '11px', color: '#e53e3e', marginTop: '3px' }}>3-20 caractères, lettres, chiffres et _ uniquement.</div>
              )}
            </div>

            {/* Prénom / Nom */}
            <div className="f-row-2">
              <div>
                <label className="f-lbl">Prénom *</label>
                <input className="f-input" placeholder="Ali…" value={signupPrenom} onChange={e => setSignupPrenom(e.target.value)} />
              </div>
              <div>
                <label className="f-lbl">Nom</label>
                <input className="f-input" placeholder="HASSANI…" value={signupNom} onChange={e => setSignupNom(e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div className="f-row">
              <label className="f-lbl">Email *</label>
              <input
                className="f-input" type="email" placeholder="vous@email.com"
                value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div className="f-row">
              <label className="f-lbl">Mot de passe * (8 car. min)</label>
              <input
                className="f-input" type="password" placeholder="••••••••"
                value={signupPass} onChange={e => setSignupPass(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Région */}
            <div className="f-row">
              <label className="f-lbl">Région d&apos;origine</label>
              <select className="f-sel" value={signupRegion} onChange={e => setSignupRegion(e.target.value)}>
                <option value="">— Choisir —</option>
                {REGIONS.map(region => <option key={region}>{region}</option>)}
              </select>
            </div>

            {/* CGU */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px',
              background: cguAccepted ? 'rgba(45,106,79,0.06)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${cguAccepted ? 'var(--green-bd)' : 'var(--bd)'}`,
              borderRadius: '10px',
              marginBottom: '4px',
              cursor: 'pointer',
            }} onClick={() => setCguAccepted(v => !v)}>
              <input
                type="checkbox"
                checked={cguAccepted}
                onChange={e => { e.stopPropagation(); setCguAccepted(e.target.checked); }}
                style={{ marginTop: '1px', flexShrink: 0, accentColor: 'var(--green)', width: '15px', height: '15px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5 }}>
                J&apos;accepte les{' '}
                <Link
                  href="/confidentialite"
                  target="_blank"
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}
                >
                  conditions d&apos;utilisation et la politique de confidentialité
                </Link>
              </span>
            </div>

            {/* Bouton */}
            <button
              className="btn btn-pri"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', marginTop: '8px' }}
              onClick={handleSignup}
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
            >
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: 'var(--t3)' }}>
              Déjà un compte ?{' '}
              <span onClick={() => setTab('login')} style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }}>
                Se connecter
              </span>
            </div>
          </div>
        )}

        <div className="auth-foot">
          Vos données vous appartiennent ·{' '}
          <Link href="/confidentialite" target="_blank" style={{ color: 'var(--green)', textDecoration: 'none' }}>
            Confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
