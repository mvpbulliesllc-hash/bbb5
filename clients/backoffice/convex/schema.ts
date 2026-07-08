import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/** Free-form key/value bag so Joe can keep adding fields without a code change. */
const extra = v.optional(v.record(v.string(), v.string()));

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
    // --- CRM header (Joe's outline): job tracking on the won work ---
    scope: v.optional(v.string()), // Scope of Work
    proposalSentAt: v.optional(v.number()),
    contractSignedAt: v.optional(v.number()),
    subAssigned: v.optional(v.string()),
    jobCost: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    deposit: v.optional(v.number()),
    additionalPayment: v.optional(v.number()),
    finalPayment: v.optional(v.number()),
    // --- P&L outline: per-job economics; balance/net computed client-side ---
    materialCost: v.optional(v.number()),
    laborCost: v.optional(v.number()),
    dumpsterCost: v.optional(v.number()),
    /** Job measurements (Roof SQ, Siding Feet, Windows Qty…) — free-form so new ones can be added. */
    measurements: v.optional(v.record(v.string(), v.string())),
  })
    .index('by_stage', ['stage'])
    .searchIndex('search_all', { searchField: 'name' }),

  /** Subcontractors — Specialized In / HIC / Insurance / W9 / License on file. */
  contractors: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    specializedIn: v.optional(v.string()),
    hicNumber: v.optional(v.string()),
    insurance: v.optional(v.string()),
    w9: v.optional(v.string()),
    license: v.optional(v.string()),
    notes: v.optional(v.string()),
    extra,
  }),

  /** Dumpster companies with per-size pricing. */
  dumpsters: defineTable({
    company: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    info: v.optional(v.string()),
    cost10: v.optional(v.number()),
    cost20: v.optional(v.number()),
    cost30: v.optional(v.number()),
    extra,
  }),

  /** Material suppliers — each carries a growing price list. */
  suppliers: defineTable({
    company: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    materials: v.array(
      v.object({ name: v.string(), cost: v.optional(v.number()), unit: v.optional(v.string()) }),
    ),
    extra,
  }),

  /** Business expenses — categories mirror the QuickBooks chart and are extendable. */
  expenses: defineTable({
    date: v.number(),
    category: v.string(),
    amount: v.number(),
    payee: v.optional(v.string()),
    /** Breakout detail, e.g. the advertising channel for marketing spend. */
    channel: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index('by_category', ['category']),

  /** User-added expense categories (defaults live in code — see expenses.ts). */
  expenseCategories: defineTable({ name: v.string() }),

  /** List-builder jobs — web research runs that fill the contacts table. */
  jobs: defineTable({
    kind: v.string(), // parallel-zip
    zip: v.string(),
    town: v.optional(v.string()),
    status: v.string(), // running | done | error
    note: v.optional(v.string()),
    count: v.optional(v.number()),
    runId: v.optional(v.string()),
  }),

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
