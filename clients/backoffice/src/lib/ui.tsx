import { useState } from 'react';

/** Shared dark liquid-glass styles (ported from the CRM dashboard design). */
export const inp =
  'rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none';
export const btnPrimary =
  'rounded-full bg-matrix-400/90 px-4 py-2 font-display text-sm font-bold text-black transition hover:bg-matrix-300';
export const btnDark =
  'rounded-full liquid-glass-inset px-4 py-2 font-display text-sm font-bold text-white/85 transition hover:text-white hover:bg-white/10';
export const btnGhost = 'rounded-md px-1.5 py-1 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white/85';
export const btnDanger = 'rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10 hover:text-red-300';
export const btnMini = 'rounded-md bg-matrix-400/20 px-2.5 py-1 text-xs font-bold text-matrix-200 ring-1 ring-matrix-300/30 hover:bg-matrix-400/30';
export const inpMini =
  'rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none';
export const card = 'liquid-glass rounded-3xl';

export const money = (n: number | undefined | null) =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const toNum = (s: string): number | undefined => {
  const n = parseFloat(s.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

export const toDateInput = (ms: number | undefined) =>
  ms == null ? '' : new Date(ms).toISOString().slice(0, 10);
export const fromDateInput = (s: string): number | undefined =>
  s ? new Date(s + 'T12:00:00').getTime() : undefined;

/**
 * Key/value editor for the `extra` bag every directory record carries —
 * "allow for us to keep adding on" without code changes.
 */
export function ExtraFields({
  extra,
  onSave,
}: {
  extra: Record<string, string> | undefined;
  onSave: (next: Record<string, string>) => void;
}) {
  const [k, setK] = useState('');
  const [val, setVal] = useState('');
  const entries = Object.entries(extra ?? {});
  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      {entries.map(([key, value]) => (
        <p key={key} className="mt-0.5 flex items-baseline gap-1.5 text-xs text-white/75">
          <span className="font-semibold text-white/45">{key}:</span> {value}
          <button
            type="button"
            onClick={() => {
              const next = { ...(extra ?? {}) };
              delete next[key];
              onSave(next);
            }}
            className="ml-auto text-red-300/70 hover:text-red-300"
            aria-label={`Remove ${key}`}
          >
            ×
          </button>
        </p>
      ))}
      <form
        className="mt-1.5 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!k.trim()) return;
          onSave({ ...(extra ?? {}), [k.trim()]: val.trim() });
          setK('');
          setVal('');
        }}
      >
        <input value={k} onChange={(e) => setK(e.target.value)} placeholder="Field" className={`w-1/3 ${inpMini}`} />
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Value" className={`w-full ${inpMini}`} />
        <button className={btnMini}>Add</button>
      </form>
    </div>
  );
}
