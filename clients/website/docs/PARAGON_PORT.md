# PARAGON_PORT.md — Home Improvement bolt-on port map

> How the **Home Improvement** section is structured on Paragon (`clients/website`) so it is
> **portable** — buildable here, and importable from/into the One Day Home Improvements site as a
> self-contained module set. This is the integration contract for brief #3 ("bolt-on").

## Status

| Piece | State |
|---|---|
| Paragon Home Improvement section (hubs + town pages + schema) | ✅ Built on `claude/full-buildout` |
| Portable module contract (this document) | ✅ Complete |
| One Day → Paragon component import | ⛔ **Blocked** — the One Day repo (`mvpbulliesllc-hash/onedayhomeimprovements`) is not accessible to this session (not found / no access). The Paragon side is built to receive it; the actual import runs once the repo is added. |

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

| One Day module (expected) | → Paragon target | Action on import |
|---|---|---|
| Decks | `services/decks.md` (exists) | merge best copy; keep Paragon schema |
| Windows | `services/windows.md` (exists) | merge |
| Exterior paint | `services/exterior-paint.md` (built) | merge |
| Interior (doors/trim) | `services/interior-doors.md` (built) | merge |
| Kitchen | `services/kitchen-remodel.md` (built) | merge |
| Bath | `services/bathroom-remodel.md` (built) | merge |
| Flooring | `services/flooring.md` (built) | merge |
| Glow Up Studio / AI visualizer | new shared component `src/components/Visualizer.astro` | embed in hub hero/CTA; wire to same lead flow |

### Import procedure (once One Day repo is accessible)

1. Add the repo to the session and read its module components + content.
2. For each One Day module, reconcile copy into the matching Paragon `services/*.md` (Paragon
   frontmatter schema wins; take the stronger prose).
3. Port the AI visualizer as `src/components/Visualizer.astro`, keeping One Day's UX but Paragon's
   `LeadForm` → CRM webhook and `business.ts` NAP.
4. Run `npm run build` in `clients/website`; validate JSON-LD in Rich Results Test.
5. No routing or schema changes required — the generic `[service]` routes already serve new hubs.

## Guardrails carried into any port

- NAP is single-source (`business.ts`) — never hard-code phone/license in a ported component.
- Real data only — no fabricated reviews/stats travel with a module.
- New hubs default `comboEligible: false` so `TownGrid` never links to a town combo that doesn't
  exist (avoids doorway 404s); flip to `true` only when all 38 town combos exist for that service.
