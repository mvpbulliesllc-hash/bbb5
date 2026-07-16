# Build Status & Structure Report — bbb5 + ctimbuild-v1

Date: 2026-07-16 · Branch: `claude/build-status-structure-report-9ych3p`

## 1. Build health (verified by running builds/typechecks)

| Check | bbb5 | ctimbuild-v1 |
|---|---|---|
| `next build` | ✅ Passes (Next 16.2.10, routes `/`, `/login`) | ✅ Passes (route `/` only) |
| `tsc --noEmit` | ⚠️ **5 errors**, all in `components/shell/module-registry.tsx` (missing `useState` import at lines 830/958/959 + 2 implicit-`any` params) | ✅ Clean |
| Type safety in build | ❌ `ignoreBuildErrors: true` masks the above | ❌ Same flag set (currently nothing to mask) |
| npm audit | — | ⚠️ 4 vulnerabilities (3 moderate, 1 high) |
| Other warnings | `middleware.ts` uses deprecated convention (Next wants `proxy`); pnpm blocked build scripts for `@clerk/shared`, `sharp` | — |

## 2. The good / bad / ugly

**Good**
- Both Next.js apps compile and prerender cleanly; ctimbuild-v1 typechecks with zero errors.
- ctimbuild-v1's Express CRM (`src/server.js`) is the one genuinely *working* product: full API surface (auth, jobs/P&L, leads, tracker, expenses, onboarding, video, storms, assistant) with real `node --test` coverage in `test/`.
- bbb5's marketing website (`clients/website`, Astro) is complete and production-shaped: full page set, sitemap, llms.txt, working lead/voice serverless functions (`api/eli/lead.js` → AgentMail + Convex; `api/eli/voice.js` → Hume TTS).
- bbb5's `clients/admin` (FSH console) has a fully wired router with permission guards and per-resource API modules.

**Bad**
- bbb5 root shell has real TS errors hidden by `ignoreBuildErrors: true` — `module-registry.tsx` will crash at runtime where `useState` is undefined.
- Auth is stripped everywhere "for the demo": bbb5 `middleware.ts` is a no-op stub, `/login` redirects to `/`, Clerk/next-auth deps left dangling; `clients/admin` ships hard-coded demo creds (`Password123!`).
- Both new front-ends (bbb5 workbench shell, ctimbuild-v1 cockpit) are **mock-data-only** — no data fetching, no routing beyond `/`, not connected to any backend.
- ctimbuild-v1 static-root mismatch: Express serves `public/` but the live SPA is committed under `legacy/public/` — clean checkout would 404 the CRM frontend.

**Ugly**
- bbb5 is five apps in one repo (Next shell, Astro site, FSH admin, FSH dashboard, Auth0/Convex backoffice) plus a full .NET modular monolith — three competing "back office" surfaces with no consolidation and dual deploy configs for the website (Cloudflare `wrangler.jsonc` **and** Vercel).
- ctimbuild-v1 is two apps in one repo (Next cockpit + Express CRM) with ambiguous Vercel deploy intent; `convex/` is vestigial stubs; a junk 1-byte `bk` file sits at root; duplicate lead-import scripts diverge.
- "Site Scrape" in bbb5 is a dead button; in ctimbuild-v1 it's an iframe to an external app whose SSO handshake is marked "in flight" and whose repo reportedly has committed API keys (`docs/HANDOFF.md:220-235`).

## 3. Structure, routes, wiring — by section

### HOME PAGE

**bbb5** — two home surfaces:
- Internal shell: `app/page.tsx` → `<HomeShell />` (`components/shell/home-shell.tsx`), title "Paragon Exterior NJ — Back Office". Nav is config-driven state switching (`components/shell/nav-config.ts` HUBS), **not URL routes** — single-page shell swapping module surfaces from `module-registry.tsx`. `/login` → `redirect("/")`.
- Public site: `clients/website/src/pages/index.astro` (MuxHero → LeadForm section stack). Header links: `/`, `/contact/`, external `https://office.paragonexteriornj.com/`. Full route set: `/about`, `/contact`, `/financing`, `/instant-quote`, `/privacy-policy`, `/projects`, `/solar`, `/thank-you`, `/[service]`, `/services/*`, `/service-areas/*`, `/blog/*`, `sitemap.xml`, `llms.txt`.

**ctimbuild-v1** — two home surfaces:
- New cockpit: `app/page.tsx` → `<Cockpit />` (`components/cockpit/cockpit.tsx`: MissionRail + DevPanel + Workbench). Rail items (Sessions/Projects/PRs/Comms/Data/Analytics) and workbench tabs are local state only — **zero links/routes**, all data from mock fixtures in `lib/mission-state.ts`.
- Live CRM: static SPA `legacy/public/index.html` + `app.js` — JS view switcher (`app.js:26-41`) with role-gated views: Job Tracker, Command Center, Leads, Storm Watch, CRM, Ellianna, Pipeline, P&L, Expenses, Onboarding, Videos, Site Scrape, Dev Tools, Team.

### ADMIN

**bbb5** — lives in `clients/admin` (Vite SPA, react-router at `src/routes.tsx`), guarded by `ProtectedRoute` + per-route `RouteGuard` permissions, lazy pages, API modules in `src/api/*.ts` calling the .NET backend:
`/login`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/` (dashboard), `/tenants[/:id]`, `/users[/:id]`, `/roles[/:id]`, `/billing` (+`/plans`, `/invoices[/:id]`), `/leads`, `/impersonation`, `/audits`, `/webhooks[/:id]`, `/notifications`, `/health`, `/settings/{profile,security,sessions,appearance}`, `*` → 404.
Root Next app has **no** `/admin` route. Secondary surface: `clients/backoffice` (Auth0 + Convex; tabs Overview/Pipeline/Search/Settings).

**ctimbuild-v1** — no admin in the Next app. Admin is server-enforced in Express (`src/server.js:404-425`): `requireRole('admin')` gates `/api/1099`, `/api/pnl`, `/api/expenses`, `/api/expense-categories`, `/api/integrations`, `/api/dev-agent`, `/api/users`, `/api/team`, `/api/leads/import`, `/api/integration-status`. Admin SPA views (`legacy/public/app.js:34-41`): pnl, expenses, devtools, team. Admin accounts seeded in `src/db.js:457-487` (`ADMIN_PASSWORD` env). `docs/HANDOFF.md:14` plans an "Admin Panel" button on the public site — not built.

### SITE SCRAPE

**bbb5** — **UI mockup only, no scraping code.** `components/shell/module-registry.tsx:818-845`: "Scrape & Sources" brief fields + a "Run Scrape" button with no handler. Nav label "Brief & Scrape" (`nav-config.ts:127`). `browser-view.tsx` is a placeholder embedded-browser shell. No firecrawl/cheerio/puppeteer anywhere.

**ctimbuild-v1** — scrape is an **external app embedded via iframe + SSO**:
- UI: `legacy/public/app.js:317-333` — `SITESCRAPE_URL = 'https://sitescrape.vercel.app/'`, loads iframe with a 5-minute token (`?paragon_token=`).
- Backend: `GET /api/sso-token` (`src/server.js:407`) mints the token. Handshake incomplete per `docs/HANDOFF.md:220-229` (sitescrape side needs `SESSION_SECRET`).
- Providers configured but not executed here: `dev/capabilities.json` lists firecrawl/nimble/exa/brightdata/browserbase/parallel; `FIRECRAWL_API_KEY`/`EXA_API_KEY` in env checklist.
- "scraped" is also a lead pipeline stage (`src/db.js:222`, `src/server.js:1128`); `/api/leads/import` lands CSV rows as `scraped` → `enriched`.

### API surface (summary)

- **bbb5**: no `app/api/*`. Vercel functions `api/eli/lead.js` (POST, AgentMail + Convex ingest) and `api/eli/voice.js` (POST, Hume TTS). Real REST API is the .NET monolith under `src/Modules/*`, consumed by `clients/admin` & `clients/dashboard` API modules.
- **ctimbuild-v1**: no `app/api/*`. `api/index.js` is a Vercel wrapper booting the whole Express app (`vercel.json` rewrites `/api/*`, `/onboard/:token`, `/join`, `/uploads/*`). Express endpoints span auth/session, onboarding/join, users/team, jobs & P&L, expenses, leads, tracker, calls, assistant/dev-agent, video (Mux), Ellianna email (IMAP), storms, integrations.

## 4. Recommended next fixes (priority order)

1. Fix the 5 TS errors in `components/shell/module-registry.tsx` (import `useState`) and remove `ignoreBuildErrors` from both repos.
2. Resolve ctimbuild-v1's `public/` vs `legacy/public/` path so the CRM frontend serves from a clean checkout.
3. Decide the canonical back-office (Next shell vs `clients/admin` vs `clients/backoffice`) and the canonical website deploy (Cloudflare vs Vercel).
4. Finish the sitescrape SSO handshake (`SESSION_SECRET` on the Vercel side) and rotate/remove committed keys in that repo; change default admin passwords.
5. Re-wire auth (Clerk or otherwise) before anything goes past demo; remove hard-coded demo creds.
6. Clean vestigial pieces: `bk` file, unused `convex/` stubs, duplicate `scripts/import*leads.js`, dangling Clerk/next-auth deps.
