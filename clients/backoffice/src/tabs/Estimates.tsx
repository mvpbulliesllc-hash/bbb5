import { useState } from 'react';
import { LiquidMetalButton } from '../components/LiquidMetalButton';
import { bare, invoiceTotals, logActivity, useKind } from '../lib/store';
import type { Estimate, Invoice, LineItem, Rec } from '../lib/store';
import { btnDark, btnMini, inp, inpMini, money, toNum } from '../lib/ui';

const STATUS_TINT: Record<string, string> = {
  draft: 'bg-white/10 text-white/70 ring-white/15',
  sent: 'bg-sky-400/15 text-sky-200 ring-sky-300/25',
  accepted: 'bg-matrix-400/15 text-matrix-200 ring-matrix-300/25',
  declined: 'bg-red-400/15 text-red-200 ring-red-300/25',
  invoiced: 'bg-matrix-400/20 text-matrix-200 ring-matrix-300/30',
};

function nextNumber(prefix: string, items: Array<{ number?: string }>) {
  const max = items.reduce((m, it) => {
    const n = parseInt((it.number || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

/** Roofing squares → a material line item (brief §6 calculator). */
function roofingLine(squares: number, wastePct: number, pricePerSquare: number): LineItem {
  const qty = +(squares * (1 + wastePct / 100)).toFixed(2);
  return { name: `Roofing material — ${squares} sq + ${wastePct}% waste`, qty, unit: 'sq', unitPrice: pricePerSquare };
}

function EstimateForm({ estimates, onDone }: { estimates: Array<Rec<Estimate>>; onDone: () => void }) {
  const { save } = useKind<Estimate>('estimate');
  const [f, setF] = useState({
    customer: '', address: '', tradeType: 'roofing',
    roofSqft: '', wastePct: '10', pricePerSquare: '', laborPerSquare: '',
    taxPct: '6.625', notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([]);
  const [li, setLi] = useState({ name: '', qty: '1', unit: '', unitPrice: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const squares = toNum(f.roofSqft) != null ? +((toNum(f.roofSqft) as number) / 100).toFixed(1) : undefined;
  const preview = invoiceTotals(items, toNum(f.taxPct) ?? 0);

  const addRoofing = () => {
    if (squares == null || toNum(f.pricePerSquare) == null) return;
    const waste = toNum(f.wastePct) ?? 0;
    const next = [...items, roofingLine(squares, waste, toNum(f.pricePerSquare) as number)];
    if (toNum(f.laborPerSquare) != null) {
      next.push({ name: `Roofing labor — ${squares} sq`, qty: squares, unit: 'sq', unitPrice: toNum(f.laborPerSquare) as number });
    }
    setItems(next);
  };

  return (
    <form
      className="grid gap-2 liquid-glass rounded-2xl p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!f.customer.trim() || !items.length) return;
        const number = nextNumber('EST', estimates);
        await save({
          number,
          customer: f.customer.trim(),
          address: f.address.trim() || undefined,
          tradeType: f.tradeType,
          lineItems: items,
          roofSquares: squares,
          wastePct: toNum(f.wastePct),
          pricePerSquare: toNum(f.pricePerSquare),
          taxPct: toNum(f.taxPct),
          status: 'draft',
          notes: f.notes.trim() || undefined,
        });
        logActivity({ type: 'estimate', title: `Estimate ${number} created — ${money(preview.total)}`, leadName: f.customer.trim(), actor: 'admin' });
        onDone();
      }}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={f.customer} onChange={set('customer')} placeholder="Customer *" className={inp} />
        <input value={f.address} onChange={set('address')} placeholder="Property address" className={inp} />
        <select value={f.tradeType} onChange={set('tradeType')} className={inp}>
          {['roofing', 'siding', 'windows', 'decks', 'gutters', 'commercial'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Roofing squares calculator */}
      <div className="mt-1 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-matrix-300">Roofing squares calculator</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <label className="text-xs text-white/60">Roof sq ft<input value={f.roofSqft} onChange={set('roofSqft')} inputMode="decimal" className={`mt-0.5 w-full ${inpMini}`} /></label>
          <label className="text-xs text-white/60">Waste %<input value={f.wastePct} onChange={set('wastePct')} inputMode="decimal" className={`mt-0.5 w-full ${inpMini}`} /></label>
          <label className="text-xs text-white/60">$ / square<input value={f.pricePerSquare} onChange={set('pricePerSquare')} inputMode="decimal" className={`mt-0.5 w-full ${inpMini}`} /></label>
          <label className="text-xs text-white/60">Labor $ / sq<input value={f.laborPerSquare} onChange={set('laborPerSquare')} inputMode="decimal" className={`mt-0.5 w-full ${inpMini}`} /></label>
          <div className="flex items-end"><button type="button" onClick={addRoofing} className={`${btnMini} w-full`}>+ Add {squares != null ? `${squares} sq` : 'squares'}</button></div>
        </div>
      </div>

      {/* Free-form line items */}
      <div className="mt-1">
        {items.map((it, i) => (
          <div key={i} className="mt-1 flex items-baseline gap-2 text-xs text-white/80">
            <span className="min-w-0 flex-1 truncate">{it.name}</span>
            <span>{it.qty}{it.unit ? ` ${it.unit}` : ''} × {money(it.unitPrice)}</span>
            <span className="w-20 text-right font-semibold">{money(it.qty * it.unitPrice)}</span>
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-300/70 hover:text-red-300">×</button>
          </div>
        ))}
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <input value={li.name} onChange={(e) => setLi({ ...li, name: e.target.value })} placeholder="Line item" className={inpMini} />
          <input value={li.qty} onChange={(e) => setLi({ ...li, qty: e.target.value })} placeholder="Qty" inputMode="decimal" className={`w-16 ${inpMini}`} />
          <input value={li.unit} onChange={(e) => setLi({ ...li, unit: e.target.value })} placeholder="Unit" className={`w-16 ${inpMini}`} />
          <input value={li.unitPrice} onChange={(e) => setLi({ ...li, unitPrice: e.target.value })} placeholder="$ each" inputMode="decimal" className={`w-20 ${inpMini}`} />
          <button
            type="button"
            onClick={() => { if (li.name.trim() && toNum(li.unitPrice) != null) { setItems([...items, { name: li.name.trim(), qty: toNum(li.qty) ?? 1, unit: li.unit.trim() || undefined, unitPrice: toNum(li.unitPrice) as number }]); setLi({ name: '', qty: '1', unit: '', unitPrice: '' }); } }}
            className={btnMini}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <label className="text-xs text-white/60">Tax %<input value={f.taxPct} onChange={set('taxPct')} inputMode="decimal" className={`ml-1.5 w-20 ${inpMini}`} /></label>
        <span className="text-xs text-white/60">Subtotal <span className="font-semibold text-white">{money(preview.subtotal)}</span></span>
        <span className="text-xs text-white/60">Tax <span className="font-semibold text-white">{money(preview.tax)}</span></span>
        <span className="text-sm font-bold text-matrix-200">Total {money(preview.total)}</span>
        <div className="ml-auto"><LiquidMetalButton type="submit" width={170} label="Save estimate" /></div>
      </div>
    </form>
  );
}

function EstimateCard({ e, onInvoiced }: { e: Rec<Estimate>; onInvoiced: () => void }) {
  const { save, remove } = useKind<Estimate>('estimate');
  const { save: saveInvoice, items: invoices } = useKind<Invoice>('invoice');
  const t = invoiceTotals(e.lineItems, e.taxPct ?? 0);

  const setStatus = (status: string) => save({ ...bare(e), status }, e.id);

  const convert = async () => {
    const number = nextNumber('INV', invoices ?? []);
    await saveInvoice({
      number,
      customer: e.customer,
      address: e.address,
      leadId: e.leadId,
      estimateId: e.id,
      lineItems: e.lineItems,
      taxPct: e.taxPct,
      amountPaid: 0,
      status: 'unpaid',
    });
    await save({ ...bare(e), status: 'invoiced' }, e.id);
    logActivity({ type: 'invoice', title: `Invoice ${number} created from ${e.number} — ${money(t.total)}`, leadName: e.customer, actor: 'admin' });
    onInvoiced();
  };

  return (
    <div className="liquid-glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-white">{e.number} · {e.customer}</p>
          <p className="truncate text-xs text-white/60">{[e.tradeType, e.address].filter(Boolean).join(' · ') || '—'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ring-1 ${STATUS_TINT[e.status] ?? ''}`}>{e.status}</span>
      </div>
      <div className="mt-2 space-y-0.5">
        {e.lineItems.map((it, i) => (
          <div key={i} className="flex items-baseline gap-2 text-xs text-white/70">
            <span className="min-w-0 flex-1 truncate">{it.name}</span>
            <span className="font-semibold text-white/85">{money(it.qty * it.unitPrice)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 border-t border-white/10 pt-2 text-xs">
        <span className="text-white/60">Total <span className="font-bold text-matrix-200">{money(t.total)}</span></span>
        <select value={e.status} onChange={(ev) => setStatus(ev.target.value)} className="ml-auto rounded-md border border-white/15 bg-white/5 px-1.5 py-1 text-xs font-semibold text-white">
          {['draft', 'sent', 'accepted', 'declined'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {e.status !== 'invoiced' ? (
          <button onClick={convert} className={btnMini}>→ Invoice</button>
        ) : (
          <span className="text-matrix-300">Invoiced ✓</span>
        )}
        <button onClick={() => { if (confirm(`Delete ${e.number}?`)) remove(e.id); }} className="text-red-300/80 hover:text-red-300">Delete</button>
      </div>
    </div>
  );
}

export default function Estimates() {
  const { items: estimates, refresh } = useKind<Estimate>('estimate');
  const [adding, setAdding] = useState(false);
  const all = estimates ?? [];
  const pipelineValue = all.filter((e) => e.status !== 'declined').reduce((n, e) => n + invoiceTotals(e.lineItems, e.taxPct ?? 0).total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Estimates</h1>
          <p className="mt-1 text-sm text-white/60">Build a quote with the roofing squares calculator, then convert it to an invoice — sales to cash.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">Open value <span className="font-bold text-matrix-200">{money(pipelineValue)}</span></span>
          <button onClick={() => setAdding(!adding)} className={btnDark}>{adding ? 'Close' : 'New estimate'}</button>
        </div>
      </div>
      {adding && <div className="mt-4"><EstimateForm estimates={all} onDone={() => { setAdding(false); refresh(); }} /></div>}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {all.map((e) => <EstimateCard key={e.id} e={e} onInvoiced={refresh} />)}
        {estimates && !all.length && !adding && <p className="text-sm text-white/50">No estimates yet — build your first quote above.</p>}
      </div>
    </div>
  );
}
