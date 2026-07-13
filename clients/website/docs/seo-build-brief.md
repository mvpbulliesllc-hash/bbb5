# Paragon Exteriors — SEO / GEO Build Brief

> Working build brief that maps the [research pack](./research-pack.md) onto the **current state of
> this Astro site** and turns it into a prioritized, verifiable roadmap. The research pack is the
> "what the market rewards" evidence base; this file is the "what we have / what's left" plan.
> Update this file as items ship — it is the living checklist, not a one-time memo.

**Site:** `clients/website` · Astro 5 + Tailwind 4 · static build → Vercel
**Business:** Paragon Exteriors LLC · NJ HIC #13VH13814500 · Ocean & Monmouth County / Jersey Shore
**NAP source of truth:** `src/config/business.ts` — never hard-code name/address/phone elsewhere.

---

## 1. Strategy in one paragraph

Win with hyper-local, entity-consistent fundamentals, not AI gimmicks. One hardened foundation —
unique per-town service pages + a clean JSON-LD `@graph` + steady review velocity + a fully
optimized Google Business Profile — serves classic SEO, the local map pack, AI Overviews, and
answer engines simultaneously. The NJ wedge is **storm-driven, coastal, insurance-claim** intent
that the national players (Power Home Remodeling, DaBella, Window World) do not serve well. Every ad
and page carries **HIC #13VH13814500**, and every "free"/bundle/financing offer is disclosed
clean-and-conspicuous (NJ Consumer Fraud Act → treble damages on even a technical omission).

---

## 2. What already exists (audited against the research pack)

The site is already ~95% aligned with the research pack. Confirmed in-repo:

| Research recommendation | Status | Where |
|---|---|---|
| Unique per-town service pages (money pages) | ✅ 76 combos | `src/content/combos/` — `roof-repair-*` × 38 + `roof-replacement-*` × 38 towns |
| Town hubs (service-area pages) | ✅ 38 towns | `src/content/towns/` → `/service-areas/{town}/` |
| Service pillar pages, split by intent | ✅ 9 services | `src/content/services/` (roof-repair, roof-replacement, storm-damage, commercial-roofing, siding, windows, doors, gutters, decks) |
| NJ cost-range pages (top AI-citation asset) | ✅ as guides | `posts/roof-replacement-cost-nj`, `window-replacement-cost-nj`, `deck-building-cost-nj`, `vinyl-siding-cost-nj` |
| Insurance-claim moat content | ✅ | `posts/roof-insurance-claim-nj.md` |
| Informational guide cluster | ✅ 18 posts | `src/content/posts/` (shingles, permits, ice dams, repair-vs-replace, contractor selection…) |
| Single site-wide JSON-LD via `@graph`-style emission | ✅ | `src/lib/schema.ts` + `src/layouts/Base.astro` (orgSchema on every page + page-level nodes) |
| `RoofingContractor` primary type | ✅ | `orgSchema()` |
| Service / FAQPage / Article / Breadcrumb nodes | ✅ | `serviceSchema`, `faqSchema`, `articleSchema`, `breadcrumbSchema` |
| `areaServed`, `geo`, `sameAs`, `openingHoursSpecification`, `priceRange`, license credential | ✅ | `orgSchema()` |
| FAQPage only when Q&A visible on-page | ✅ | FAQs ride frontmatter → rendered via `FaqAccordion` + emitted as schema |
| Lightweight `llms.txt` + full dump | ✅ | `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts` |
| CWV-friendly static build, responsive `<Img>` | ✅ | Astro static + `Img.astro` responsive widths |
| Old-Wix 301 redirects | ✅ | `astro.config.mjs` + `vercel.json` |
| Financing page + compliant framing | ✅ | `src/pages/financing.astro` (soft-pull language, no deductible-waiving) |
| Lead capture → CRM with UTM first-touch | ✅ | `LeadForm.astro` → `PUBLIC_LEADS_API` |

**Implication:** the job is *not* to bulk-generate more pages. The research pack's own rule —
"fewer, deeper pages beat many thin ones; template-swapping a city name across near-identical pages
triggers a doorway/duplicate demotion" — means new thin content is a risk, not a win.

---

## 3. Gaps this branch closes now (schema hardening)

Concrete, verifiable `orgSchema()` improvements the research pack calls out that were missing.
All grounded in things Paragon genuinely does — no fabricated offerings.

| Gap | Fix (this branch) | Why it matters |
|---|---|---|
| `telephone` was in local format `848-633-6440` | `business.phoneE164 = +1-848-633-6440`, used for schema `telephone` | Research §2: telephone in **+1 format** is what the Knowledge Graph / AI engines expect; human-facing UI keeps the local format. |
| No `paymentAccepted` | `paymentAccepted: [Cash, Check, Credit Card, Financing]` | Research §2 rewards it; "Financing" is real (`/financing/`). |
| No entity-topic signal | `knowsAbout: […]` (roofing, storm damage, insurance claims, siding, windows, coastal exteriors…) | Research §3: accurate topical/entity signals are what actually move AI citations. |
| Services not modeled as offer nodes | `makesOffer: [Offer → Service]` per real service, `areaServed` Ocean/Monmouth | Research §2: each service as a graph node with `provider` @id + `areaServed`; disambiguates the entity. |

Not changed on purpose:
- **No `aggregateRating` / fake `Review`.** Research §2/§4: genuine reviews only — buying/inventing
  them triggers de-ranking. Add real ratings only once GBP/third-party reviews exist to cite.
- **No new service lines** (kitchen/bath/HVAC/flooring/man-cave). The research pack lists these as a
  *possible* full-scope expansion, but Paragon is an exteriors contractor today; inventing service
  pages would be thin content and misrepresent the business. Tracked as a business decision below.

---

## 4. Prioritized roadmap (not yet done — sequenced by ROI)

Ordered by the research pack's ranking-factor weights (GBP ~32%, reviews ~20%, on-page ~19%,
links ~15%). These are **off-repo or future-content** items; most are operational, not code.

### Stage 1 — Foundation (operational, highest leverage)
- [ ] **Google Business Profile**: claim/verify, exact NAP matching `business.ts`, primary category
      "Roofing Contractor" + accurate secondaries, 20+ real photos, seeded Q&A, weekly posts.
      GBP alone is ~1/3 of local-pack weight; profiles silent 30+ days lose visibility.
- [ ] **Citation cleanup**: identical NAP across Google, Yelp, Bing Places, Apple Maps, Facebook,
      BBB, Houzz, Angi. "Ste" vs "Suite" fragments the entity. Feed the confirmed profile URLs back
      into `business.social` / a `sameAs` list so schema `sameAs` points at them.
- [ ] **Core Web Vitals** field check post-deploy (LCP <2.5s, INP <200ms, CLS <0.1) — the static
      build should pass; verify on real mobile.
- [ ] **Search Console**: submit `/sitemap-index.xml`, confirm no route ships `noindex` except
      `/thank-you/` (old Wix shipped noindex site-wide — see README launch runbook).

### Stage 2 — Content depth (only where we have real proof)
- [ ] **Review-velocity workflow**: ask every won customer for a review that names the service + town
      ("roof replacement in Toms River"). Velocity beats volume; target 50 → 100+ reviews.
- [ ] **Deepen top-intent town pages** (Toms River, Brick, Lakewood, Jackson, Howell, Middletown)
      with real completed-job photos, neighborhood/landmark references, and customer quotes as they
      accrue — rather than publishing more thin towns.
- [ ] **Roof-inspection** service pillar (`src/content/services/roof-inspection.md`) — a real service
      implied by storm/insurance work and a distinct informational+transactional intent the site
      doesn't yet target. Add only if Paragon confirms it offers standalone inspections.
- [ ] Consider promoting the strongest cost guides from `/blog/` into first-class `/{service}-cost/`
      pillar URLs if analytics show cost queries converting — cost pages are the top AI-citation
      magnet.

### Stage 3 — Differentiation & demand capture
- [ ] **Short-form video program** (2+ Reels/week: before/after, tear-off satisfying, storm-chaser-vs-
      licensed education, drone storm reveals). YouTube is the #1-cited domain in Google AI Overviews
      (~29.5% share) — cross-post Shorts → Reels → TikTok; this ties video directly to AI visibility.
- [ ] **Compliant bundle offers** (e.g. "free gutters with a roof/siding project") — see §5 before
      any offer ships.
- [ ] **AI photo-visualizer** promotion (the onedayhomeimprovements.com / Eli-widget conversion hook)
      surfaced as a differentiator vs national players.
- [ ] Off-site entity signals: Reddit/Nextdoor presence after storms, local press mentions.

---

## 5. Compliance guardrails (must hold on every ad + offer page)

Non-negotiable — NJ Consumer Fraud Act makes a technical omission a per se violation (treble
damages + attorney's fees). Have an NJ construction/advertising attorney review templates before
launch; the below is the operating standard, not legal advice.

- **HIC # in all advertising** — N.J.S.A. 56:8-144 requires the registration number
  (**13VH13814500**) prominently displayed in every advertisement distributed in NJ. Already surfaced
  via `business.license`; keep it on ads, landing pages, and social bios.
- **"Free" offers (FTC 16 CFR 251.1)** — disclose all terms clearly and conspicuously *at the outset*,
  in close conjunction with "Free" (not an asterisked footnote); the paired item stays at its bona
  fide regular price; a single "free" offer runs ≤6 months / ≤3 times per 12 months in a trade area.
- **Financing (TILA/Reg Z 12 CFR 1026.16)** — if you say "no interest," also state "if paid in full"
  + the deferred-interest period; financing is via unaffiliated third-party lenders, "on approved
  credit," "not all buyers qualify"; Paragon is neither broker nor lender.
- **Never** offer to waive an insurance deductible — illegal in NJ and a scam flag. Use it as a
  *trust* talking point against out-of-state storm chasers instead.
- Every contract >$500: written, mandated terms, 3-day right of rescission.

---

## 6. Success metrics / when to change the plan

- If map-pack position for "[service] [town] NJ" isn't top-3 in moderate-competition towns within
  60–90 days → audit **NAP fragmentation** and **review velocity** first (highest-weight levers).
- If AI Overview citations aren't appearing within ~3–4 months → prioritize **third-party entity
  signals** (Reddit/Nextdoor/local press), **content freshness** (refresh cost/service pages within
  60–90 days), and **YouTube video** over any on-page tweak.
- If a town page underperforms → deepen its local specificity; do **not** publish more thin pages.
- If paid roofing CPL runs at/above the ~$228 LocaliQ benchmark without closing → shift budget to
  organic/GBP + Google Local Services Ads.

---

## 7. File map (where each lever lives in this repo)

| Lever | File |
|---|---|
| NAP, license, hours, geo, socials, payment/topics/offers | `src/config/business.ts` |
| JSON-LD builders (org/service/FAQ/article/breadcrumb) | `src/lib/schema.ts` |
| Site-wide schema emission (+page nodes) | `src/layouts/Base.astro` |
| Service pillars | `src/content/services/*.md` → `/{service}/` |
| Town hubs | `src/content/towns/*.md` → `/service-areas/{town}/` |
| Service×town money pages | `src/content/combos/*.md` → `/{service}/{town}/` |
| Guides / cost pages | `src/content/posts/*.md` → `/blog/{slug}/` |
| GEO endpoints | `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts` |
| Lead capture → CRM | `src/components/LeadForm.astro` |
| Redirects (old Wix) | `astro.config.mjs`, `vercel.json` |
| Launch runbook (GBP, Mux, DNS, Search Console) | `README.md` |
