'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useAppState';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const REGION_OPTIONS = [
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
  'Diaspora',
] as const;

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfilPage() {
  const { user, profile, loading, signOut, updateUsername, updateProfile } = useAuth();
  const toast  = useToast();
  const router = useRouter();

  const [newUsername,    setNewUsername]    = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [editing,        setEditing]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Champs identité modifiables
  const [infoPrenom,  setInfoPrenom]  = useState('');
  const [infoNom,     setInfoNom]     = useState('');
  const [infoRegion,  setInfoRegion]  = useState('');
  const [savingInfo,  setSavingInfo]  = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Initialise les champs depuis le profil chargé
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setInfoPrenom(data?.prenom || '');
      setInfoNom(data?.nom || '');
      setInfoRegion(data?.ile || '');
    })();
  }, [user]);

  // Spinner pendant l'hydratation
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div className="spin" />
      </div>
    );
  }

  const displayUsername = profile?.username || user?.email?.split('@')[0] || '?';
  const initial = displayUsername[0]?.toUpperCase() || '?';

  const checkUsername = (value: string) => {
    setNewUsername(value);
    clearTimeout(usernameTimer.current);
    if (!value) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(value)) { setUsernameStatus('invalid'); return; }
    if (value === profile?.username) { setUsernameStatus('ok'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', value)
        .neq('id', user!.id)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'ok');
    }, 400);
  };

  const handleSaveInfo = async () => {
    if (!infoPrenom.trim()) return;
    setSavingInfo(true);
    setInfoSuccess(false);
    const error = await updateProfile({
      prenom: infoPrenom.trim(),
      nom:    infoNom.trim() || null,
      ile:    infoRegion || null,
    });
    setSavingInfo(false);
    if (error) { toast(error, 'error'); return; }
    setInfoSuccess(true);
    setTimeout(() => setInfoSuccess(false), 3000);
  };

  const handleSaveUsername = async () => {
    if (!newUsername || usernameStatus !== 'ok') return;
    setSaving(true);
    const error = await updateUsername(newUsername);
    setSaving(false);
    if (error) { toast(error, 'error'); return; }
    toast('Pseudo mis à jour !', 'success');
    setEditing(false);
    setNewUsername('');
    setUsernameStatus('idle');
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.75)',
    borderRadius: '20px',
    padding: '28px 32px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(20,18,13,0.08)',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.1em',
    color: 'var(--t3)',
    marginBottom: '18px',
  };

  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    marginBottom: '14px',
  };

  const rowLast: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  };

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '40px 24px 60px' }}>

      {/* ── En-tête ────────────────────────────────────── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="pc-av M" style={{ width: '72px', height: '72px', fontSize: '26px', flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--t1)', lineHeight: 1.2 }}>
            {[profile?.prenom, profile?.nom].filter(Boolean).join(' ') || displayUsername}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600, marginTop: '4px' }}>
            @{displayUsername}
          </div>
          {user?.email && (
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
        </div>
      </div>

      {/* ── Informations ───────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>Informations</div>

        {/* Prénom */}
        <div style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Prénom *</div>
            <input
              className="f-input"
              value={infoPrenom}
              onChange={e => setInfoPrenom(e.target.value)}
              placeholder="Ajouter votre prénom"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Nom */}
        <div style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Nom</div>
            <input
              className="f-input"
              value={infoNom}
              onChange={e => setInfoNom(e.target.value)}
              placeholder="Ajouter votre nom"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Email */}
        <div style={row}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '2px' }}>Email</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>{user?.email || '—'}</div>
          </div>
          <span style={{ fontSize: '10px', background: 'var(--bd)', borderRadius: '6px', padding: '2px 7px', color: 'var(--t3)', flexShrink: 0 }}>
            lecture seule
          </span>
        </div>

        {/* Région */}
        <div style={row}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Région d'origine</div>
            <select
              className="f-input"
              value={infoRegion}
              onChange={e => setInfoRegion(e.target.value)}
              style={{ fontSize: '14px' }}
            >
              <option value="">— Sélectionner une région —</option>
              {REGION_OPTIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Enregistrer informations */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-pri"
              style={{ fontSize: '12px' }}
              onClick={handleSaveInfo}
              disabled={savingInfo || !infoPrenom.trim()}
            >
              {savingInfo ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
            {infoSuccess && (
              <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>
                Profil mis à jour ✓
              </span>
            )}
          </div>
        </div>

        {/* CGU */}
        <div style={rowLast}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '2px' }}>Conditions acceptées</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: profile?.cgu_accepted ? 'var(--green)' : 'var(--t3)' }}>
              {profile?.cgu_accepted
                ? `✓ ${formatDate(profile.cgu_accepted_at) || 'Oui'}`
                : '—'}
            </div>
          </div>
          <a
            href="/confidentialite"
            target="_blank"
            style={{ fontSize: '12px', color: 'var(--green)', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}
          >
            Politique →
          </a>
        </div>
      </div>

      {/* ── Pseudo ─────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>Modifier mon pseudo</div>

        {!editing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)' }}>@{displayUsername}</div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '3px' }}>
                Affiché publiquement dans le registre des créateurs
              </div>
            </div>
            <button
              className="btn btn-sec"
              style={{ fontSize: '12px', flexShrink: 0 }}
              onClick={() => { setEditing(true); setNewUsername(displayUsername); checkUsername(displayUsername); }}
            >
              Modifier
            </button>
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative', marginBottom: '6px' }}>
              <input
                className="f-input"
                value={newUsername}
                onChange={e => checkUsername(e.target.value)}
                placeholder="nouveau_pseudo"
                style={{
                  paddingRight: '32px',
                  borderColor: usernameStatus === 'taken' || usernameStatus === 'invalid'
                    ? '#e53e3e'
                    : usernameStatus === 'ok' ? 'var(--green)' : undefined,
                }}
                autoFocus
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
              <div style={{ fontSize: '11px', color: '#e53e3e', marginBottom: '6px' }}>Ce pseudo est déjà utilisé.</div>
            )}
            {usernameStatus === 'invalid' && newUsername.length > 0 && (
              <div style={{ fontSize: '11px', color: '#e53e3e', marginBottom: '6px' }}>3-20 caractères, lettres, chiffres et _ uniquement.</div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                className="btn btn-pri"
                style={{ fontSize: '12px' }}
                onClick={handleSaveUsername}
                disabled={saving || usernameStatus !== 'ok'}
              >
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </button>
              <button
                className="btn btn-sec"
                style={{ fontSize: '12px' }}
                onClick={() => { setEditing(false); setNewUsername(''); setUsernameStatus('idle'); }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Compte ─────────────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>Compte</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Déconnexion */}
          <div style={row}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Se déconnecter</div>
              <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Vous serez redirigé vers l'accueil</div>
            </div>
            <button
              className="btn btn-sec"
              style={{ fontSize: '12px', flexShrink: 0 }}
              onClick={async () => { await signOut(); router.push('/'); }}
            >
              Déconnexion
            </button>
          </div>

          {/* Supprimer mon compte */}
          {!confirmDelete ? (
            <div style={rowLast}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#c53030' }}>Supprimer mon compte</div>
                <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Suppression définitive de vos données</div>
              </div>
              <button
                className="btn btn-sec"
                style={{ fontSize: '12px', flexShrink: 0, borderColor: '#fed7d7', color: '#c53030' }}
                onClick={() => setConfirmDelete(true)}
              >
                Supprimer
              </button>
            </div>
          ) : (
            <div style={{
              background: 'rgba(197,48,48,0.05)',
              border: '1px solid #fed7d7',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#c53030', marginBottom: '6px' }}>
                Confirmer la suppression ?
              </div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '12px', lineHeight: 1.5 }}>
                Cette action est irréversible. Toutes vos données (arbre, fiches, unions) seront supprimées définitivement.
                Envoyez une demande par email pour confirmer.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`mailto:contact@lenyol.com?subject=Suppression%20de%20compte&body=Bonjour%2C%0A%0AJe%20souhaite%20supprimer%20mon%20compte%20Lenyol.%0AEmail%20%3A%20${encodeURIComponent(user?.email || '')}`}
                  style={{
                    fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                    background: '#c53030', color: 'white', textDecoration: 'none',
                    fontWeight: 600, display: 'inline-block',
                  }}
                >
                  Envoyer la demande
                </a>
                <button
                  className="btn btn-sec"
                  style={{ fontSize: '12px' }}
                  onClick={() => setConfirmDelete(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
