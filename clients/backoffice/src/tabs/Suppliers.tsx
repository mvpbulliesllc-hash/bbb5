import { useState } from 'react';
import { bare, useKind } from '../lib/store';
import type { Rec, Supplier } from '../lib/store';
import { ExtraFields, btnDark, btnPrimary, inp, money, toNum } from '../lib/ui';

type Save = (data: Supplier, id?: number) => Promise<void>;
type Form = { company: string; phone: string; email: string; notes: string };
const empty: Form = { company: '', phone: '', email: '', notes: '' };

function SupplierForm({ doc, save, onDone }: { doc?: Rec<Supplier>; save: Save; onDone: () => void }) {
  const [f, setF] = useState<Form>(() =>
    doc ? { company: doc.company, phone: doc.phone ?? '', email: doc.email ?? '', notes: doc.notes ?? '' } : empty,
  );
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.company.trim()) return;
        await save(
          {
            company: f.company.trim(),
            phone: f.phone.trim() || undefined,
            email: f.email.trim() || undefined,
            notes: f.notes.trim() || undefined,
            materials: doc?.materials ?? [],
            extra: doc?.extra,
          },
          doc?.id,
        );
        onDone();
      }}
    >
      <input value={f.company} onChange={set('company')} placeholder="Company name *" className={inp} />
      <input value={f.phone} onChange={set('phone')} placeholder="Phone" className={inp} />
      <input value={f.email} onChange={set('email')} placeholder="Email" className={inp} />
      <input value={f.notes} onChange={set('notes')} placeholder="Notes / account #" className={inp} />
      <button className={`${btnPrimary} sm:col-span-2`}>{doc ? 'Save changes' : 'Add supplier'}</button>
    </form>
  );
}

function SupplierCard({ s, save, remove }: { s: Rec<Supplier>; save: Save; remove: (id: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [m, setM] = useState({ name: '', cost: '', unit: '' });

  const saveMaterials = (materials: Supplier['materials']) => save({ ...bare(s), materials }, s.id);

  if (editing) return <SupplierForm doc={s} save={save} onDone={() => setEditing(false)} />;
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-sand-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy-950">{s.company}</p>
          <p className="truncate text-xs text-navy-900/60">
            {s.phone && <a className="hover:text-gold-600" href={`tel:${s.phone}`}>{s.phone}</a>}
            {s.phone && s.email && ' · '}
            {s.email && <a className="hover:text-gold-600" href={`mailto:${s.email}`}>{s.email}</a>}
          </p>
          {s.notes && <p className="mt-0.5 text-xs text-navy-900/70">{s.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-navy-900/60 hover:bg-sand-100">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete supplier "${s.company}"?`)) remove(s.id); }}
            className="rounded-md px-1.5 py-1 text-xs text-red-600/70 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-wider text-navy-900/50">Materials &amp; pricing</p>
      {s.materials.map((mat, i) => (
        <div key={i} className="mt-1 flex items-baseline gap-2 text-xs text-navy-900/80">
          <span className="min-w-0 flex-1 truncate">{mat.name}</span>
          <span className="font-semibold">{money(mat.cost)}{mat.unit ? ` / ${mat.unit}` : ''}</span>
          <button
            onClick={() => saveMaterials(s.materials.filter((_, j) => j !== i))}
            className="text-red-600/60 hover:text-red-600"
            aria-label={`Remove ${mat.name}`}
          >
            ×
          </button>
        </div>
      ))}
      {!s.materials.length && <p className="mt-1 text-xs text-navy-900/40">No materials yet.</p>}
      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!m.name.trim()) return;
          saveMaterials([...s.materials, { name: m.name.trim(), cost: toNum(m.cost), unit: m.unit.trim() || undefined }]);
          setM({ name: '', cost: '', unit: '' });
        }}
      >
        <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Material" className="w-full rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
        <input value={m.cost} onChange={(e) => setM({ ...m, cost: e.target.value })} placeholder="Cost $" inputMode="decimal" className="w-24 rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
        <input value={m.unit} onChange={(e) => setM({ ...m, unit: e.target.value })} placeholder="Unit" className="w-20 rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
        <button className="rounded-md bg-navy-950 px-2.5 py-1 text-xs font-bold text-white">Add</button>
      </form>

      <ExtraFields extra={s.extra} onSave={(extra) => save({ ...bare(s), extra }, s.id)} />
    </div>
  );
}

export default function Suppliers() {
  const { items: suppliers, save, remove } = useKind<Supplier>('supplier');
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Suppliers</h1>
          <p className="mt-1 text-sm text-navy-900/60">Material suppliers with a growing price list — roofing, soffit, and whatever comes next.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New supplier'}</button>
      </div>
      {adding && <div className="mt-4"><SupplierForm save={save} onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(suppliers ?? []).map((s) => <SupplierCard key={s.id} s={s} save={save} remove={remove} />)}
        {suppliers && !suppliers.length && !adding && (
          <p className="text-sm text-navy-900/50">No suppliers yet — add one above, then build its price list from your invoices.</p>
        )}
      </div>
    </div>
  );
}
