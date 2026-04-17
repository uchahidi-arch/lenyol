'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AboutNavWrapper from '@/components/home/AboutNavWrapper';
import HomeFooter from '@/components/home/HomeFooter';

const CATEGORIES = ['culture', 'histoire', 'genealogie', 'hinya'];

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function NouvelleChroniquePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [titre, setTitre]       = useState('');
  const [slug, setSlug]         = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [categorie, setCategorie] = useState('culture');
  const [resume, setResume]     = useState('');
  const [contenu, setContenu]   = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publie, setPublie]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const canWrite = profile?.role === 'redacteur' || profile?.role === 'admin';

  // Redirection si non autorisé
  useEffect(() => {
    if (!loading && !canWrite) {
      router.replace('/chroniques');
    }
  }, [loading, canWrite, router]);

  // Génération automatique du slug depuis le titre
  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(titre));
    }
  }, [titre, slugManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!slug.trim())  { setError('Le slug est obligatoire.'); return; }
    if (!contenu.trim()) { setError('Le contenu est obligatoire.'); return; }

    setSaving(true);
    const { error: err } = await supabase.from('articles').insert({
      titre: titre.trim(),
      slug: slug.trim(),
      categorie,
      resume: resume.trim() || null,
      contenu: contenu.trim(),
      image_url: imageUrl.trim() || null,
      auteur: [profile?.prenom, profile?.nom].filter(Boolean).join(' ') || 'Anonyme',
      publie,
    });
    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push('/chroniques');
  };

  if (loading || !canWrite) return null;

  return (
    <>
      <AboutNavWrapper />
      <main style={{ paddingTop: '64px', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '32px' }}>
            <Link href="/chroniques" style={{
              fontSize: '13px',
              color: 'var(--t3)',
              textDecoration: 'none',
              fontFamily: 'Outfit, sans-serif',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
            }}>
              ← Retour aux chroniques
            </Link>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--t1)',
              lineHeight: 1.2,
            }}>
              Nouvelle chronique
            </h1>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Titre */}
            <div>
              <label style={labelStyle}>Titre *</label>
              <input
                value={titre}
                onChange={e => setTitre(e.target.value)}
                placeholder="Ex : La lignée des Binti Mradabi de Moroni"
                style={inputStyle}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>
                Slug *
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '8px', fontWeight: 400 }}>
                  (généré automatiquement — modifiable)
                </span>
              </label>
              <input
                value={slug}
                onChange={e => { setSlugManual(true); setSlug(e.target.value); }}
                placeholder="lignee-binti-mradabi-moroni"
                style={inputStyle}
              />
            </div>

            {/* Catégorie */}
            <div>
              <label style={labelStyle}>Catégorie *</label>
              <select
                value={categorie}
                onChange={e => setCategorie(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Résumé */}
            <div>
              <label style={labelStyle}>
                Résumé
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '8px', fontWeight: 400 }}>
                  (affiché sur la liste — optionnel)
                </span>
              </label>
              <textarea
                value={resume}
                onChange={e => setResume(e.target.value)}
                rows={3}
                placeholder="Une courte description de la chronique…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Corps */}
            <div>
              <label style={labelStyle}>Contenu *</label>
              <textarea
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                rows={16}
                placeholder="Rédigez ici le contenu complet de la chronique…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, fontFamily: 'Outfit, sans-serif' }}
              />
            </div>

            {/* Image URL */}
            <div>
              <label style={labelStyle}>
                URL de l&apos;image de couverture
                <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '8px', fontWeight: 400 }}>
                  (optionnel)
                </span>
              </label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
            </div>

            {/* Publier */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              color: 'var(--t2)',
            }}>
              <input
                type="checkbox"
                checked={publie}
                onChange={e => setPublie(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Publier immédiatement
            </label>

            {/* Erreur */}
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(220,38,38,.08)',
                border: '1px solid rgba(220,38,38,.25)',
                color: '#dc2626',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/chroniques" style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: '1px solid var(--bd)',
                color: 'var(--t2)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}>
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  borderRadius: '100px',
                  background: saving ? 'var(--t3)' : 'var(--green)',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Enregistrement…' : publie ? 'Publier' : 'Enregistrer en brouillon'}
              </button>
            </div>

          </form>
        </div>
      </main>
      <HomeFooter />
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--t2)',
  fontFamily: 'Outfit, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--bd)',
  background: 'var(--card)',
  color: 'var(--t1)',
  fontFamily: 'Outfit, sans-serif',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};
