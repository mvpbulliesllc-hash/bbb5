import { useState } from 'react';
import { LiquidMetalButton } from '../components/LiquidMetalButton';
import { useKind } from '../lib/store';
import type { Expense, ExpenseCategory } from '../lib/store';
import { btnPrimary, inp, money, toNum } from '../lib/ui';

/** Joe's QuickBooks-style chart — defaults always present; more can be added. */
const DEFAULT_CATEGORIES = [
  'Gas',
  'Trucks',
  'Equipment/Tools',
  'Insurance',
  'Contractor Payment',
  'Supplier Payment',
  'Promotional Payment',
  'Marketing — Advertising',
  'Marketing Collateral (incl. clothes)',
  'Travel',
  'Food',
  'Partner Capital Investment',
  'Cell Phone',
  'Petty Cash',
  'Owners Draw',
  'CC Fees',
  'Office Expenses',
  'EZ Pass',
];

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="liquid-glass rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold text-white">{value}</p>
    </div>
  );
}

export default function Expenses() {
  const { items: expenses, save, remove } = useKind<Expense>('expense');
  const { items: customCats, save: saveCat } = useKind<ExpenseCategory>('expense_category');

  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), category: '', amount: '', payee: '', channel: '', notes: '' });
  const [newCat, setNewCat] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...(customCats ?? []).map((c) => c.name)])];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const all = expenses ?? [];
  const thisMonth = all.filter((e) => e.date >= monthStart);
  const sum = (xs: typeof all) => xs.reduce((n, e) => n + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const e of all) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);

  const isMarketing = /marketing|advertis|promo/i.test(f.category);
  const shown = catFilter ? all.filter((e) => e.category === catFilter) : all;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Business expenses</h1>
          <p className="mt-1 text-sm text-white/60">QuickBooks-style categories — log spend here, add new categories any time.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tile label="This month" value={money(sum(thisMonth)) as string} />
        <Tile label="All recorded" value={money(sum(all)) as string} />
        <Tile label="Entries" value={String(all.length)} />
      </div>

      {/* Add expense */}
      <form
        className="mt-5 grid gap-2 liquid-glass rounded-2xl p-4 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const amount = toNum(f.amount);
          if (!f.category || amount == null) return;
          await save({
            date: new Date(f.date + 'T12:00:00').getTime(),
            category: f.category,
            amount,
            payee: f.payee.trim() || undefined,
            channel: f.channel.trim() || undefined,
            notes: f.notes.trim() || undefined,
          });
          setF({ ...f, amount: '', payee: '', channel: '', notes: '' });
        }}
      >
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inp} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={inp}>
          <option value="">Category *</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Amount $ *" inputMode="decimal" className={inp} />
        <input value={f.payee} onChange={(e) => setF({ ...f, payee: e.target.value })} placeholder="Payee / vendor" className={inp} />
        <input
          value={f.channel}
          onChange={(e) => setF({ ...f, channel: e.target.value })}
          placeholder={isMarketing ? 'Ad channel (Google, Meta, radio…) *recommended' : 'Detail (optional)'}
          className={inp}
        />
        <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" className={inp} />
        <div className="flex justify-center sm:col-span-3"><LiquidMetalButton type="submit" width={180} label="Log expense" /></div>
      </form>

      {/* Category manager + breakout */}
      <div className="mt-5 liquid-glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Totals by category</p>
          <form
            className="flex gap-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = newCat.trim();
              if (!name || categories.includes(name)) { setNewCat(''); return; }
              await saveCat({ name });
              setNewCat('');
            }}
          >
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/35 focus:border-matrix-300/60 focus:outline-none" />
            <button className="rounded-md bg-matrix-400/20 px-2.5 py-1 text-xs font-bold text-matrix-200 ring-1 ring-matrix-300/30 hover:bg-matrix-400/30">Add category</button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCatFilter('')}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${!catFilter ? 'bg-matrix-400/90 text-black ring-matrix-300/60' : 'bg-white/5 text-white/70 ring-white/15 hover:bg-white/10'}`}
          >
            All {money(sum(all))}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(catFilter === c ? '' : c)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${catFilter === c ? 'bg-matrix-400/90 text-black ring-matrix-300/60' : 'bg-white/5 text-white/70 ring-white/15 hover:bg-white/10'}`}
            >
              {c}{byCategory.has(c) ? ` · ${money(byCategory.get(c))}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="mt-5 overflow-x-auto liquid-glass rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-white/50">
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Category</th>
              <th className="px-4 py-2.5 font-semibold">Payee</th>
              <th className="px-4 py-2.5 font-semibold">Detail</th>
              <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id} className="border-b border-white/10 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-white/70">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-semibold text-white">{e.category}</td>
                <td className="px-4 py-2 text-white/80">{e.payee ?? '—'}</td>
                <td className="max-w-[16rem] truncate px-4 py-2 text-white/70">{[e.channel, e.notes].filter(Boolean).join(' · ') || '—'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-white">{money(e.amount)}</td>
                <td className="px-2 py-2 text-right">
                  <button
                    onClick={() => { if (confirm(`Delete ${money(e.amount)} ${e.category} expense?`)) remove(e.id); }}
                    className="rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-white/40">No expenses logged{catFilter ? ` for ${catFilter}` : ''} yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-white/45">Tip: for marketing spend, use the detail field to break out the advertising channel — the ledger shows it next to the notes.</p>
    </div>
  );
}
