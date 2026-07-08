import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { ExtraFields, btnDark, btnPrimary, inp, money, toNum } from '../lib/ui';

type Form = { company: string; phone: string; email: string; info: string; cost10: string; cost20: string; cost30: string };
const empty: Form = { company: '', phone: '', email: '', info: '', cost10: '', cost20: '', cost30: '' };

function DumpsterForm({ doc, onDone }: { doc?: Doc<'dumpsters'>; onDone: () => void }) {
  const save = useMutation(api.dumpsters.save);
  const [f, setF] = useState<Form>(() =>
    doc
      ? {
          company: doc.company, phone: doc.phone ?? '', email: doc.email ?? '', info: doc.info ?? '',
          cost10: doc.cost10?.toString() ?? '', cost20: doc.cost20?.toString() ?? '', cost30: doc.cost30?.toString() ?? '',
        }
      : empty,
  );
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.company.trim()) return;
        await save({
          id: doc?._id,
          company: f.company.trim(),
          phone: f.phone.trim() || undefined,
          email: f.email.trim() || undefined,
          info: f.info.trim() || undefined,
          cost10: toNum(f.cost10),
          cost20: toNum(f.cost20),
          cost30: toNum(f.cost30),
          extra: doc?.extra,
        });
        onDone();
      }}
    >
      <input value={f.company} onChange={set('company')} placeholder="Company *" className={inp} />
      <input value={f.phone} onChange={set('phone')} placeholder="Phone" className={inp} />
      <input value={f.email} onChange={set('email')} placeholder="Email" className={inp} />
      <input value={f.info} onChange={set('info')} placeholder="Company info / account #" className={`${inp} sm:col-span-3`} />
      <input value={f.cost10} onChange={set('cost10')} placeholder="10-yarder cost ($)" className={inp} inputMode="decimal" />
      <input value={f.cost20} onChange={set('cost20')} placeholder="20-yarder cost ($)" className={inp} inputMode="decimal" />
      <input value={f.cost30} onChange={set('cost30')} placeholder="30-yarder cost ($)" className={inp} inputMode="decimal" />
      <button className={`${btnPrimary} sm:col-span-3`}>{doc ? 'Save changes' : 'Add dumpster company'}</button>
    </form>
  );
}

function DumpsterCard({ d }: { d: Doc<'dumpsters'> }) {
  const save = useMutation(api.dumpsters.save);
  const remove = useMutation(api.dumpsters.remove);
  const [editing, setEditing] = useState(false);
  if (editing) return <DumpsterForm doc={d} onDone={() => setEditing(false)} />;
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-sand-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy-950">{d.company}</p>
          <p className="truncate text-xs text-navy-900/60">
            {d.phone && <a className="hover:text-gold-600" href={`tel:${d.phone}`}>{d.phone}</a>}
            {d.phone && d.email && ' · '}
            {d.email && <a className="hover:text-gold-600" href={`mailto:${d.email}`}>{d.email}</a>}
          </p>
          {d.info && <p className="mt-0.5 text-xs text-navy-900/70">{d.info}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-navy-900/60 hover:bg-sand-100">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete "${d.company}"?`)) remove({ id: d._id }); }}
            className="rounded-md px-1.5 py-1 text-xs text-red-600/70 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {([['10 yd', d.cost10], ['20 yd', d.cost20], ['30 yd', d.cost30]] as const).map(([label, cost]) => (
          <div key={label} className="rounded-lg bg-sand-50 p-2 text-center ring-1 ring-sand-200">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-navy-900/50">{label}</p>
            <p className="font-display text-sm font-extrabold text-navy-950">{money(cost)}</p>
          </div>
        ))}
      </div>
      <ExtraFields extra={d.extra} onSave={(extra) => save({ id: d._id, company: d.company, extra })} />
    </div>
  );
}

export default function Dumpsters() {
  const dumpsters = useQuery(api.dumpsters.list);
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Dumpsters</h1>
          <p className="mt-1 text-sm text-navy-900/60">Haulers on file with 10 / 20 / 30-yarder pricing.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New company'}</button>
      </div>
      {adding && <div className="mt-4"><DumpsterForm onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(dumpsters ?? []).map((d) => <DumpsterCard key={d._id} d={d} />)}
        {dumpsters && !dumpsters.length && !adding && (
          <p className="text-sm text-navy-900/50">No dumpster companies yet — add one above.</p>
        )}
      </div>
    </div>
  );
}
