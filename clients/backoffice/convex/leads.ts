import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';

const leadFields = {
  name: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.optional(v.string()),
  town: v.optional(v.string()),
  zip: v.optional(v.string()),
  service: v.optional(v.string()),
  message: v.optional(v.string()),
  source: v.optional(v.string()),
  utm: v.optional(v.record(v.string(), v.string())),
};

/** Unauthenticated path for the website's server-to-server ingest (http.ts guards it with INGEST_SECRET). */
export const ingest = internalMutation({
  args: leadFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert('leads', { ...args, stage: 'new', notes: [] });
  },
});

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}


export const board = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query('leads').order('desc').take(500);
    return all;
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query('leads').collect();
    const byStage: Record<string, number> = {};
    for (const l of all) byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const last7 = all.filter((l) => now - l._creationTime < 7 * dayMs).length;
    return { total: all.length, byStage, last7 };
  },
});

export const create = mutation({
  args: leadFields,
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.insert('leads', { ...args, stage: 'new', notes: [] });
  },
});

export const setStage = mutation({
  args: { id: v.id('leads'), stage: v.string() },
  handler: async (ctx, { id, stage }) => {
    await requireAuth(ctx);
    await ctx.db.patch(id, { stage });
  },
});

export const addNote = mutation({
  args: { id: v.id('leads'), text: v.string() },
  handler: async (ctx, { id, text }) => {
    await requireAuth(ctx);
    const lead = await ctx.db.get(id);
    if (!lead) return;
    await ctx.db.patch(id, { notes: [...lead.notes, { text, at: Date.now() }] });
  },
});

/** CRM header (Joe's outline) — job tracking fields, all optional patches. */
export const updateJob = mutation({
  args: {
    id: v.id('leads'),
    scope: v.optional(v.string()),
    proposalSentAt: v.optional(v.number()),
    contractSignedAt: v.optional(v.number()),
    subAssigned: v.optional(v.string()),
    jobCost: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    deposit: v.optional(v.number()),
    additionalPayment: v.optional(v.number()),
    finalPayment: v.optional(v.number()),
    materialCost: v.optional(v.number()),
    laborCost: v.optional(v.number()),
    dumpsterCost: v.optional(v.number()),
    measurements: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { id, ...rest }) => {
    await requireAuth(ctx);
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id('leads') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
