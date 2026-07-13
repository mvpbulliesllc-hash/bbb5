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

1. **Service hero images — GENERATED via Higgsfield, pending placement.** All 7 were generated
   (1376×768, consistent brand style) and live in the Higgsfield account, but the **workspace egress
   policy blocks the Higgsfield CDN host** (403 CONNECT policy denial), so this session could not
   download them into the repo. Build stays green via the graceful `<img>` fallback; they 404 until
   the files are dropped at these exact paths (convert PNG→JPG):
   - `src/assets/media/service-hvac.jpg` ← `hf_20260713_045622_febf59a7-2419-4de5-861f-00a2553d8010.png`
   - `src/assets/media/service-flooring.jpg` ← `hf_20260713_045640_9da65b44-7a51-461c-a286-987ed6cd26b9.png`
   - `src/assets/media/service-exterior-paint.jpg` ← `hf_20260713_045642_3b39bae2-83c3-4bf4-aa5d-b47ce723b4dd.png`
   - `src/assets/media/service-kitchen-remodel.jpg` ← `hf_20260713_045643_10d1883a-6223-4c5c-97fd-abcd807e9f1b.png`
   - `src/assets/media/service-bathroom-remodel.jpg` ← `hf_20260713_045645_d2b2239b-2d42-4cce-8a96-ee8c138fd485.png`
   - `src/assets/media/service-interior-doors.jpg` ← `hf_20260713_045646_75b87b20-d473-4d49-b924-5116041c228f.png`
   - `src/assets/media/service-full-home-renovation.jpg` ← `hf_20260713_045648_24c464e4-bc78-4c06-977f-de9184c21544.png`
   All hosted under `https://d8j0ntlcm91z4.cloudfront.net/user_3ED6xnZ2xEkMGGMYm4NpnnVJo2K/`. Drop
   them in from a network-unrestricted environment, or hand me the files and I'll place them.
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
