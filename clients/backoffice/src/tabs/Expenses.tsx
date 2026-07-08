import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { btnPrimary, inp, money, toNum } from '../lib/ui';

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-sand-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-navy-900/50">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold text-navy-950">{value}</p>
    </div>
  );
}

export default function Expenses() {
  const expenses = useQuery(api.expenses.list);
  const categories = useQuery(api.expenses.categories);
  const save = useMutation(api.expenses.save);
  const remove = useMutation(api.expenses.remove);
  const addCategory = useMutation(api.expenses.addCategory);

  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), category: '', amount: '', payee: '', channel: '', notes: '' });
  const [newCat, setNewCat] = useState('');
  const [catFilter, setCatFilter] = useState('');

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
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Business expenses</h1>
          <p className="mt-1 text-sm text-navy-900/60">QuickBooks-style categories — log spend here, add new categories any time.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Tile label="This month" value={money(sum(thisMonth)) as string} />
        <Tile label="All recorded" value={money(sum(all)) as string} />
        <Tile label="Entries" value={String(all.length)} />
      </div>

      {/* Add expense */}
      <form
        className="mt-5 grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200 sm:grid-cols-3"
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
          {(categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
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
        <button className={`${btnPrimary} sm:col-span-3`}>Log expense</button>
      </form>

      {/* Category manager + breakout */}
      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-sand-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-900/50">Totals by category</p>
          <form
            className="flex gap-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCat.trim()) return;
              await addCategory({ name: newCat.trim() });
              setNewCat('');
            }}
          >
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="rounded-md border border-sand-200 px-2 py-1 text-xs focus:border-gold-500 focus:outline-none" />
            <button className="rounded-md bg-navy-950 px-2.5 py-1 text-xs font-bold text-white">Add category</button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCatFilter('')}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${!catFilter ? 'bg-navy-950 text-white ring-navy-950' : 'bg-sand-50 text-navy-900/70 ring-sand-200 hover:bg-sand-100'}`}
          >
            All {money(sum(all))}
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(catFilter === c ? '' : c)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${catFilter === c ? 'bg-navy-950 text-white ring-navy-950' : 'bg-sand-50 text-navy-900/70 ring-sand-200 hover:bg-sand-100'}`}
            >
              {c}{byCategory.has(c) ? ` · ${money(byCategory.get(c))}` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="mt-5 overflow-x-auto rounded-2xl bg-white ring-1 ring-sand-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-xs uppercase tracking-wider text-navy-900/50">
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
              <tr key={e._id} className="border-b border-sand-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-navy-900/70">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-semibold text-navy-950">{e.category}</td>
                <td className="px-4 py-2 text-navy-900/80">{e.payee ?? '—'}</td>
                <td className="max-w-[16rem] truncate px-4 py-2 text-navy-900/70">{[e.channel, e.notes].filter(Boolean).join(' · ') || '—'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-navy-950">{money(e.amount)}</td>
                <td className="px-2 py-2 text-right">
                  <button
                    onClick={() => { if (confirm(`Delete ${money(e.amount)} ${e.category} expense?`)) remove({ id: e._id }); }}
                    className="rounded-md px-1.5 py-1 text-xs text-red-600/70 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-navy-900/40">No expenses logged{catFilter ? ` for ${catFilter}` : ''} yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-navy-900/45">Tip: for marketing spend, use the detail field to break out the advertising channel — the ledger shows it next to the notes.</p>
    </div>
  );
}
