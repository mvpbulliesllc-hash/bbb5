import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const fields = {
  name: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  specializedIn: v.optional(v.string()),
  hicNumber: v.optional(v.string()),
  insurance: v.optional(v.string()),
  w9: v.optional(v.string()),
  license: v.optional(v.string()),
  notes: v.optional(v.string()),
  extra: v.optional(v.record(v.string(), v.string())),
};

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query('contractors').order('desc').collect();
  },
});

/** Create when id is omitted, update when present. */
export const save = mutation({
  args: { id: v.optional(v.id('contractors')), ...fields },
  handler: async (ctx, { id, ...rest }) => {
    await requireAuth(ctx);
    if (id) await ctx.db.patch(id, rest);
    else await ctx.db.insert('contractors', rest);
  },
});

export const remove = mutation({
  args: { id: v.id('contractors') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
