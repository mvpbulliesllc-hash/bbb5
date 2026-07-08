import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}

/** Kick off a web-research list build for a zip (Parallel task API). */
export const start = mutation({
  args: { zip: v.string(), town: v.optional(v.string()) },
  handler: async (ctx, { zip, town }) => {
    await requireAuth(ctx);
    const cleanZip = zip.trim();
    if (!/^\d{5}$/.test(cleanZip)) throw new Error('Enter a 5-digit zip');
    const jobId = await ctx.db.insert('jobs', { kind: 'parallel-zip', zip: cleanZip, town: town?.trim() || undefined, status: 'running' });
    await ctx.scheduler.runAfter(0, internal.listbuilderAction.run, { jobId, zip: cleanZip, town: town?.trim() || undefined });
    return jobId;
  },
});

/** Admin/automation entry point (no user identity) — same flow as `start`. */
export const startInternal = internalMutation({
  args: { zip: v.string(), town: v.optional(v.string()) },
  handler: async (ctx, { zip, town }) => {
    const jobId = await ctx.db.insert('jobs', { kind: 'parallel-zip', zip: zip.trim(), town: town?.trim() || undefined, status: 'running' });
    await ctx.scheduler.runAfter(0, internal.listbuilderAction.run, { jobId, zip: zip.trim(), town: town?.trim() || undefined });
    return jobId;
  },
});

export const jobs = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query('jobs').order('desc').take(25);
  },
});

export const finishJob = internalMutation({
  args: { jobId: v.id('jobs'), status: v.string(), note: v.optional(v.string()), count: v.optional(v.number()), runId: v.optional(v.string()) },
  handler: async (ctx, { jobId, ...rest }) => {
    await ctx.db.patch(jobId, rest);
  },
});

export const importRows = internalMutation({
  args: {
    list: v.string(),
    rows: v.array(
      v.object({
        address: v.string(),
        ownerName: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        town: v.optional(v.string()),
        zip: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { list, rows }) => {
    let inserted = 0;
    for (const row of rows.slice(0, 1000)) {
      await ctx.db.insert('contacts', { ...row, list, tags: ['web-research'] });
      inserted++;
    }
    return { inserted };
  },
});
