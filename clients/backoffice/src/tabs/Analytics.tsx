import { useMemo, useState } from 'react';
import { useKind } from '../lib/store';
import type { Expense, Lead } from '../lib/store';
import { money } from '../lib/ui';

/**
 * Analytics — computed live from the CRM's own records (leads + expenses).
 * Charts follow the dataviz method: single hue for single-measure charts,
 * validated 2-hue pair (#00b32d / #0284c7, dark-surface lightness band) for
 * the revenue-vs-expenses pairing, thin marks, rounded data ends, recessive
 * grid, hover tooltips, legend only where there are two series.
 */

const GREEN = '#00b32d';
const BLUE = '#0284c7';

const WEEK = 7 * 24 * 60 * 60 * 1000;

function Tile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="liquid-glass rounded-3xl p-5">
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-matrix-300' : 'text-white/50'}`}>{label}</p>
      <p className={`font-display mt-1.5 text-3xl font-extrabold ${accent ? 'text-matrix-200' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Tooltip({ tip }: { tip: { x: number; y: number; text: string } | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-black/90 px-2.5 py-1.5 text-xs text-white ring-1 ring-white/20"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      {tip.text}
    </div>
  );
}

/** Single-series area+line: leads per week, last 12 weeks. */
function LeadsOverTime({ leads }: { leads: Array<Lead & { createdAt: string }> }) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const W = 560;
  const H = 180;
  const PAD = { l: 30, r: 12, t: 12, b: 22 };

  const weeks = useMemo(() => {
    const now = Date.now();
    const start = now - 11 * WEEK;
    const buckets = Array.from({ length: 12 }, (_, i) => ({ t: start + i * WEEK, n: 0 }));
    for (const l of leads) {
      const at = new Date(l.createdAt).getTime();
      const i = Math.floor((at - start) / WEEK);
      if (i >= 0 && i < 12) buckets[i].n++;
    }
    return buckets;
  }, [leads]);

  const max = Math.max(4, ...weeks.map((w) => w.n));
  const x = (i: number) => PAD.l + (i / 11) * (W - PAD.l - PAD.r);
  const y = (n: number) => H - PAD.b - (n / max) * (H - PAD.t - PAD.b);
  const pts = weeks.map((w, i) => `${x(i)},${y(w.n)}`).join(' ');
  const fmt = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="relative liquid-glass rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Leads per week · last 12 weeks</p>
      <Tooltip tip={tip} />
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Leads per week, last 12 weeks">
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.45)">{Math.round(max * f)}</text>
          </g>
        ))}
        <polygon points={`${x(0)},${y(0)} ${pts} ${x(11)},${y(0)}`} fill={GREEN} opacity="0.14" />
        <polyline points={pts} fill="none" stroke={GREEN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {weeks.map((w, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(w.n)} r="3" fill={GREEN} stroke="#0a0f0a" strokeWidth="2" />
            {/* oversized hit target */}
            <rect
              x={x(i) - (W - PAD.l - PAD.r) / 24}
              y={PAD.t}
              width={(W - PAD.l - PAD.r) / 12}
              height={H - PAD.t - PAD.b}
              fill="transparent"
              onMouseEnter={(e) => {
                const box = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect();
                const svgBox = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                const sx = svgBox.width / W;
                setTip({ x: svgBox.left - box.left + x(i) * sx, y: svgBox.top - box.top + y(w.n) * (svgBox.height / H), text: `wk of ${fmt(w.t)}: ${w.n} lead${w.n === 1 ? '' : 's'}` });
              }}
              onMouseLeave={() => setTip(null)}
            />
          </g>
        ))}
        <text x={x(0)} y={H - 6} fontSize="9" fill="rgba(255,255,255,0.45)">{fmt(weeks[0].t)}</text>
        <text x={x(11)} y={H - 6} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.45)">{fmt(weeks[11].t)}</text>
      </svg>
    </div>
  );
}

/** Horizontal single-hue bars with direct value labels. */
function HBars({ title, rows, format }: { title: string; rows: Array<[string, number]>; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map(([label, v]) => (
          <div key={label} className="group flex items-center gap-2" title={`${label}: ${format(v)}`}>
            <span className="w-32 shrink-0 truncate text-xs text-white/70">{label}</span>
            <div className="h-3.5 flex-1 overflow-hidden rounded-r-[4px] bg-white/5">
              <div className="h-full rounded-r-[4px]" style={{ width: `${(v / max) * 100}%`, background: GREEN }} />
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-semibold text-white/85">{format(v)}</span>
          </div>
        ))}
        {!rows.length && <p className="py-4 text-center text-xs text-white/40">No data yet.</p>}
      </div>
    </div>
  );
}

/** Two-series grouped bars: booked revenue vs expenses by month. */
function MoneyByMonth({ leads, expenses }: { leads: Array<Lead & { createdAt: string }>; expenses: Expense[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const W = 560;
  const H = 190;
  const PAD = { l: 44, r: 12, t: 14, b: 24 };

  const months = useMemo(() => {
    const out: Array<{ key: string; label: string; revenue: number; spend: number }> = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: m.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, spend: 0 });
    }
    const key = (t: number) => { const m = new Date(t); return `${m.getFullYear()}-${m.getMonth()}`; };
    for (const l of leads) {
      if (l.stage === 'won' && l.jobCost != null) {
        const k = key(l.contractSignedAt ?? new Date(l.createdAt).getTime());
        const b = out.find((o) => o.key === k);
        if (b) b.revenue += l.jobCost;
      }
    }
    for (const e of expenses) {
      const b = out.find((o) => o.key === key(e.date));
      if (b) b.spend += e.amount;
    }
    return out;
  }, [leads, expenses]);

  const max = Math.max(1000, ...months.flatMap((m) => [m.revenue, m.spend]));
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const groupW = (W - PAD.l - PAD.r) / 6;
  const barW = Math.min(26, groupW / 2 - 6);

  const bar = (mi: number, si: 0 | 1, v: number, color: string, name: string) => {
    const gx = PAD.l + mi * groupW + groupW / 2;
    const bx = si === 0 ? gx - barW - 1 : gx + 1; // 2px surface gap between the pair
    const h = Math.max(v > 0 ? 2 : 0, H - PAD.b - y(v));
    return (
      <rect
        key={`${mi}-${si}`}
        x={bx}
        y={H - PAD.b - h}
        width={barW}
        height={h}
        rx="4"
        fill={color}
        onMouseEnter={(e) => {
          const wrap = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect();
          const svgBox = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
          const sx = svgBox.width / W;
          setTip({ x: svgBox.left - wrap.left + (bx + barW / 2) * sx, y: svgBox.top - wrap.top + (H - PAD.b - h) * (svgBox.height / H), text: `${months[mi].label} ${name}: ${money(v)}` });
        }}
        onMouseLeave={() => setTip(null)}
      />
    );
  };

  return (
    <div className="relative liquid-glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Booked revenue vs expenses · last 6 months</p>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} /> Booked revenue</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} /> Expenses</span>
        </div>
      </div>
      <Tooltip tip={tip} />
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Booked revenue versus expenses by month">
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.45)">
              {max * f >= 1000 ? `$${Math.round((max * f) / 1000)}k` : `$${Math.round(max * f)}`}
            </text>
          </g>
        ))}
        {months.map((m, i) => (
          <g key={m.key}>
            {bar(i, 0, m.revenue, GREEN, 'booked')}
            {bar(i, 1, m.spend, BLUE, 'expenses')}
            <text x={PAD.l + i * groupW + groupW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">{m.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Analytics() {
  const { items: leads } = useKind<Lead>('lead');
  const { items: expenses } = useKind<Expense>('expense');

  const all = leads ?? [];
  const exps = expenses ?? [];
  const now = Date.now();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const last30 = all.filter((l) => now - new Date(l.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);

  const decided = all.filter((l) => l.stage === 'won' || l.stage === 'lost');
  const winRate = decided.length ? Math.round((all.filter((l) => l.stage === 'won').length / decided.length) * 100) : null;
  const booked = all.filter((l) => l.stage === 'won' && l.jobCost != null).reduce((n, l) => n + (l.jobCost ?? 0), 0);
  const spendMtd = exps.filter((e) => e.date >= monthStart).reduce((n, e) => n + e.amount, 0);

  const bySource = new Map<string, number>();
  for (const l of all) bySource.set(l.source || 'unknown', (bySource.get(l.source || 'unknown') ?? 0) + 1);
  const sourceRows = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const byCat = new Map<string, number>();
  for (const e of exps) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  const catRows = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const stages: Array<[string, number]> = ['new', 'contacted', 'estimate', 'won', 'lost'].map((s) => [
    s[0].toUpperCase() + s.slice(1),
    all.filter((l) => l.stage === s).length,
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-white">Analytics</h1>
      <p className="mt-1 text-sm text-white/60">Live numbers straight from the pipeline and the expense ledger.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Leads · last 30 days" value={leads ? last30.length : '—'} accent />
        <Tile label="Win rate" value={winRate == null ? '—' : `${winRate}%`} />
        <Tile label="Revenue booked (won)" value={leads ? String(money(booked)) : '—'} />
        <Tile label="Expenses · this month" value={expenses ? String(money(spendMtd)) : '—'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <LeadsOverTime leads={all} />
        <MoneyByMonth leads={all} expenses={exps} />
        <HBars title="Leads by source" rows={sourceRows} format={(n) => String(n)} />
        <HBars title="Expenses by category · top 8" rows={catRows} format={(n) => String(money(n))} />
      </div>

      <div className="mt-4">
        <HBars title="Pipeline stages" rows={stages} format={(n) => String(n)} />
      </div>
    </div>
  );
}
