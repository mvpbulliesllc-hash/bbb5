import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { ExtraFields, btnDark, btnPrimary, inp } from '../lib/ui';

const FIELDS = [
  { key: 'name', label: 'Name *' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'specializedIn', label: 'Specialized in' },
  { key: 'hicNumber', label: 'HIC #' },
  { key: 'insurance', label: 'Insurance (carrier / expires)' },
  { key: 'w9', label: 'W9 (on file? date/link)' },
  { key: 'license', label: 'License' },
  { key: 'notes', label: 'Notes' },
] as const;

type Form = Record<(typeof FIELDS)[number]['key'], string>;
const empty = (): Form => Object.fromEntries(FIELDS.map((f) => [f.key, ''])) as Form;

function ContractorForm({ doc, onDone }: { doc?: Doc<'contractors'>; onDone: () => void }) {
  const save = useMutation(api.contractors.save);
  const [f, setF] = useState<Form>(() =>
    doc ? (Object.fromEntries(FIELDS.map((x) => [x.key, (doc[x.key] as string | undefined) ?? ''])) as Form) : empty(),
  );
  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        await save({
          id: doc?._id,
          name: f.name.trim(),
          phone: f.phone.trim() || undefined,
          email: f.email.trim() || undefined,
          specializedIn: f.specializedIn.trim() || undefined,
          hicNumber: f.hicNumber.trim() || undefined,
          insurance: f.insurance.trim() || undefined,
          w9: f.w9.trim() || undefined,
          license: f.license.trim() || undefined,
          notes: f.notes.trim() || undefined,
          extra: doc?.extra,
        });
        onDone();
      }}
    >
      {FIELDS.map(({ key, label }) => (
        <input key={key} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} placeholder={label} className={inp} />
      ))}
      <button className={`${btnPrimary} sm:col-span-3`}>{doc ? 'Save changes' : 'Add contractor'}</button>
    </form>
  );
}

function ContractorCard({ c }: { c: Doc<'contractors'> }) {
  const save = useMutation(api.contractors.save);
  const remove = useMutation(api.contractors.remove);
  const [editing, setEditing] = useState(false);

  if (editing) return <ContractorForm doc={c} onDone={() => setEditing(false)} />;

  const rows: Array<[string, string | undefined]> = [
    ['Specialized in', c.specializedIn],
    ['HIC #', c.hicNumber],
    ['Insurance', c.insurance],
    ['W9', c.w9],
    ['License', c.license],
    ['Notes', c.notes],
  ];
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-sand-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy-950">{c.name}</p>
          <p className="truncate text-xs text-navy-900/60">
            {c.phone && <a className="hover:text-gold-600" href={`tel:${c.phone}`}>{c.phone}</a>}
            {c.phone && c.email && ' · '}
            {c.email && <a className="hover:text-gold-600" href={`mailto:${c.email}`}>{c.email}</a>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-navy-900/60 hover:bg-sand-100">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete contractor "${c.name}"?`)) remove({ id: c._id }); }}
            className="rounded-md px-1.5 py-1 text-xs text-red-600/70 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
        {rows.filter(([, val]) => val).map(([label, val]) => (
          <div key={label} className="flex gap-1.5 text-xs">
            <dt className="shrink-0 font-semibold text-navy-900/50">{label}:</dt>
            <dd className="truncate text-navy-900/80">{val}</dd>
          </div>
        ))}
      </dl>
      <ExtraFields extra={c.extra} onSave={(extra) => save({ id: c._id, name: c.name, extra })} />
    </div>
  );
}

export default function Contractors() {
  const contractors = useQuery(api.contractors.list);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Contractors</h1>
          <p className="mt-1 text-sm text-navy-900/60">Subs on file — specialty, HIC, insurance, W9 and license all in one place.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New contractor'}</button>
      </div>
      {adding && <div className="mt-4"><ContractorForm onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(contractors ?? []).map((c) => <ContractorCard key={c._id} c={c} />)}
        {contractors && !contractors.length && !adding && (
          <p className="text-sm text-navy-900/50">No contractors yet — add your first sub above.</p>
        )}
      </div>
    </div>
  );
}
