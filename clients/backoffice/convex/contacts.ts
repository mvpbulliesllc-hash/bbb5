import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<unknown> } }) {
  if (!(await ctx.auth.getUserIdentity())) throw new Error('Not signed in');
}


/** Search owned lists: by zip (exact) and/or free text over addresses. */
export const search = query({
  args: { zip: v.optional(v.string()), text: v.optional(v.string()), list: v.optional(v.string()) },
  handler: async (ctx, { zip, text, list }) => {
    await requireAuth(ctx);
    let rows;
    if (text && text.trim()) {
      rows = await ctx.db
        .query('contacts')
        .withSearchIndex('search_contacts', (q) => q.search('address', text.trim()))
        .take(200);
    } else if (zip && zip.trim()) {
      rows = await ctx.db
        .query('contacts')
        .withIndex('by_zip', (q) => q.eq('zip', zip.trim()))
        .take(500);
    } else if (list && list.trim()) {
      rows = await ctx.db
        .query('contacts')
        .withIndex('by_list', (q) => q.eq('list', list.trim()))
        .take(500);
    } else {
      rows = await ctx.db.query('contacts').order('desc').take(200);
    }
    if (zip && zip.trim()) rows = rows.filter((r) => r.zip === zip.trim());
    return rows;
  },
});

export const lists = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query('contacts').collect();
    const byList: Record<string, number> = {};
    const byZip: Record<string, number> = {};
    for (const c of all) {
      if (c.list) byList[c.list] = (byList[c.list] ?? 0) + 1;
      if (c.zip) byZip[c.zip] = (byZip[c.zip] ?? 0) + 1;
    }
    return { total: all.length, byList, byZip };
  },
});

/** Bulk import — CSV rows from the UI, or data-provider payloads later. */
export const importBatch = mutation({
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
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, { list, rows }) => {
    await requireAuth(ctx);
    let inserted = 0;
    for (const row of rows.slice(0, 2000)) {
      await ctx.db.insert('contacts', { ...row, list, tags: row.tags ?? [] });
      inserted++;
    }
    return { inserted };
  },
});

export const remove = mutation({
  args: { id: v.id('contacts') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    await ctx.db.delete(id);
  },
});
