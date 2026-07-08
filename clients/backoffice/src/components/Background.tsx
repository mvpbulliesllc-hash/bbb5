import { useEffect, useRef } from 'react';

/**
 * Drifting particle field + vignette behind the glass UI — a dependency-free
 * canvas stand-in for the design package's three.js FBO particle scene (which
 * would add ~700 kB of WebGL deps for a background).
 */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; z: number; ph: number; sp: number };
    let pts: P[] = [];

    function resize() {
      if (!canvas || !ctx) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 9000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7, // depth → size/brightness/parallax
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.8,
      }));
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function frame(t: number) {
      if (!ctx) return;
      const time = t / 1000;
      ctx.clearRect(0, 0, w, h);

      // faint emerald aurora
      const g = ctx.createRadialGradient(w * 0.75, h * 0.15, 0, w * 0.75, h * 0.15, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(45, 212, 150, 0.055)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (const p of pts) {
        // slow noise-ish drift
        p.x += Math.sin(time * 0.22 * p.sp + p.ph) * 0.22 * p.z;
        p.y += Math.cos(time * 0.17 * p.sp + p.ph * 1.7) * 0.18 * p.z - 0.05 * p.z;
        if (p.y < -4) p.y = h + 4;
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;

        const tw = 0.55 + 0.45 * Math.sin(time * 1.3 * p.sp + p.ph * 3);
        const r = 0.6 + p.z * 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214, 244, 232, ${(0.05 + 0.3 * p.z) * tw})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) frame(0); // draw one static frame
    else raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-black" aria-hidden="true">
      <canvas ref={ref} className="h-full w-full" />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(115% 90% at 50% 40%, transparent 40%, rgba(0,0,0,0.72) 100%)' }} />
    </div>
  );
}
