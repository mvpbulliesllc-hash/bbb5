import { useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  FileSignature,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Radar,
  StickyNote,
  TrendingUp,
  UserPlus,
  Video,
} from 'lucide-react';
import { useKind } from '../lib/store';
import type { Activity, ActivityType, Rec } from '../lib/store';
import { inpMini } from '../lib/ui';

/**
 * Unified activity timeline — the spine of the whole app (brief §7). Reads
 * every activity row (written by the pipeline, list builder, estimates, and
 * — once wired — Telnyx/AgentMail/Docuseal/Stripe webhooks) into one feed.
 */

const ICON: Record<ActivityType, typeof Phone> = {
  note: StickyNote,
  stage: TrendingUp,
  created: UserPlus,
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  meeting: Video,
  signature: FileSignature,
  payment: DollarSign,
  estimate: FileText,
  invoice: FileText,
  task: CheckCircle2,
  list: Radar,
};

const TINT: Partial<Record<ActivityType, string>> = {
  payment: 'text-matrix-300',
  invoice: 'text-matrix-300',
  estimate: 'text-sky-300',
  signature: 'text-sky-300',
  created: 'text-white/80',
  stage: 'text-white/80',
};

const FILTERS: Array<{ key: string; label: string; match: ActivityType[] }> = [
  { key: 'all', label: 'All', match: [] },
  { key: 'comms', label: 'Calls & msgs', match: ['call', 'sms', 'email', 'meeting'] },
  { key: 'sales', label: 'Sales', match: ['created', 'stage', 'estimate', 'invoice', 'payment', 'signature'] },
  { key: 'notes', label: 'Notes & tasks', match: ['note', 'task', 'list'] },
];

function when(at: number) {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(at).toLocaleDateString();
}

export default function Timeline() {
  const { items } = useKind<Activity>('activity');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const rows = (items ?? [])
    .slice()
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
    .filter((a) => (active.match.length ? active.match.includes(a.type) : true))
    .filter((a) => {
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return [a.title, a.body, a.leadName, a.actor].filter(Boolean).some((x) => String(x).toLowerCase().includes(s));
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Activity</h1>
          <p className="mt-1 text-sm text-white/60">One timeline across the whole business — every call, text, email, note, estimate, and payment.</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity" className={`w-48 ${inpMini}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              filter === f.key ? 'bg-matrix-400/90 text-black ring-matrix-300/60' : 'bg-white/5 text-white/70 ring-white/15 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 liquid-glass rounded-2xl p-4">
        <ol className="space-y-0">
          {rows.map((a: Rec<Activity>, i) => {
            const Icon = ICON[a.type] ?? StickyNote;
            return (
              <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < rows.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-white/10" aria-hidden="true" />}
                <span className={`z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-white/15 ${TINT[a.type] ?? 'text-white/60'}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-semibold text-white">{a.title}</p>
                    {a.leadName && <span className="text-xs text-matrix-200/80">· {a.leadName}</span>}
                    <span className="ml-auto whitespace-nowrap text-xs text-white/40">{when(a.at)}</span>
                  </div>
                  {a.body && <p className="mt-0.5 whitespace-pre-wrap text-xs text-white/65">{a.body}</p>}
                  {a.actor && <p className="mt-0.5 text-[0.65rem] text-white/40">by {a.actor}</p>}
                </div>
              </li>
            );
          })}
          {items && !rows.length && (
            <li className="py-8 text-center text-sm text-white/40">
              {q || filter !== 'all' ? 'Nothing matches that filter.' : 'No activity yet — it fills in as you work leads, send estimates, and (once wired) take calls and payments.'}
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}
