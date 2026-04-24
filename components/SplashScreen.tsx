'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

function SplashParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 40 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 2 + 1.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45,106,79,0.5)';
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(45,106,79,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  );
}

export default function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone,   setGone]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1900);
    const t2 = setTimeout(() => setGone(true),   2250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, #e8e0d0 0%, #d4c9b0 50%, #c8bda0 100%)',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      {/* Particules identiques au fond du site */}
      <SplashParticles />

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, animation: 'splashLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <Image
          src="/logo.png"
          alt="Lenyol"
          width={240}
          height={68}
          style={{ objectFit: 'contain', width: 'auto', height: '68px' }}
          priority
        />
      </div>

      {/* Barre de chargement */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 140, height: 3,
        background: 'rgba(26,92,62,0.12)',
        borderRadius: 10, marginTop: 36,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, var(--green2), var(--green3))',
          borderRadius: 10,
          animation: 'splashBar 1.9s cubic-bezier(0.4,0,0.2,1) forwards',
        }} />
      </div>
    </div>
  );
}
