'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  bucketPath: string; // e.g., 'profile/{userId}.jpg' or 'person/{personId}.jpg'
  onUpload: (newUrl: string) => void;
  onError?: (error: string) => void;
  size?: number; // max width/height, default 400
  className?: string;
  children?: React.ReactNode; // custom content, e.g., avatar
  prenom?: string; // for generating initials
}

export default function PhotoUpload({
  currentPhotoUrl,
  bucketPath,
  onUpload,
  onError,
  size = 400,
  className = '',
  children,
  prenom,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate initials from first name
  const getInitials = () => {
    if (!prenom) return '?';
    const parts = prenom.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return prenom.substring(0, 2).toUpperCase();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError?.('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      onError?.('Fichier trop volumineux. Maximum 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Resize and compress
      const resizedBlob = await resizeImage(file, size);

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('persons-photos')
        .upload(bucketPath, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('persons-photos')
        .getPublicUrl(bucketPath);

      onUpload(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      onError?.('Erreur lors du téléchargement.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`photo-upload ${className}`} onClick={handleFileSelect} style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
      {children || (
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: currentPhotoUrl ? `url(${currentPhotoUrl})` : 'linear-gradient(135deg, #e8e4dc 0%, #c9c5bb 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.35}px`,
          fontWeight: 600,
          color: '#5a5548',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          {!currentPhotoUrl && getInitials()}
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: 2,
        right: 2,
        background: 'var(--green)',
        color: 'white',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        {uploading ? '...' : '📷'}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// Resize image using Canvas
async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable.'));
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress as JPEG
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Image resize failed.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.8); // 80% quality
    };
    img.onerror = () => reject(new Error('Image load failed.'));
    img.src = URL.createObjectURL(file);
  });
}