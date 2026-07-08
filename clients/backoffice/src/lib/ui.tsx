import { useState } from 'react';

/** Shared input / button styles for the directory + expense tabs. */
export const inp =
  'rounded-lg border border-sand-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none';
export const btnPrimary =
  'rounded-lg bg-gold-500 px-4 py-2 font-display text-sm font-bold text-navy-950 hover:bg-gold-400';
export const btnDark =
  'rounded-lg bg-navy-950 px-4 py-2 font-display text-sm font-bold text-white hover:bg-navy-900';

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
    <div className="mt-2 border-t border-sand-200 pt-2">
      {entries.map(([key, value]) => (
        <p key={key} className="mt-0.5 flex items-baseline gap-1.5 text-xs text-navy-900/75">
          <span className="font-semibold text-navy-900/50">{key}:</span> {value}
          <button
            type="button"
            onClick={() => {
              const next = { ...(extra ?? {}) };
              delete next[key];
              onSave(next);
            }}
            className="ml-auto text-red-600/60 hover:text-red-600"
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
        <input value={k} onChange={(e) => setK(e.target.value)} placeholder="Field" className="w-1/3 rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Value" className="w-full rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
        <button className="rounded-md bg-navy-950 px-2.5 py-1 text-xs font-bold text-white">Add</button>
      </form>
    </div>
  );
}
