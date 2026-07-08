import { useState } from 'react';
import { LiquidMetalButton } from '../components/LiquidMetalButton';
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
      className="grid gap-2 liquid-glass rounded-2xl p-4 sm:grid-cols-2"
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
      <div className="flex justify-center sm:col-span-2"><LiquidMetalButton type="submit" width={180} label={doc ? 'Save changes' : 'Add supplier'} /></div>
    </form>
  );
}

function SupplierCard({ s, save, remove }: { s: Rec<Supplier>; save: Save; remove: (id: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [m, setM] = useState({ name: '', cost: '', unit: '' });

  const saveMaterials = (materials: Supplier['materials']) => save({ ...bare(s), materials }, s.id);

  if (editing) return <SupplierForm doc={s} save={save} onDone={() => setEditing(false)} />;
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-white">{s.company}</p>
          <p className="truncate text-xs text-white/60">
            {s.phone && <a className="hover:text-matrix-300" href={`tel:${s.phone}`}>{s.phone}</a>}
            {s.phone && s.email && ' · '}
            {s.email && <a className="hover:text-matrix-300" href={`mailto:${s.email}`}>{s.email}</a>}
          </p>
          {s.notes && <p className="mt-0.5 text-xs text-white/70">{s.notes}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => setEditing(true)} className="rounded-md px-1.5 py-1 text-xs font-semibold text-white/60 hover:bg-white/10">Edit</button>
          <button
            onClick={() => { if (confirm(`Delete supplier "${s.company}"?`)) remove(s.id); }}
            className="rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-wider text-white/50">Materials &amp; pricing</p>
      {s.materials.map((mat, i) => (
        <div key={i} className="mt-1 flex items-baseline gap-2 text-xs text-white/80">
          <span className="min-w-0 flex-1 truncate">{mat.name}</span>
          <span className="font-semibold">{money(mat.cost)}{mat.unit ? ` / ${mat.unit}` : ''}</span>
          <button
            onClick={() => saveMaterials(s.materials.filter((_, j) => j !== i))}
            className="text-red-300/70 hover:text-red-300"
            aria-label={`Remove ${mat.name}`}
          >
            ×
          </button>
        </div>
      ))}
      {!s.materials.length && <p className="mt-1 text-xs text-white/40">No materials yet.</p>}
      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!m.name.trim()) return;
          saveMaterials([...s.materials, { name: m.name.trim(), cost: toNum(m.cost), unit: m.unit.trim() || undefined }]);
          setM({ name: '', cost: '', unit: '' });
        }}
      >
        <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Material" className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none" />
        <input value={m.cost} onChange={(e) => setM({ ...m, cost: e.target.value })} placeholder="Cost $" inputMode="decimal" className="w-24 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none" />
        <input value={m.unit} onChange={(e) => setM({ ...m, unit: e.target.value })} placeholder="Unit" className="w-20 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none" />
        <button className="rounded-md bg-matrix-400/20 px-2.5 py-1 text-xs font-bold text-matrix-200 ring-1 ring-matrix-300/30 hover:bg-matrix-400/30">Add</button>
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
          <h1 className="font-display text-2xl font-extrabold text-white">Suppliers</h1>
          <p className="mt-1 text-sm text-white/60">Material suppliers with a growing price list — roofing, soffit, and whatever comes next.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New supplier'}</button>
      </div>
      {adding && <div className="mt-4"><SupplierForm save={save} onDone={() => setAdding(false)} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(suppliers ?? []).map((s) => <SupplierCard key={s.id} s={s} save={save} remove={remove} />)}
        {suppliers && !suppliers.length && !adding && (
          <p className="text-sm text-white/50">No suppliers yet — add one above, then build its price list from your invoices.</p>
        )}
      </div>
    </div>
  );
}
