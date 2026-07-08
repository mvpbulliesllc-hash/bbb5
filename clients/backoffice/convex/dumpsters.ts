import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const fields = {
  company: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  info: v.optional(v.string()),
  cost10: v.optional(v.number()),
  cost20: v.optional(v.number()),
  cost30: v.optional(v.number()),
  extra: v.optional(v.record(v.string(), v.string())),
};

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query('dumpsters').order('desc').collect();
  },
});

/** Create when id is omitted, update when present. */
export const save = mutation({
  args: { id: v.optional(v.id('dumpsters')), ...fields },
  handler: async (ctx, { id, ...rest }) => {
    await requireAuth(ctx);
    if (id) await ctx.db.patch(id, rest);
    else await ctx.db.insert('dumpsters', rest);
  },
});

export const remove = mutation({
  args: { id: v.id('dumpsters') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
