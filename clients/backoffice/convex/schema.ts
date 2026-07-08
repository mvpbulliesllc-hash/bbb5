import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  /** Sales pipeline — every website lead lands here via http.ts ingest. */
  leads: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    town: v.optional(v.string()),
    zip: v.optional(v.string()),
    service: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()), // eli-chat | quote-calculator | manual | import
    stage: v.string(), // new | contacted | estimate | won | lost
    notes: v.array(v.object({ text: v.string(), at: v.number() })),
    utm: v.optional(v.record(v.string(), v.string())),
  })
    .index('by_stage', ['stage'])
    .searchIndex('search_all', { searchField: 'name' }),

  /** Owned prospect lists — zip → address → owner → contact info. */
  contacts: defineTable({
    address: v.string(),
    ownerName: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    town: v.optional(v.string()),
    zip: v.optional(v.string()),
    list: v.optional(v.string()), // which list/import batch this came from
    tags: v.array(v.string()),
    enriched: v.optional(v.record(v.string(), v.string())), // provider data (Clay, Apollo, Bright Data…)
  })
    .index('by_zip', ['zip'])
    .index('by_list', ['list'])
    .searchIndex('search_contacts', { searchField: 'address' }),
});
