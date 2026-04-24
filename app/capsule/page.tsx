'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Capsule } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateFR(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function countdown(revealDate: string): string {
  const now = new Date();
  const reveal = new Date(revealDate);
  let years = reveal.getFullYear() - now.getFullYear();
  let months = reveal.getMonth() - now.getMonth();
  const days = reveal.getDate() - now.getDate();
  if (days < 0) months--;
  if (months < 0) { years--; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mois`);
  if (parts.length > 0) return parts.join(' et ');
  const diffDays = Math.ceil((reveal.getTime() - now.getTime()) / 86400000);
  if (diffDays > 0) return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return 'bientôt';
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px', fontWeight: 600, color: 'var(--t1)',
};

const hintStyle: React.CSSProperties = {
  margin: '-2px 0 8px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '12px', color: 'var(--t3)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid var(--bd)', background: 'var(--bg)',
  fontSize: '14px', fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: 'var(--t1)', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.12s',
};

// ── Sealed Card ───────────────────────────────────────────────────────────────

function SealedCard({ capsule, onDelete }: { capsule: Capsule; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      borderRadius: '14px',
      border: '1px solid var(--green-bd)',
      background: 'var(--green-bg)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--sh)',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', right: '-30px', top: '-30px',
        width: '140px', height: '140px', borderRadius: '50%',
        background: 'var(--green)', opacity: 0.05, pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Envelope icon */}
        <div style={{
          width: '52px', height: '52px', flexShrink: 0, borderRadius: '12px',
          background: 'var(--warm2)', border: '1px solid var(--green-bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <circle cx="12" cy="12" r="2.2" fill="var(--green)" stroke="none" opacity="0.5" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px', fontWeight: 600,
              color: 'var(--t1)', margin: 0, lineHeight: 1.3,
            }}>
              {capsule.titre}
            </h3>

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
                style={{
                  flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px',
                  border: '1px solid var(--bd)', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--t3)',
                }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => onDelete(capsule.id)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', border: 'none',
                    background: 'var(--rose)', color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >Supprimer</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: '4px 10px', borderRadius: '6px',
                    border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', cursor: 'pointer',
                  }}
                >Annuler</button>
              </div>
            )}
          </div>

          {/* Destinataire */}
          {capsule.destinataire_nom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <svg width="13" height="13" fill="none" stroke="var(--t3)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'var(--t2)' }}>
                Pour {capsule.destinataire_nom}
              </span>
            </div>
          )}

          {/* Sealed hint */}
          <div style={{
            padding: '11px 14px', borderRadius: '9px',
            background: 'var(--warm)', border: '1px dashed var(--green-bd)',
            marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="13" height="13" fill="none" stroke="var(--t3)" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px', color: 'var(--t3)', fontStyle: 'italic',
            }}>
              Ce message est scellé jusqu&apos;au {formatDateFR(capsule.reveal_date)}
            </span>
          </div>

          {/* Countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="13" height="13" fill="none" stroke="var(--green)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px', color: 'var(--green)', fontWeight: 600,
            }}>
              Révélation dans {countdown(capsule.reveal_date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Revealed Card ─────────────────────────────────────────────────────────────

function RevealedCard({ capsule }: { capsule: Capsule }) {
  return (
    <div style={{
      borderRadius: '14px',
      border: '1px solid var(--bd)',
      background: 'var(--cream)',
      padding: '24px',
      boxShadow: 'var(--sh)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px', fontWeight: 600,
            color: 'var(--t1)', margin: '0 0 7px', lineHeight: 1.3,
          }}>
            {capsule.titre}
          </h3>
          {capsule.destinataire_nom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" fill="none" stroke="var(--t3)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'var(--t2)' }}>
                Pour {capsule.destinataire_nom}
              </span>
            </div>
          )}
        </div>

        {/* Revealed badge */}
        <div style={{
          flexShrink: 0, padding: '5px 12px', borderRadius: '20px',
          background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
          color: 'var(--green)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '12px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '5px',
          whiteSpace: 'nowrap',
        }}>
          <svg width="11" height="11" fill="none" stroke="var(--green)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Révélée le {formatDateFR(capsule.reveal_date)}
        </div>
      </div>

      {/* Photo */}
      {capsule.photo_url && (
        <div style={{ marginBottom: '16px' }}>
          <img
            src={capsule.photo_url}
            alt=""
            style={{
              width: '100%', maxHeight: '320px',
              objectFit: 'cover', borderRadius: '10px',
              border: '1px solid var(--bd)',
            }}
          />
        </div>
      )}

      {/* Message */}
      <div style={{
        padding: '20px', borderRadius: '12px',
        background: 'var(--warm)', border: '1px solid var(--bd2)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '15px', lineHeight: '1.75',
        color: 'var(--t1)', whiteSpace: 'pre-wrap',
      }}>
        {capsule.message}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CapsulePage() {
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  // Form state
  const [titre,       setTitre]       = useState('');
  const [message,     setMessage]     = useState('');
  const [revealDate,  setRevealDate]  = useState('');
  const [destNom,     setDestNom]     = useState('');
  const [destEmail,   setDestEmail]   = useState('');
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [photoPreview,setPhotoPreview]= useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // List state
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'avenir' | 'revelees'>('avenir');

  async function fetchCapsules() {
    if (!user) return;
    const { data } = await supabase
      .from('capsules')
      .select('*')
      .eq('owner_id', user.id)
      .order('reveal_date', { ascending: true });
    if (data) setCapsules(data as Capsule[]);
    setLoading(false);
  }

  useEffect(() => { fetchCapsules(); }, [user?.id]);

  // Auto-mark as revealed on display
  useEffect(() => {
    const toMark = capsules.filter(c => !c.revealed && c.reveal_date <= todayStr);
    if (toMark.length === 0) return;
    const ids = toMark.map(c => c.id);
    supabase.from('capsules').update({ revealed: true }).in('id', ids);
    setCapsules(prev => prev.map(c => ids.includes(c.id) ? { ...c, revealed: true } : c));
  }, [capsules.length]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setFormSuccess(false);

    if (!titre.trim() || !message.trim() || !revealDate) {
      setFormError('Remplis tous les champs obligatoires.');
      return;
    }
    if (revealDate <= todayStr) {
      setFormError('La date de révélation doit être dans le futur.');
      return;
    }

    setSubmitting(true);
    const capsuleId = crypto.randomUUID();
    let photoUrl: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${capsuleId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('capsules')
        .upload(path, photoFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('capsules').getPublicUrl(path);
        photoUrl = publicUrl;
      }
    }

    const { error } = await supabase.from('capsules').insert({
      id: capsuleId,
      owner_id: user.id,
      titre: titre.trim(),
      message: message.trim(),
      reveal_date: revealDate,
      destinataire_nom: destNom.trim() || null,
      destinataire_email: destEmail.trim() || null,
      photo_url: photoUrl,
      revealed: false,
    });

    setSubmitting(false);
    if (error) {
      setFormError('Erreur lors de la création. Réessaie.');
      return;
    }

    setTitre('');
    setMessage('');
    setRevealDate('');
    setDestNom('');
    setDestEmail('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
    fetchCapsules();
  }

  async function deleteCapsule(id: string) {
    await supabase.from('capsules').delete().eq('id', id);
    setCapsules(prev => prev.filter(c => c.id !== id));
  }

  const upcoming = capsules.filter(c => c.reveal_date > todayStr);
  const revealed = capsules.filter(c => c.reveal_date <= todayStr);
  const shown    = tab === 'avenir' ? upcoming : revealed;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '14px',
            background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2" />
            </svg>
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '28px', fontWeight: 700,
              color: 'var(--t1)', margin: 0, lineHeight: 1.2,
            }}>
              Capsule temporelle
            </h1>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', color: 'var(--t3)',
              margin: '4px 0 0',
            }}>
              Scelle un message pour le futur
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 1 : Formulaire ── */}
      <section style={{
        background: 'var(--cream)',
        border: '1px solid var(--bd)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '52px',
        boxShadow: 'var(--sh)',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '20px', fontWeight: 600,
          color: 'var(--t1)', margin: '0 0 26px',
        }}>
          Créer une capsule
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Titre */}
          <div>
            <label style={labelStyle}>
              Titre <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              required
              placeholder="Un titre pour cette capsule…"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            />
          </div>

          {/* Message */}
          <div>
            <label style={labelStyle}>
              Message <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <p style={hintStyle}>Ce message sera révélé à la date choisie</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Écris ici ton message pour le futur…"
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', lineHeight: '1.65' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            />
          </div>

          {/* Date de révélation */}
          <div>
            <label style={labelStyle}>
              Date de révélation <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input
              type="date"
              value={revealDate}
              onChange={e => setRevealDate(e.target.value)}
              required
              min={tomorrowStr}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            />
          </div>

          {/* Destinataire nom */}
          <div>
            <label style={labelStyle}>
              Destinataire{' '}
              <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <p style={hintStyle}>Pour qui est ce message ?</p>
            <input
              value={destNom}
              onChange={e => setDestNom(e.target.value)}
              placeholder="Nom du destinataire…"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            />
          </div>

          {/* Destinataire email */}
          <div>
            <label style={labelStyle}>
              Email du destinataire{' '}
              <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <p style={hintStyle}>Notifier par email à la date de révélation</p>
            <input
              type="email"
              value={destEmail}
              onChange={e => setDestEmail(e.target.value)}
              placeholder="email@exemple.com"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            />
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>
              Photo{' '}
              <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
            {photoPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={photoPreview}
                  alt=""
                  style={{
                    width: '80px', height: '80px',
                    objectFit: 'cover', borderRadius: '10px',
                    border: '1px solid var(--bd)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      padding: '6px 12px', borderRadius: '7px',
                      border: '1px solid var(--bd)', background: 'transparent', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'var(--t2)',
                    }}
                  >Changer</button>
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    style={{
                      padding: '6px 12px', borderRadius: '7px',
                      border: '1px solid var(--bd)', background: 'transparent', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: 'var(--rose)',
                    }}
                  >Supprimer</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '10px',
                  border: '1.5px dashed var(--bd)', background: 'var(--warm)',
                  cursor: 'pointer', width: '100%',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: 'var(--t2)',
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Ajouter une photo
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {formError && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'var(--rose-bg)', color: 'var(--rose)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px',
            }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'var(--green-bg)', color: 'var(--green)',
              border: '1px solid var(--green-bd)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Capsule scellée avec succès !
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '13px 26px', borderRadius: '10px',
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? 'var(--bd)' : 'var(--green)', color: '#fff',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
              alignSelf: 'flex-start',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {submitting ? 'Scellement…' : 'Sceller la capsule'}
          </button>
        </form>
      </section>

      {/* ── Section 2 : Mes capsules ── */}
      <section>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px', fontWeight: 600,
          color: 'var(--t1)', margin: '0 0 20px',
        }}>
          Mes capsules
        </h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {([
            { key: 'avenir'   as const, label: 'À venir',  count: upcoming.length },
            { key: 'revelees' as const, label: 'Révélées', count: revealed.length },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 18px', borderRadius: '8px',
                border: '1px solid',
                borderColor: tab === key ? 'var(--green)' : 'var(--bd)',
                background: tab === key ? 'var(--green-bg)' : 'transparent',
                color: tab === key ? 'var(--green)' : 'var(--t2)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.12s',
              }}
            >
              {label}
              <span style={{
                padding: '1px 7px', borderRadius: '20px',
                background: tab === key ? 'var(--green)' : 'var(--bd2)',
                color: tab === key ? '#fff' : 'var(--t2)',
                fontSize: '11px', fontWeight: 700,
              }}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center', padding: '52px',
            color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Chargement…
          </div>
        ) : shown.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            color: 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
          }}>
            {tab === 'avenir'
              ? 'Aucune capsule scellée pour le moment.'
              : 'Aucune capsule révélée pour le moment.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shown.map(c =>
              c.reveal_date > todayStr
                ? <SealedCard   key={c.id} capsule={c} onDelete={deleteCapsule} />
                : <RevealedCard key={c.id} capsule={c} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
