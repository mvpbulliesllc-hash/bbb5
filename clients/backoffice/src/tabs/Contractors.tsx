import { useState } from 'react';
import { bare, useKind } from '../lib/store';
import type { Contractor, Rec } from '../lib/store';
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

type Save = (data: Contractor, id?: number) => Promise<void>;
type Form = Record<(typeof FIELDS)[number]['key'], string>;
const empty = (): Form => Object.fromEntries(FIELDS.map((f) => [f.key, ''])) as Form;

function ContractorForm({ doc, save, onDone }: { doc?: Rec<Contractor>; save: Save; onDone: () => void }) {
  const [f, setF] = useState<Form>(() =>
    doc ? (Object.fromEntries(FIELDS.map((x) => [x.key, (doc[x.key] as string | undefined) ?? ''])) as Form) : empty(),
  );
  return (
    <form
      className="grid gap-2 liquid-glass rounded-2xl p-4 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.name.trim()) return;
        await save(
          {
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
          },
          doc?.id,
        );
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

function ContractorCard({ c, save, remove }: { c: Rec<Contractor>; save: Save; remove: (id: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <ContractorForm doc={c} save={save} onDone={() => setEditing(false)} />;

  const rows: Array<[string, string | undefined]> = [
    ['Specialized in', c.specializedIn],
    ['HIC #', c.hicNumber],
    ['Insurance', c.insurance],
    ['W9', c.w9],
    ['License', c.license],
    ['Notes', c.notes],
  ];
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-white">{c.name}</p>
          <p className="truncate text-xs text-white/60">
            {c.phone && <a className="hover:text-emerald-300" href={`tel:${c.phone}`}>{c.phone}</a>}
            {c.phone && c.email && ' · '}
            {c.email && <a className="hover:text-emerald-300" href={`mailto:${c.email}`}>{c.email}</a>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete contractor "${c.name}"?`)) remove(c.id); }}
            className="rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10"
          >
            Delete
          </button>
        </div>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
        {rows.filter(([, val]) => val).map(([label, val]) => (
          <div key={label} className="flex gap-1.5 text-xs">
            <dt className="shrink-0 font-semibold text-white/50">{label}:</dt>
            <dd className="truncate text-white/80">{val}</dd>
          </div>
        ))}
      </dl>
      <ExtraFields extra={c.extra} onSave={(extra) => save({ ...bare(c), extra }, c.id)} />
    </div>
  );
}

export default function Contractors() {
  const { items: contractors, save, remove } = useKind<Contractor>('contractor');
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Contractors</h1>
          <p className="mt-1 text-sm text-white/60">Subs on file — specialty, HIC, insurance, W9 and license all in one place.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New contractor'}</button>
      </div>
      {adding && <div className="mt-4"><ContractorForm save={save} onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(contractors ?? []).map((c) => <ContractorCard key={c.id} c={c} save={save} remove={remove} />)}
        {contractors && !contractors.length && !adding && (
          <p className="text-sm text-white/50">No contractors yet — add your first sub above.</p>
        )}
      </div>
    </div>
  );
}
