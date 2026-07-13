# Full Buildout — Notes & Placeholders

Branch: `claude/full-buildout`. This is the placeholder/owner-action list for the full-scope buildout
(Paragon service expansion + priority-town pages + GEO/schema). **Nothing here blocks the build or
deploy** — every item is a real-world value to confirm or an asset to drop in.

## ⛔ Hard blocker (out of my control)

- **One Day repo inaccessible.** `mvpbulliesllc-hash/onedayhomeimprovements` is not found / not
  accessible to this session, and no accessible repo maps to it. Brief #2 (One Day parity: phone
  fix, robots/sitemap/llms/schema, portable modules, CRM wiring) and the One-Day **source** side of
  brief #3 (bolt-on) could not be built. The **Paragon side** is built and ready to receive it — see
  `PARAGON_PORT.md`. **Owner action:** grant this session access to the One Day repo (or confirm its
  exact name), then I complete brief #2 and the import.

## Placeholders — confirm before publish

1. **Service hero images** (build is green via graceful `<img>` fallback; these 404 until added to
   `src/assets/media/`): `service-hvac.jpg`, `service-flooring.jpg`, `service-exterior-paint.jpg`,
   `service-kitchen-remodel.jpg`, `service-bathroom-remodel.jpg`, `service-interior-doors.jpg`,
   `service-full-home-renovation.jpg`. (Use the Fetch Website Assets action or drop real project
   photos.)
2. **HVAC licensing.** NJ HVACR work generally requires a **separate state HVACR license** distinct
   from HIC #13VH13814500. The HVAC hub currently says "licensed HVAC installation" generically.
   **Confirm** the HVACR license number (or whether HVAC is performed by a licensed subcontractor)
   and add it, or pull the HVAC hub if Paragon does not offer it.
3. **Price ranges are directional.** All costs are hedged NJ-market ranges ("most/typical", "your
   free estimate is exact"), not fabricated quotes. Confirm they match Paragon's actual pricing.
4. **New service scope.** Kitchen, bath, full-home-renovation, flooring, interior doors, exterior
   paint, and HVAC were built per the buildout brief. Confirm each is a service Paragon actually
   offers/self-performs or subcontracts under its HIC.
5. **Reviews/ratings intentionally omitted.** No testimonials, review counts, or `aggregateRating`
   were fabricated. Add real review data (and then `aggregateRating` schema) once available.

## Deliberate scope choices (not omissions)

- **`exterior-paint` and `interior-doors` are hub-only** (no town combos yet). Interior doors has low
  "[service] [town]" search intent; exterior-paint town pages are staged for the next wave. This
  follows the research pack's "fewer, deeper pages beat many thin ones / no doorway pages" rule.
- **New hubs are `comboEligible: false`** so `TownGrid` never links to a nonexistent town combo.
- **Priority-town combos** were built for 5 high-intent services (kitchen, bath, full renovation,
  flooring, HVAC) × 10 priority towns, each with genuinely local content seeded from that town's real
  neighborhoods/housing. Remaining towns/services expand in waves as project photos accrue.
- **Solar** already has a dedicated page (`/solar/` via `src/pages/solar.astro`); left in place to
  avoid a route collision with a `services/solar.md` hub.
