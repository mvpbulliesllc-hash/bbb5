import { useMemo, useState } from 'react';
import { invoiceTotals, useKind } from '../lib/store';
import type { Activity, Estimate, Expense, Invoice, Lead } from '../lib/store';
import { money } from '../lib/ui';

/**
 * Reports — run any data point over a date window: daily / weekly / MTD /
 * custom X→Y / YTD / all time. Everything computes from the CRM's own records
 * (leads, estimates, invoices, payments via the activity timeline, expenses).
 */

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function presetRange(key: string): [number, number] {
  const now = new Date();
  const today0 = startOfDay(now);
  const dow = (now.getDay() + 6) % 7; // Monday-start
  const weekStart = today0 - dow * DAY;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const end = Date.now();
  switch (key) {
    case 'today': return [today0, end];
    case 'yesterday': return [today0 - DAY, today0];
    case 'thisWeek': return [weekStart, end];
    case 'lastWeek': return [weekStart - 7 * DAY, weekStart];
    case 'mtd': return [monthStart, end];
    case 'lastMonth': return [lastMonthStart, monthStart];
    case 'ytd': return [yearStart, end];
    default: return [0, end];
  }
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This week' },
  { key: 'lastWeek', label: 'Last week' },
  { key: 'mtd', label: 'Month to date' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

type MetricKey = 'leads' | 'estimateValue' | 'invoiced' | 'collected' | 'expenses' | 'net' | 'wonRevenue';

const METRICS: Array<{ key: MetricKey; label: string; kind: 'count' | 'money' }> = [
  { key: 'leads', label: 'New leads', kind: 'count' },
  { key: 'estimateValue', label: 'Estimates written', kind: 'money' },
  { key: 'invoiced', label: 'Invoiced', kind: 'money' },
  { key: 'collected', label: 'Payments collected', kind: 'money' },
  { key: 'expenses', label: 'Expenses', kind: 'money' },
  { key: 'net', label: 'Net (collected − expenses)', kind: 'money' },
  { key: 'wonRevenue', label: 'Won job revenue', kind: 'money' },
];

const ts = (s: string | number) => (typeof s === 'number' ? s : new Date(s).getTime());
const inWin = (t: number, a: number, b: number) => t >= a && t < b;

export default function Reports() {
  const { items: leads } = useKind<Lead>('lead');
  const { items: estimates } = useKind<Estimate>('estimate');
  const { items: invoices } = useKind<Invoice>('invoice');
  const { items: expenses } = useKind<Expense>('expense');
  const { items: activities } = useKind<Activity>('activity');

  const [preset, setPreset] = useState('mtd');
  const [from, setFrom] = useState(new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [metric, setMetric] = useState<MetricKey>('collected');

  const [a, b] = preset === 'custom'
    ? [new Date(from + 'T00:00:00').getTime(), new Date(to + 'T23:59:59').getTime()]
    : presetRange(preset);

  const loaded = leads && estimates && invoices && expenses && activities;

  const compute = useMemo(() => {
    const L = leads ?? [], E = estimates ?? [], I = invoices ?? [], X = expenses ?? [], A = activities ?? [];
    const value = (key: MetricKey, lo: number, hi: number): number => {
      switch (key) {
        case 'leads':
          return L.filter((l) => inWin(ts(l.createdAt), lo, hi)).length;
        case 'estimateValue':
          return E.filter((e) => inWin(ts(e.createdAt), lo, hi)).reduce((n, e) => n + invoiceTotals(e.lineItems, e.taxPct ?? 0).total, 0);
        case 'invoiced':
          return I.filter((iv) => inWin(ts(iv.createdAt), lo, hi)).reduce((n, iv) => n + invoiceTotals(iv.lineItems, iv.taxPct ?? 0).total, 0);
        case 'collected':
          return A.filter((ac) => ac.type === 'payment' && inWin(ac.at, lo, hi)).reduce((n, ac) => n + (ac.amount ?? 0), 0);
        case 'expenses':
          return X.filter((e) => inWin(e.date, lo, hi)).reduce((n, e) => n + e.amount, 0);
        case 'net':
          return value('collected', lo, hi) - value('expenses', lo, hi);
        case 'wonRevenue':
          return L.filter((l) => l.stage === 'won' && l.jobCost != null && inWin(ts(l.contractSignedAt ?? l.createdAt), lo, hi)).reduce((n, l) => n + (l.jobCost ?? 0), 0);
      }
    };
    return value;
  }, [leads, estimates, invoices, expenses, activities]);

  // trend buckets across the window (day buckets if <=45 days, else week)
  const spanDays = Math.max(1, Math.ceil((b - a) / DAY));
  const useWeek = spanDays > 45;
  const bucketMs = useWeek ? 7 * DAY : DAY;
  const nBuckets = Math.min(60, Math.ceil((b - a) / bucketMs));
  const start = b - nBuckets * bucketMs;
  const buckets = Array.from({ length: nBuckets }, (_, i) => {
    const lo = start + i * bucketMs;
    return { lo, v: compute(metric, lo, lo + bucketMs) };
  });
  const bmax = Math.max(1, ...buckets.map((x) => x.v));

  const metricDef = METRICS.find((m) => m.key === metric)!;
  const fmt = (v: number, kind: 'count' | 'money') => (kind === 'money' ? money(v) : String(v));

  // breakdowns for the window
  const expInWin = (expenses ?? []).filter((e) => inWin(e.date, a, b));
  const expByCat = new Map<string, number>();
  for (const e of expInWin) expByCat.set(e.category, (expByCat.get(e.category) ?? 0) + e.amount);
  const leadsInWin = (leads ?? []).filter((l) => inWin(ts(l.createdAt), a, b));
  const leadBySource = new Map<string, number>();
  for (const l of leadsInWin) leadBySource.set(l.source || 'unknown', (leadBySource.get(l.source || 'unknown') ?? 0) + 1);

  const rangeLabel = `${new Date(a).toLocaleDateString()} – ${new Date(Math.min(b, Date.now())).toLocaleDateString()}`;

  const exportCsv = () => {
    const rows = [['Metric', 'Value'], ...METRICS.map((m) => [m.label, metricDef ? String(compute(m.key, a, b)) : ''])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = `paragon-report-${preset}.csv`;
    el.click();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Reports</h1>
          <p className="mt-1 text-sm text-white/60">Any data point, any window — daily, weekly, month-to-date, a custom range, or year-to-date.</p>
        </div>
        <button onClick={exportCsv} className="rounded-md bg-matrix-400/20 px-2.5 py-1 text-xs font-bold text-matrix-200 ring-1 ring-matrix-300/30 hover:bg-matrix-400/30">Export CSV</button>
      </div>

      {/* period selector */}
      <div className="mt-4 liquid-glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${preset === p.key ? 'bg-matrix-400/90 text-black ring-matrix-300/60' : 'bg-white/5 text-white/70 ring-white/15 hover:bg-white/10'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
            From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white" />
            to <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white" />
          </div>
        )}
        <p className="mt-2 text-xs text-white/45">{rangeLabel}</p>
      </div>

      {/* metric tiles for the window */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`liquid-glass rounded-2xl p-4 text-left transition ${metric === m.key ? 'ring-2 ring-matrix-300/50' : ''}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{m.label}</p>
            <p className={`font-display mt-1 text-2xl font-extrabold ${m.key === 'net' && loaded && compute(m.key, a, b) < 0 ? 'text-red-300' : 'text-white'}`}>
              {loaded ? fmt(compute(m.key, a, b), m.kind) : '—'}
            </p>
          </button>
        ))}
      </div>

      {/* trend of the selected metric */}
      <div className="mt-4 liquid-glass rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{metricDef.label} · by {useWeek ? 'week' : 'day'}</p>
        <div className="mt-3 flex h-40 items-end gap-1">
          {buckets.map((bk, i) => (
            <div key={i} className="group relative flex-1" title={`${new Date(bk.lo).toLocaleDateString()}: ${fmt(bk.v, metricDef.kind)}`}>
              <div className="w-full rounded-t-[3px] bg-matrix-400/80" style={{ height: `${Math.max(bk.v > 0 ? 3 : 0, (bk.v / bmax) * 150)}px` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.6rem] text-white/40">
          <span>{buckets.length ? new Date(buckets[0].lo).toLocaleDateString() : ''}</span>
          <span>{buckets.length ? new Date(buckets[buckets.length - 1].lo).toLocaleDateString() : ''}</span>
        </div>
      </div>

      {/* breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="liquid-glass rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Expenses by category · this window</p>
          <div className="mt-2 space-y-1">
            {[...expByCat.entries()].sort((x, y) => y[1] - x[1]).map(([c, v]) => (
              <div key={c} className="flex items-baseline justify-between text-xs text-white/75"><span className="truncate">{c}</span><span className="font-semibold text-white/90">{money(v)}</span></div>
            ))}
            {!expByCat.size && <p className="py-2 text-xs text-white/40">No expenses in this window.</p>}
          </div>
        </div>
        <div className="liquid-glass rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Leads by source · this window</p>
          <div className="mt-2 space-y-1">
            {[...leadBySource.entries()].sort((x, y) => y[1] - x[1]).map(([s, v]) => (
              <div key={s} className="flex items-baseline justify-between text-xs text-white/75"><span className="truncate">{s}</span><span className="font-semibold text-white/90">{v}</span></div>
            ))}
            {!leadBySource.size && <p className="py-2 text-xs text-white/40">No leads in this window.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
