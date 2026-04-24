'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useAppState';
import { useDB } from '@/hooks/useDB';
import PhotoUpload from '@/components/PhotoUpload';
import { deleteUserAccount } from '@/app/actions/deleteAccount';
import type { Tree } from '@/lib/types';

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
  const { fetchUserTrees, createPrivateTree, state } = useDB();
  const toast  = useToast();
  const router = useRouter();

  const [newUsername,    setNewUsername]    = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [editing,        setEditing]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Arbres
  const [trees, setTrees]               = useState<Tree[]>([]);
  const [treesLoaded, setTreesLoaded]   = useState(false);
  const [newTreeName, setNewTreeName]   = useState('');
  const [showNewTree, setShowNewTree]   = useState(false);
  const [creatingTree, setCreatingTree] = useState(false);
  const [personCounts, setPersonCounts] = useState<Record<string, number>>({});

  // Champs identité modifiables
  const [infoPrenom,  setInfoPrenom]  = useState('');
  const [infoNom,     setInfoNom]     = useState('');
  const [infoRegion,  setInfoRegion]  = useState('');
  const [savingInfo,  setSavingInfo]  = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Mode Héritage
  const [gardienNom,      setGardienNom]      = useState('');
  const [gardienEmail,    setGardienEmail]    = useState('');
  const [heritageMessage, setHeritageMessage] = useState('');
  const [savingHeritage,  setSavingHeritage]  = useState(false);
  const [heritageSuccess, setHeritageSuccess] = useState(false);
  const [editingHeritage, setEditingHeritage] = useState(false);

  // Charge les arbres de l'utilisateur
  useEffect(() => {
    if (!user) return;
    fetchUserTrees().then(async (list) => {
      setTrees(list);
      setTreesLoaded(true);
      // Compte les personnes par arbre
      const counts: Record<string, number> = {};
      for (const t of list) {
        const { count } = await supabase
          .from('persons')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('tree_id', t.id);
        counts[t.id] = count ?? 0;
      }
      setPersonCounts(counts);
    });
  }, [user]);

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
      setGardienNom(data?.gardien_nom || '');
      setGardienEmail(data?.gardien_email || '');
      setHeritageMessage(data?.heritage_message || '');
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
      region: infoRegion || null,
    });
    setSavingInfo(false);
    if (error) { toast(error, 'error'); return; }
    setInfoSuccess(true);
    setTimeout(() => setInfoSuccess(false), 3000);
  };

  const handleSaveHeritage = async () => {
    if (!user) return;
    setSavingHeritage(true);
    setHeritageSuccess(false);
    const { error } = await supabase
      .from('profiles')
      .update({
        gardien_nom:      gardienNom.trim() || null,
        gardien_email:    gardienEmail.trim() || null,
        heritage_message: heritageMessage.trim() || null,
      })
      .eq('id', user.id);
    setSavingHeritage(false);
    if (error) { toast(error.message, 'error'); return; }
    setHeritageSuccess(true);
    setEditingHeritage(false);
    setTimeout(() => setHeritageSuccess(false), 3000);
  };

  const handlePhotoUpload = async (newUrl: string) => {
    const error = await updateProfile({ photo_url: newUrl });
    if (error) {
      toast(error, 'error');
    } else {
      toast('Photo mise à jour !', 'success');
    }
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

  const handleCreateTree = async () => {
    if (!newTreeName.trim()) return;
    setCreatingTree(true);
    try {
      await createPrivateTree(newTreeName.trim());
      const list = await fetchUserTrees();
      setTrees(list);
      setNewTreeName('');
      setShowNewTree(false);
    } catch (err: any) {
      toast(err.message || 'Erreur lors de la création', 'error');
    }
    setCreatingTree(false);
  };

  const card: React.CSSProperties = {
    background: 'var(--warm)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--bd)',
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
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '116px 24px 60px' }}>

      {/* ── En-tête ────────────────────────────────────── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <PhotoUpload
          currentPhotoUrl={profile?.photo_url}
          bucketPath={`profile/${user?.id}.jpg`}
          onUpload={handlePhotoUpload}
          onError={(err) => toast(err, 'error')}
        >
          <div className="pc-av M" style={{ width: '72px', height: '72px', fontSize: '26px', flexShrink: 0 }}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Photo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>
        </PhotoUpload>
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

      {/* ── Mes Arbres ─────────────────────────────────── */}
      <div style={card}>
        <div style={sectionLabel}>Mes Arbres</div>

        {!treesLoaded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 13 }}>
            <div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Chargement…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {trees.map((tree, idx) => (
              <div key={tree.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--bd)',
                background: tree.prive ? 'rgba(45,106,79,0.04)' : 'var(--bg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tree.prive ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{tree.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                      {tree.prive ? 'Privé' : 'Public'} · {personCounts[tree.id] ?? '…'} personne{(personCounts[tree.id] ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {showNewTree ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  className="f-input"
                  value={newTreeName}
                  onChange={e => setNewTreeName(e.target.value)}
                  placeholder="Nom de l'arbre privé…"
                  style={{ fontSize: 13 }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateTree(); if (e.key === 'Escape') { setShowNewTree(false); setNewTreeName(''); } }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-pri"
                    style={{ fontSize: 12 }}
                    onClick={handleCreateTree}
                    disabled={creatingTree || !newTreeName.trim()}
                  >
                    {creatingTree ? 'Création…' : 'Créer'}
                  </button>
                  <button
                    className="btn btn-sec"
                    style={{ fontSize: 12 }}
                    onClick={() => { setShowNewTree(false); setNewTreeName(''); }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-sec"
                style={{ fontSize: 12, alignSelf: 'flex-start' }}
                onClick={() => setShowNewTree(true)}
              >
                + Créer un arbre privé
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Mode Héritage ──────────────────────────────── */}
      <div style={{
        ...card,
        border: '1.5px solid #2d6a4f',
        background: 'rgba(45,106,79,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <div style={{ ...sectionLabel, marginBottom: 0, color: '#2d6a4f' }}>Mode Héritage</div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '20px', lineHeight: 1.6 }}>
          Désignez une personne de confiance qui aura accès à votre compte et vos données familiales après vous.
        </div>

        {/* Gardien déjà défini et pas en mode édition */}
        {gardienNom && !editingHeritage ? (
          <div>
            <div style={{
              background: 'rgba(45,106,79,0.07)',
              border: '1px solid rgba(45,106,79,0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '14px',
            }}>
              <div style={{ fontSize: '12px', color: '#2d6a4f', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Votre gardien actuel
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>{gardienNom}</div>
              {gardienEmail && (
                <div style={{ fontSize: '13px', color: 'var(--t3)', marginTop: '2px' }}>{gardienEmail}</div>
              )}
              {heritageMessage && (
                <div style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '8px', fontStyle: 'italic', lineHeight: 1.5, borderTop: '1px solid rgba(45,106,79,0.15)', paddingTop: '8px' }}>
                  "{heritageMessage}"
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-sec"
                style={{ fontSize: '12px', borderColor: 'rgba(45,106,79,0.3)', color: '#2d6a4f' }}
                onClick={() => setEditingHeritage(true)}
              >
                Modifier
              </button>
              {heritageSuccess && (
                <span style={{ fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>Enregistré ✓</span>
              )}
            </div>
          </div>
        ) : (
          /* Formulaire */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Nom du gardien</div>
              <input
                className="f-input"
                value={gardienNom}
                onChange={e => setGardienNom(e.target.value)}
                placeholder="Nom du gardien"
                style={{ fontSize: '14px' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Email du gardien</div>
              <input
                className="f-input"
                type="email"
                value={gardienEmail}
                onChange={e => setGardienEmail(e.target.value)}
                placeholder="Email du gardien"
                style={{ fontSize: '14px' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>Message d'héritage</div>
              <textarea
                className="f-input"
                value={heritageMessage}
                onChange={e => setHeritageMessage(e.target.value)}
                placeholder="Message à transmettre à votre gardien…"
                rows={4}
                style={{ fontSize: '13px', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-pri"
                style={{ fontSize: '12px', background: '#2d6a4f', borderColor: '#2d6a4f' }}
                onClick={handleSaveHeritage}
                disabled={savingHeritage}
              >
                {savingHeritage ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              {editingHeritage && (
                <button
                  className="btn btn-sec"
                  style={{ fontSize: '12px' }}
                  onClick={() => setEditingHeritage(false)}
                >
                  Annuler
                </button>
              )}
              {heritageSuccess && (
                <span style={{ fontSize: '13px', color: '#2d6a4f', fontWeight: 600 }}>Enregistré ✓</span>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(45,106,79,0.12)', fontSize: '11px', color: 'var(--t3)', lineHeight: 1.5 }}>
          Ces informations sont privées et sécurisées. Votre gardien sera notifié par email.
        </div>
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
                Êtes-vous sûr ? Cette action est irréversible. Toutes vos données (arbre, fiches, unions) seront supprimées définitivement.
              </div>
              {deleteError && (
                <div style={{ fontSize: '12px', color: '#c53030', marginBottom: '8px' }}>{deleteError}</div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setDeleting(true);
                    setDeleteError(null);
                    const result = await deleteUserAccount(user.id);
                    if (result.success) {
                      await signOut();
                      router.push('/');
                    } else {
                      setDeleteError(result.error || 'Erreur lors de la suppression');
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  style={{
                    fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
                    background: '#c53030', color: 'white', border: 'none',
                    fontWeight: 600, display: 'inline-block', cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? 'Suppression...' : 'Confirmer'}
                </button>
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
