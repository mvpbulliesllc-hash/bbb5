import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Joe's QuickBooks-style chart of expense categories. These defaults live in
 * code so they're always present; user-added ones go to expenseCategories.
 */
export const DEFAULT_CATEGORIES = [
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

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query('expenses').order('desc').take(1000);
  },
});

export const categories = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const custom = await ctx.db.query('expenseCategories').collect();
    const names = new Set(DEFAULT_CATEGORIES);
    for (const c of custom) names.add(c.name);
    return [...names];
  },
});

export const addCategory = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    await requireAuth(ctx);
    const trimmed = name.trim();
    if (!trimmed || DEFAULT_CATEGORIES.includes(trimmed)) return;
    const existing = await ctx.db.query('expenseCategories').collect();
    if (existing.some((c) => c.name === trimmed)) return;
    await ctx.db.insert('expenseCategories', { name: trimmed });
  },
});

/** Create when id is omitted, update when present. */
export const save = mutation({
  args: {
    id: v.optional(v.id('expenses')),
    date: v.number(),
    category: v.string(),
    amount: v.number(),
    payee: v.optional(v.string()),
    channel: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireAuth(ctx);
    if (id) await ctx.db.patch(id, rest);
    else await ctx.db.insert('expenses', rest);
  },
});

export const remove = mutation({
  args: { id: v.id('expenses') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
