import { useState } from 'react';
import { bare, invoiceTotals, logActivity, useKind } from '../lib/store';
import type { Invoice, Rec } from '../lib/store';
import { btnMini, inpMini, money, toNum } from '../lib/ui';

const STATUS_TINT: Record<string, string> = {
  unpaid: 'bg-red-400/15 text-red-200 ring-red-300/25',
  partial: 'bg-sky-400/15 text-sky-200 ring-sky-300/25',
  paid: 'bg-matrix-400/20 text-matrix-200 ring-matrix-300/30',
};

function InvoiceRow({ inv }: { inv: Rec<Invoice> }) {
  const { save, remove } = useKind<Invoice>('invoice');
  const [pay, setPay] = useState('');
  const t = invoiceTotals(inv.lineItems, inv.taxPct ?? 0);
  const paid = inv.amountPaid ?? 0;
  const due = t.total - paid;

  const record = async () => {
    const amt = toNum(pay);
    if (amt == null || amt <= 0) return;
    const newPaid = Math.min(t.total, paid + amt);
    const status = newPaid >= t.total - 0.005 ? 'paid' : 'partial';
    await save({ ...bare(inv), amountPaid: newPaid, status }, inv.id);
    logActivity({ type: 'payment', title: `Payment ${money(amt)} on ${inv.number}`, body: status === 'paid' ? 'Invoice paid in full' : `${money(t.total - newPaid)} remaining`, leadName: inv.customer, direction: 'in', amount: amt, actor: 'admin' });
    setPay('');
  };

  return (
    <tr className="border-b border-white/10 last:border-0 align-top">
      <td className="whitespace-nowrap px-3 py-2 font-semibold text-white">{inv.number}</td>
      <td className="px-3 py-2 text-white/80">{inv.customer}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-white/85">{money(t.total)}</td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-white/60">{money(paid)}</td>
      <td className={`whitespace-nowrap px-3 py-2 text-right font-semibold ${due > 0 ? 'text-red-300' : 'text-matrix-300'}`}>{money(due)}</td>
      <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold ring-1 ${STATUS_TINT[inv.status] ?? ''}`}>{inv.status}</span></td>
      <td className="px-3 py-2">
        {inv.status !== 'paid' ? (
          <div className="flex items-center gap-1">
            <input value={pay} onChange={(e) => setPay(e.target.value)} placeholder="$ amt" inputMode="decimal" className={`w-20 ${inpMini}`} />
            <button onClick={record} className={btnMini}>Record</button>
          </div>
        ) : (
          <button onClick={() => { if (confirm(`Delete ${inv.number}?`)) remove(inv.id); }} className="text-xs text-red-300/70 hover:text-red-300">Delete</button>
        )}
      </td>
    </tr>
  );
}

export default function Invoices() {
  const { items: invoices } = useKind<Invoice>('invoice');
  const all = invoices ?? [];

  const totals = all.map((inv) => ({ inv, ...invoiceTotals(inv.lineItems, inv.taxPct ?? 0) }));
  const outstanding = totals.reduce((n, t) => n + (t.total - (t.inv.amountPaid ?? 0)), 0);
  const collected = totals.reduce((n, t) => n + (t.inv.amountPaid ?? 0), 0);

  // AR aging by invoice creation date
  const now = Date.now();
  const buckets = { '0–30': 0, '31–60': 0, '61–90': 0, '90+': 0 };
  for (const t of totals) {
    const due = t.total - (t.inv.amountPaid ?? 0);
    if (due <= 0.005) continue;
    const days = (now - new Date(t.inv.createdAt).getTime()) / 86400000;
    if (days <= 30) buckets['0–30'] += due;
    else if (days <= 60) buckets['31–60'] += due;
    else if (days <= 90) buckets['61–90'] += due;
    else buckets['90+'] += due;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-white">Invoices</h1>
      <p className="mt-1 text-sm text-white/60">Bill, take deposits and progress payments, and track what you're owed.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="liquid-glass rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Outstanding (AR)</p><p className="font-display mt-1 text-2xl font-extrabold text-red-300">{money(outstanding)}</p></div>
        <div className="liquid-glass rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Collected</p><p className="font-display mt-1 text-2xl font-extrabold text-matrix-200">{money(collected)}</p></div>
        <div className="liquid-glass rounded-2xl p-4"><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Invoices</p><p className="font-display mt-1 text-2xl font-extrabold text-white">{all.length}</p></div>
      </div>

      <div className="mt-4 liquid-glass rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">AR aging</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Object.entries(buckets).map(([label, v]) => (
            <div key={label} className="rounded-lg bg-white/5 p-2 text-center ring-1 ring-white/10">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-white/50">{label} days</p>
              <p className={`font-display text-sm font-extrabold ${label === '90+' && v > 0 ? 'text-red-300' : 'text-white'}`}>{money(v)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto liquid-glass rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-white/50">
              <th className="px-3 py-2.5 font-semibold">Invoice</th>
              <th className="px-3 py-2.5 font-semibold">Customer</th>
              <th className="px-3 py-2.5 text-right font-semibold">Total</th>
              <th className="px-3 py-2.5 text-right font-semibold">Paid</th>
              <th className="px-3 py-2.5 text-right font-semibold">Due</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Payment</th>
            </tr>
          </thead>
          <tbody>
            {all.map((inv) => <InvoiceRow key={inv.id} inv={inv} />)}
            {invoices && !all.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-white/40">No invoices yet — convert an accepted estimate from the Estimates tab.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
