import { Suspense, lazy } from 'react';

// The dot-wave particle scene (same engine as jaraderochey.com) is the
// heaviest part of the bundle, so it loads as its own chunk behind Suspense —
// the glass UI renders instantly on plain black while the WebGL warms up.
const GL = lazy(() => import('./gl').then((m) => ({ default: m.GL })));

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-black" aria-hidden="true">
      <Suspense fallback={null}>
        <GL />
      </Suspense>
    </div>
  );
}
