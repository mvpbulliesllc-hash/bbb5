import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const STAGES = ['new', 'contacted', 'estimate', 'won', 'lost'] as const;
const STAGE_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', estimate: 'Estimate', won: 'Won', lost: 'Lost' };

function Tile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${accent ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white ring-sand-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-gold-300' : 'text-navy-900/50'}`}>{label}</p>
      <p className="font-display mt-1.5 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

export default function Overview() {
  const stats = useQuery(api.leads.stats);
  const lists = useQuery(api.contacts.lists);
  const zips = lists ? Object.keys(lists.byZip).length : 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-950">Control center</h1>
      <p className="mt-1 text-sm text-navy-900/60">Live view of leads coming off paragondemo.ecoaisolutions.com and your owned lists.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total leads" value={stats?.total ?? '—'} accent />
        <Tile label="Leads · last 7 days" value={stats?.last7 ?? '—'} />
        <Tile label="Contacts in lists" value={lists?.total ?? '—'} />
        <Tile label="Zip codes covered" value={zips || '—'} />
      </div>
      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-sand-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-navy-900/50">Pipeline</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s} className="rounded-xl bg-sand-50 p-4 ring-1 ring-sand-200">
              <p className="text-xs font-semibold text-navy-900/60">{STAGE_LABEL[s]}</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-navy-950">{stats?.byStage[s] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
