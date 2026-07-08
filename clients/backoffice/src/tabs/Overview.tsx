import { useKind } from '../lib/store';
import type { Expense, Lead } from '../lib/store';
import { money } from '../lib/ui';

const STAGES = ['new', 'contacted', 'estimate', 'won', 'lost'] as const;
const STAGE_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', estimate: 'Estimate', won: 'Won', lost: 'Lost' };

function Tile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`liquid-glass rounded-3xl p-5 ${accent ? 'text-white' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-matrix-300' : 'text-white/50'}`}>{label}</p>
      <p className={`font-display mt-1.5 text-3xl font-extrabold ${accent ? 'text-matrix-200' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function Overview() {
  const { items: leads } = useKind<Lead>('lead');
  const { items: expenses } = useKind<Expense>('expense');

  const all = leads ?? [];
  const byStage: Record<string, number> = {};
  for (const l of all) byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = all.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const spendThisMonth = (expenses ?? []).filter((e) => e.date >= monthStart).reduce((n, e) => n + e.amount, 0);
  const openBalance = all
    .filter((l) => l.jobCost != null)
    .reduce((n, l) => n + ((l.jobCost ?? 0) - (l.deposit ?? 0) - (l.additionalPayment ?? 0) - (l.finalPayment ?? 0)), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-white">Control center</h1>
      <p className="mt-1 text-sm text-white/60">Live view of leads, jobs and spend for Paragon Exteriors.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total leads" value={leads ? all.length : '—'} accent />
        <Tile label="Leads · last 7 days" value={leads ? last7 : '—'} />
        <Tile label="Balance owed (all jobs)" value={leads ? String(money(openBalance)) : '—'} />
        <Tile label="Expenses this month" value={expenses ? String(money(spendThisMonth)) : '—'} />
      </div>
      <div className="mt-6 liquid-glass rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Pipeline</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s} className="liquid-glass-inset rounded-xl p-4">
              <p className="text-xs font-semibold text-white/60">{STAGE_LABEL[s]}</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-white">{byStage[s] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
