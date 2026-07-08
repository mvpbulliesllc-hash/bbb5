import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';

const STAGES = ['new', 'contacted', 'estimate', 'won', 'lost'] as const;
const STAGE_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', estimate: 'Estimate', won: 'Won', lost: 'Lost' };
const STAGE_TINT: Record<string, string> = {
  new: 'bg-gold-100 text-gold-600',
  contacted: 'bg-navy-100 text-navy-800',
  estimate: 'bg-sand-100 text-navy-900',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-50 text-red-700',
};

function LeadCard({ lead }: { lead: Doc<'leads'> }) {
  const setStage = useMutation(api.leads.setStage);
  const addNote = useMutation(api.leads.addNote);
  const remove = useMutation(api.leads.remove);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="rounded-xl bg-white p-3.5 ring-1 ring-sand-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy-950">{lead.name}</p>
          <p className="truncate text-xs text-navy-900/60">{[lead.service, lead.town].filter(Boolean).join(' · ') || '—'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${STAGE_TINT[lead.stage] ?? ''}`}>
          {STAGE_LABEL[lead.stage] ?? lead.stage}
        </span>
      </div>
      {(lead.phone || lead.email) && (
        <p className="mt-1.5 truncate text-xs text-navy-900/75">
          {lead.phone && <a className="hover:text-gold-600" href={`tel:${lead.phone}`}>{lead.phone}</a>}
          {lead.phone && lead.email && ' · '}
          {lead.email && <a className="hover:text-gold-600" href={`mailto:${lead.email}`}>{lead.email}</a>}
        </p>
      )}
      <div className="mt-2.5 flex items-center gap-1.5">
        <select
          value={lead.stage}
          onChange={(e) => setStage({ id: lead._id, stage: e.target.value })}
          className="rounded-md border border-sand-200 bg-sand-50 px-1.5 py-1 text-xs font-semibold text-navy-900"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABEL[s]}</option>
          ))}
        </select>
        <button onClick={() => setOpen(!open)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-navy-900/60 hover:bg-sand-100">
          Notes{lead.notes.length ? ` (${lead.notes.length})` : ''}
        </button>
        <button
          onClick={() => { if (confirm(`Delete lead "${lead.name}"?`)) remove({ id: lead._id }); }}
          className="ml-auto rounded-md px-1.5 py-1 text-xs text-red-600/70 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
      {open && (
        <div className="mt-2 border-t border-sand-200 pt-2">
          {lead.message && <p className="mb-2 rounded-lg bg-sand-50 p-2 text-xs text-navy-900/75">{lead.message}</p>}
          {lead.notes.map((n, i) => (
            <p key={i} className="mt-1 text-xs text-navy-900/75">
              <span className="text-navy-900/45">{new Date(n.at).toLocaleDateString()} — </span>{n.text}
            </p>
          ))}
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addNote({ id: lead._id, text: note.trim() }); setNote(''); } }}
          >
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              className="w-full rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none"
            />
            <button className="rounded-md bg-navy-950 px-2.5 py-1 text-xs font-bold text-white">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}

function NewLeadForm({ onDone }: { onDone: () => void }) {
  const create = useMutation(api.leads.create);
  const [f, setF] = useState({ name: '', phone: '', email: '', town: '', service: '', message: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        await create({
          name: f.name.trim(),
          phone: f.phone.trim() || undefined,
          email: f.email.trim() || undefined,
          town: f.town.trim() || undefined,
          service: f.service.trim() || undefined,
          message: f.message.trim() || undefined,
          source: 'manual',
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
          className="rounded-lg border border-sand-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
        />
      ))}
      <button className="rounded-lg bg-gold-500 px-4 py-2 font-display text-sm font-bold text-navy-950 hover:bg-gold-400 sm:col-span-3">
        Add lead
      </button>
    </form>
  );
}

export default function Pipeline() {
  const leads = useQuery(api.leads.board);
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
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Pipeline</h1>
          <p className="mt-1 text-sm text-navy-900/60">Every lead from Eli, the quote calculator, and manual entry — live.</p>
        </div>
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter leads"
            className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
          />
          <button
            onClick={() => setAdding(!adding)}
            className="rounded-lg bg-navy-950 px-4 py-2 font-display text-sm font-bold text-white hover:bg-navy-900"
          >
            {adding ? 'Close' : 'New lead'}
          </button>
        </div>
      </div>
      {adding && <div className="mt-4"><NewLeadForm onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {STAGES.map((stage) => {
          const col = filtered.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="rounded-2xl bg-sand-100/60 p-3 ring-1 ring-sand-200">
              <p className="px-1 pb-2 font-display text-xs font-bold uppercase tracking-wider text-navy-900/60">
                {STAGE_LABEL[stage]} <span className="text-navy-900/40">· {col.length}</span>
              </p>
              <div className="space-y-2.5">
                {col.map((l) => <LeadCard key={l._id} lead={l} />)}
                {!col.length && <p className="px-1 py-3 text-center text-xs text-navy-900/40">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
