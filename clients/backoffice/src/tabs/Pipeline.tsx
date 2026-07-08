import { useState } from 'react';
import { bare, useKind } from '../lib/store';
import type { Contractor, Lead, Rec } from '../lib/store';
import { fromDateInput, money, toDateInput, toNum } from '../lib/ui';

const STAGES = ['new', 'contacted', 'estimate', 'won', 'lost'] as const;
const STAGE_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', estimate: 'Estimate', won: 'Won', lost: 'Lost' };
const STAGE_TINT: Record<string, string> = {
  new: 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25',
  contacted: 'bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/25',
  estimate: 'bg-white/10 text-white/80 ring-1 ring-white/15',
  won: 'bg-green-400/20 text-green-200 ring-1 ring-green-300/30',
  lost: 'bg-red-400/15 text-red-200 ring-1 ring-red-300/25',
};

type Save = (data: Lead, id?: number) => Promise<void>;

/** CRM job header (Joe's outline) — scope, dates, sub, and money on the job. */
function JobDetails({ lead, save }: { lead: Rec<Lead>; save: Save }) {
  const { items: contractors } = useKind<Contractor>('contractor');
  const [f, setF] = useState({
    scope: lead.scope ?? '',
    proposalSentAt: toDateInput(lead.proposalSentAt),
    contractSignedAt: toDateInput(lead.contractSignedAt),
    subAssigned: lead.subAssigned ?? '',
    scheduledAt: toDateInput(lead.scheduledAt),
    completedAt: toDateInput(lead.completedAt),
    jobCost: lead.jobCost?.toString() ?? '',
    deposit: lead.deposit?.toString() ?? '',
    additionalPayment: lead.additionalPayment?.toString() ?? '',
    finalPayment: lead.finalPayment?.toString() ?? '',
    materialCost: lead.materialCost?.toString() ?? '',
    laborCost: lead.laborCost?.toString() ?? '',
    dumpsterCost: lead.dumpsterCost?.toString() ?? '',
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setF({ ...f, [k]: e.target.value }); };

  const paid = (toNum(f.deposit) ?? 0) + (toNum(f.additionalPayment) ?? 0) + (toNum(f.finalPayment) ?? 0);
  const balance = toNum(f.jobCost) != null ? (toNum(f.jobCost) as number) - paid : undefined;
  const spend = (toNum(f.materialCost) ?? 0) + (toNum(f.laborCost) ?? 0) + (toNum(f.dumpsterCost) ?? 0);
  const net = toNum(f.jobCost) != null ? (toNum(f.jobCost) as number) - spend : undefined;

  const lbl = 'text-[0.6rem] font-bold uppercase tracking-wider text-white/45';
  const box = 'w-full rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-emerald-300/60 focus:outline-none';

  return (
    <div className="mt-2 border-t border-white/15 pt-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/50">Job details</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <label className="col-span-2"><span className={lbl}>Scope of work</span><input value={f.scope} onChange={set('scope')} className={box} /></label>
        <label><span className={lbl}>Proposal sent</span><input type="date" value={f.proposalSentAt} onChange={set('proposalSentAt')} className={box} /></label>
        <label><span className={lbl}>Contract signed</span><input type="date" value={f.contractSignedAt} onChange={set('contractSignedAt')} className={box} /></label>
        <label className="col-span-2">
          <span className={lbl}>Sub assigned</span>
          <input list="contractor-names" value={f.subAssigned} onChange={set('subAssigned')} className={box} />
          <datalist id="contractor-names">{(contractors ?? []).map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </label>
        <label><span className={lbl}>Schedule date</span><input type="date" value={f.scheduledAt} onChange={set('scheduledAt')} className={box} /></label>
        <label><span className={lbl}>Completed date</span><input type="date" value={f.completedAt} onChange={set('completedAt')} className={box} /></label>
        <label><span className={lbl}>Job cost $</span><input value={f.jobCost} onChange={set('jobCost')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Deposit $</span><input value={f.deposit} onChange={set('deposit')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Additional pmt $</span><input value={f.additionalPayment} onChange={set('additionalPayment')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Final pmt $</span><input value={f.finalPayment} onChange={set('finalPayment')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Material cost $</span><input value={f.materialCost} onChange={set('materialCost')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Labor cost $</span><input value={f.laborCost} onChange={set('laborCost')} inputMode="decimal" className={box} /></label>
        <label><span className={lbl}>Dumpster cost $</span><input value={f.dumpsterCost} onChange={set('dumpsterCost')} inputMode="decimal" className={box} /></label>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="font-semibold text-white/60">Balance owed: <span className={balance != null && balance > 0 ? 'text-red-300' : 'text-emerald-300'}>{money(balance)}</span></span>
        <span className="font-semibold text-white/60">Net: <span className="text-white">{money(net)}</span></span>
        <button
          onClick={async () => {
            await save(
              {
                ...bare(lead),
                scope: f.scope.trim() || undefined,
                proposalSentAt: fromDateInput(f.proposalSentAt),
                contractSignedAt: fromDateInput(f.contractSignedAt),
                subAssigned: f.subAssigned.trim() || undefined,
                scheduledAt: fromDateInput(f.scheduledAt),
                completedAt: fromDateInput(f.completedAt),
                jobCost: toNum(f.jobCost),
                deposit: toNum(f.deposit),
                additionalPayment: toNum(f.additionalPayment),
                finalPayment: toNum(f.finalPayment),
                materialCost: toNum(f.materialCost),
                laborCost: toNum(f.laborCost),
                dumpsterCost: toNum(f.dumpsterCost),
              },
              lead.id,
            );
            setSaved(true);
          }}
          className="ml-auto rounded-md bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30 hover:bg-emerald-400/30"
        >
          {saved ? 'Saved ✓' : 'Save job'}
        </button>
      </div>
    </div>
  );
}

function LeadCard({ lead, save, remove }: { lead: Rec<Lead>; save: Save; remove: (id: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [showJob, setShowJob] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="liquid-glass rounded-2xl p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-white">{lead.name}</p>
          <p className="truncate text-xs text-white/60">{[lead.service, lead.town].filter(Boolean).join(' · ') || '—'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${STAGE_TINT[lead.stage] ?? ''}`}>
          {STAGE_LABEL[lead.stage] ?? lead.stage}
        </span>
      </div>
      {(lead.phone || lead.email) && (
        <p className="mt-1.5 truncate text-xs text-white/75">
          {lead.phone && <a className="hover:text-emerald-300" href={`tel:${lead.phone}`}>{lead.phone}</a>}
          {lead.phone && lead.email && ' · '}
          {lead.email && <a className="hover:text-emerald-300" href={`mailto:${lead.email}`}>{lead.email}</a>}
        </p>
      )}
      <div className="mt-2.5 flex items-center gap-1.5">
        <select
          value={lead.stage}
          onChange={(e) => save({ ...bare(lead), stage: e.target.value }, lead.id)}
          className="rounded-md border border-white/15 bg-white/5 px-1.5 py-1 text-xs font-semibold text-white"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={() => setOpen(!open)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10">
          Notes{lead.notes.length ? ` (${lead.notes.length})` : ''}
        </button>
        <button onClick={() => setShowJob(!showJob)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10">
          Job{lead.jobCost != null ? ' ✓' : ''}
        </button>
        <button
          onClick={() => { if (confirm(`Delete lead "${lead.name}"?`)) remove(lead.id); }}
          className="ml-auto rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10"
        >
          Delete
        </button>
      </div>
      {open && (
        <div className="mt-2 border-t border-white/15 pt-2">
          {lead.message && <p className="mb-2 rounded-lg bg-white/5 p-2 text-xs text-white/75">{lead.message}</p>}
          {lead.notes.map((n, i) => (
            <p key={i} className="mt-1 text-xs text-white/75">
              <span className="text-white/45">{new Date(n.at).toLocaleDateString()} — </span>{n.text}
            </p>
          ))}
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) {
                save({ ...bare(lead), notes: [...lead.notes, { text: note.trim(), at: Date.now() }] }, lead.id);
                setNote('');
              }
            }}
          >
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-emerald-300/60 focus:outline-none"
            />
            <button className="rounded-md bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30 hover:bg-emerald-400/30">Save</button>
          </form>
        </div>
      )}
      {showJob && <JobDetails lead={lead} save={save} />}
    </div>
  );
}

function NewLeadForm({ save, onDone }: { save: Save; onDone: () => void }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', town: '', service: '', message: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-2 liquid-glass rounded-2xl p-4 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        await save({
          name: f.name.trim(),
          phone: f.phone.trim() || undefined,
          email: f.email.trim() || undefined,
          town: f.town.trim() || undefined,
          service: f.service.trim() || undefined,
          message: f.message.trim() || undefined,
          source: 'manual',
          stage: 'new',
          notes: [],
        });
        onDone();
      }}
    >
      {(['name', 'phone', 'email', 'town', 'service', 'message'] as const).map((k) => (
        <input
          key={k}
          value={f[k]}
          onChange={set(k)}
          placeholder={k === 'name' ? 'Name *' : k[0].toUpperCase() + k.slice(1)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:border-emerald-300/60 focus:outline-none"
        />
      ))}
      <button className="rounded-full bg-emerald-400/90 px-4 py-2 font-display text-sm font-bold text-black transition hover:bg-emerald-300 sm:col-span-3">
        Add lead
      </button>
    </form>
  );
}

export default function Pipeline() {
  const { items: leads, save, remove } = useKind<Lead>('lead');
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = (leads ?? []).filter((l) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return [l.name, l.phone, l.email, l.town, l.service, l.message].filter(Boolean).some((x) => String(x).toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Pipeline</h1>
          <p className="mt-1 text-sm text-white/60">Every lead from Ellianna, the quote calculator, and manual entry — live.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter leads"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/35 focus:border-emerald-300/60 focus:outline-none"
          />
          <button
            onClick={() => setAdding(!adding)}
            className="rounded-full liquid-glass-inset px-4 py-2 font-display text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            {adding ? 'Close' : 'New lead'}
          </button>
        </div>
      </div>
      {adding && <div className="mt-4"><NewLeadForm save={save} onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {STAGES.map((stage) => {
          const col = filtered.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="liquid-glass-inset rounded-2xl p-3">
              <p className="px-1 pb-2 font-display text-xs font-bold uppercase tracking-wider text-white/60">
                {STAGE_LABEL[stage]} <span className="text-white/40">· {col.length}</span>
              </p>
              <div className="space-y-2.5">
                {col.map((l) => <LeadCard key={l.id} lead={l} save={save} remove={remove} />)}
                {!col.length && <p className="px-1 py-3 text-center text-xs text-white/40">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
