import { Suspense, lazy, useEffect, useState } from "react";

/**
 * GLBackdrop — the app-wide liquid-glass canvas.
 *
 * Mounts the WebGL particle field once, fixed behind the entire shell, so
 * every glass surface (sidebar, topbar, cards) refracts a live backdrop.
 * The heavy three.js bundle is code-split via React.lazy so it never blocks
 * first paint, and we skip it entirely when the user prefers reduced motion
 * or the device can't do a fine-pointer hover (typically low-power mobile).
 */

// Code-split: three/fiber/drei only load once this chunk is needed.
const GL = lazy(() =>
  import("@/components/gl").then((m) => ({ default: m.GL })),
);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export function GLBackdrop() {
  const reduced = usePrefersReducedMotion();
  // Defer mount one tick so the shell paints its static gradient first.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--gl-base)]"
    >
      {/* Static fallback gradient — always painted, and the sole backdrop
          when reduced motion is requested. */}
      <div className="absolute inset-0 gl-fallback" />

      {!reduced && ready && (
        <Suspense fallback={null}>
          <div className="absolute inset-0 opacity-90">
            <GL />
          </div>
        </Suspense>
      )}

      {/* Readability veil — keeps text/glass legible over the bright core. */}
      <div className="absolute inset-0 bg-[var(--gl-base)]/35" />
    </div>
  );
}
