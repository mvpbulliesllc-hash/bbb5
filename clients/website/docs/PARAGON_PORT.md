# PARAGON_PORT.md — Home Improvement bolt-on port map

> How the **Home Improvement** section is structured on Paragon (`clients/website`) so it is
> **portable** — buildable here, and importable from/into the One Day Home Improvements site as a
> self-contained module set. This is the integration contract for brief #3 ("bolt-on").

## Status

| Piece | State |
|---|---|
| Paragon Home Improvement section (hubs + town pages + schema) | ✅ Built on `claude/full-buildout` |
| Portable module contract (this document) | ✅ Complete |
| One Day repo — parity (Brief #2) | ✅ Built — the One Day repo is **`mvpbulliesllc-hash/compute-the-platform-to-build-1l`** (a Next.js app), branch `claude/full-buildout`, PR #4. Real NAP, fabricated reviews removed, robots/sitemap/llms/JSON-LD added, leads wired to the CRM. |
| One Day → Paragon component import | ▶ **Executable recipe below** — One Day's modules are now real and portable (`lib/business.ts` `serviceModules`). Import is a business-scope decision (see note) since One Day serves **North NJ** and Paragon serves **Ocean/Monmouth**. |

## What "portable" means here

Paragon's site has **no per-page code** for service or town pages. A page is fully described by a
content-collection markdown file (frontmatter + body); routing, layout, schema, OG cards, and GEO
endpoints are generic and collection-driven. That means a "module" = a set of markdown files plus
(optionally) shared components, and porting it is a **file copy + a config check**, not a rewrite.

The portable surface:

| Concern | Where it lives | Portable? |
|---|---|---|
| Page content | `src/content/services/*.md`, `src/content/combos/*.md` | ✅ copy the files |
| Routing | `src/pages/[service]/index.astro`, `src/pages/[service]/[town].astro` | ✅ generic, already present |
| JSON-LD (Service / FAQPage / BreadcrumbList / Org) | `src/lib/schema.ts` | ✅ generic builders |
| Business identity (NAP, license) | `src/config/business.ts` | ✅ single source — swap per site |
| GEO endpoints (`/llms.txt`, `/llms-full.txt`, sitemap, robots) | `src/pages/*.ts`, `public/robots.txt` | ✅ auto-include new content |
| Lead capture → CRM | `src/components/LeadForm.astro` | ✅ same webhook contract |

## The Home Improvement section = these modules

Built on Paragon now (each is a service hub + FAQ + Service/Breadcrumb schema + answer blocks;
several also have priority-town combo pages):

| Module (service id) | Hub URL | Town combos built | Notes |
|---|---|---|---|
| `full-home-renovation` | `/full-home-renovation/` | 10 priority towns | GC-led, exterior+interior |
| `kitchen-remodel` | `/kitchen-remodel/` | 10 priority towns | |
| `bathroom-remodel` | `/bathroom-remodel/` | 10 priority towns | waterproofing focus |
| `flooring` | `/flooring/` | 10 priority towns | LVP / hardwood / tile |
| `hvac` | `/hvac/` | 10 priority towns | AC / heat pump / furnace |
| `exterior-paint` | `/exterior-paint/` | hub only | town combos staged |
| `interior-doors` | `/interior-doors/` | hub only | low local-search intent by design |

Priority towns (combos): Toms River, Brick, Lakewood, Jackson, Howell, Freehold, Middletown,
Point Pleasant, Manchester, Berkeley Township.

## One Day → Paragon component mapping (target contract)

When the One Day repo is available, map its home-improvement modules onto Paragon as follows. Each
One Day module becomes (a) a Paragon `services/*.md` hub and (b) optional `combos/*.md` town pages,
reusing Paragon's generic routing/schema. One Day's **AI photo-visualizer / Glow Up Studio** should
port as a shared component embedded in the relevant hub bodies.

One Day's real, portable module source is **`lib/business.ts` → `serviceModules`** (each has
`slug, name, blurb, description, image, highlight`), consumed by `components/home/services.tsx` and
`components/json-ld.tsx`. The lead contract is **`app/api/lead/route.ts`** (POST → CRM with a
`tenant` header — identical to Paragon's `LeadForm`). The AI visualizer is
**`components/home/glow-up-studio.tsx`** + **`app/api/glow-up/route.ts`**.

| One Day module (real source) | → Paragon target | Action on import |
|---|---|---|
| `serviceModules['decks']` | `services/decks.md` (exists) | reconcile copy; keep Paragon frontmatter/schema |
| `serviceModules['windows']` | `services/windows.md` (exists) | reconcile copy |
| `serviceModules['doors']` | `services/doors.md` (exists) | reconcile copy |
| `serviceModules['window-treatments']` | **new** `services/window-treatments.md` | only if Paragon offers it in Ocean/Monmouth — see note |
| Glow Up Studio (`glow-up-studio.tsx` + `/api/glow-up`) | Paragon `Visualizer` component (Paragon already surfaces AI viz via the CTO bio + Eli widget) | port UX; reuse Paragon `LeadForm` + `business.ts` NAP |
| `/api/lead` CRM contract | Paragon `LeadForm` → `PUBLIC_LEADS_API` | already identical (`tenant` header) — no change |

### Import procedure

1. `serviceModules` in One Day is framework-agnostic data — copy the object into a Paragon
   `services/*.md` frontmatter/body (Paragon's Zod schema wins; take the stronger prose).
2. For the visualizer, port `glow-up-studio.tsx` UX into a Paragon Astro/React island, keeping
   Paragon's `LeadForm` → CRM webhook and `business.ts` NAP.
3. `npm run build` in `clients/website`; validate JSON-LD in Rich Results Test.
4. No routing/schema changes — the generic `[service]` routes already serve new hubs.

> **Business-scope note (owner decision):** One Day serves **North NJ** (Bergen/Essex/Morris/Passaic/
> Union/Hudson); Paragon serves **Ocean/Monmouth**. Decks/windows/doors already exist on Paragon, so
> the only *new* import is **window treatments** — do not add it to Paragon unless Paragon actually
> offers it in its territory (adding it silently would misrepresent scope/area). The two sites
> already cross-link as sister companies (One Day's footer → Paragon). Confirm before importing
> window-treatments or the visualizer as public Paragon pages.

## Guardrails carried into any port

- NAP is single-source (`business.ts`) — never hard-code phone/license in a ported component.
- Real data only — no fabricated reviews/stats travel with a module.
- New hubs default `comboEligible: false` so `TownGrid` never links to a town combo that doesn't
  exist (avoids doorway 404s); flip to `true` only when all 38 town combos exist for that service.
