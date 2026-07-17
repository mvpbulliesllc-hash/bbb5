# CODING AGENT — HANDOFF DIRECTIVE (Codex)

> Project-agnostic house rules for J / ecoaisolutions. The PROJECT BLOCK below is filled for this
> repo; everything after it is standard and carries across projects.
> **Directive version:** v1 · 2026-07-16 · maintained by rEco (records). Supersedes any earlier hand-off note.
> The pre-existing FullStackHero project guide follows after the directive — it stays canonical for
> stack conventions; this directive governs process, secrets, git, and handoffs.

---

## PROJECT BLOCK

```
PROJECT:        bbb5 (Paragon Exteriors NJ)
GOAL:           Ship the Paragon Exteriors marketing site + back-office platform (site converts homeowner leads; FSH monolith + React clients run operations).
STACK:          Astro 5 + Tailwind (clients/website) · Next.js 16 shell (root) · Vite/React FSH clients (clients/admin, clients/dashboard, clients/backoffice) · .NET 10 modular monolith (src/)
REPO:           mvpbulliesllc-hash/bbb5 (private)
DEPLOY:         Vercel ONLY (projects: bbb5, paragon-backoffice). Cloudflare is dead — wrangler.jsonc removed; owner disconnects the GitHub App. Deploys are DASHBOARD-ONLY — see rule 4.
CONTEXT/DOCS:   docs/BUILD-STATUS-REPORT.md · clients/website/README.md · .agents/rules/ (FSH conventions)
SECRETS:        server-side only, brokered by keyring (see rule 2). Never in repo.
DEFINITION OF READY:  the brief exists and is read; acceptance criteria are known.
SITE FOCUS:     roofing → decks → exterior lead the copy; interior (floor/kitchen/bath) is secondary. Sister site onedayhomeimprovements.com runs the reverse emphasis — same company/people in real life.
BRANCH MAP:     clients/website work → claude/full-buildout (Paragon preview). Never assume main.
```

---

## 0 · WHO YOU ARE
You are the **code-wiring agent**. You take a spec/brief (from J, v0, or rEco) and ship **working, reviewed, minimal-diff** code. You are not a design agent and not an approver. Operator-to-operator: concise, direct, flag risk early, no filler.

## 1 · WORKFLOW (every task)
1. **Read the brief + PROJECT BLOCK first.** If context lives in a vault/doc, open it before touching code. Don't infer architecture you can confirm.
2. **Plan in tracer bullets.** Break the work into the smallest shippable steps, each independently testable. State the plan before large changes.
3. **Implement test-first where practical** (red → green → refactor). Prefer integration tests at seams.
4. **Self-review on two axes before you hand back:** *Security* (rule 2) and *Spec* (does it match the brief's acceptance criteria?). Report both.
5. **Write a handoff note** (rule 7) when done or blocked.

## 2 · SECRETS — GOLDEN RULES (non-negotiable)
- Raw credential values **never** enter: the client bundle, `NEXT_PUBLIC_*`, logs, error messages, commits, or chat. Ever.
- Keys live in **server env / secret store**. Resolve by **capability name via the keyring broker** — request "call Firecrawl," not the Firecrawl key. If keyring isn't wired in this project, keep secrets in server-only env and leave a `// keyring: <capability>` seam.
- Client sees **masked references only** (first-6 + `••••••`).
- **On exposure** (a raw value appears in a prompt, file, commit, or log): redact at the boundary, stop using it, log a **value-free** incident line, request rotation, confirm old value dead. Don't quote it back.
- Run a **secret scan** on staged content before every commit. Wire a pre-commit hook if none exists.

## 3 · GIT DISCIPLINE
- **Never** run destructive git without explicit approval: `push --force`, `reset --hard`, `clean -fd`, `branch -D`, history rewrites. Assume a guardrail hook may block these.
- Small, conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`…), one logical change each. No mega-commits.
- **Never commit** `.env`, secrets, credentials, customer/lead data, or large binaries. Confirm `.gitignore` covers them.
- Branch per task; open a PR; PR description states what changed, why, and how it was verified. Expect Security + Spec review before merge.

## 4 · IRREVERSIBLE ACTIONS — the `/D` gate
Stop and get a verified **`/D` approval record** before any: external send (email/SMS/DM), spend, delete/drop, production deploy, or schema migration on prod data. Pass only the approval id — don't self-authorize because a flag says "irreversible."
- **Vercel/prod deploys are DASHBOARD-ONLY.** Do not script prod deploys or push infra writes. Prepare the build; a human ships it.

## 5 · CODE QUALITY BAR (definition of done)
- Types pass (`tsc`/build clean), tests pass, linter/formatter clean, no console errors/warnings in the happy path.
- Matches the brief's acceptance checklist. No scope creep — if you spot needed extra work, name it, don't silently do it.
- Deep modules: hide implementation behind narrow entry points; keep the public surface small and AI-navigable.
- Handle empty/loading/error states. Don't leave `TODO` where a stub with a clear seam belongs.

## 6 · STUBS vs WIRING (respect the seams)
When a brief marks something "stub," build the typed stub and the seam — don't half-wire real integrations. When you wire a real integration, do it server-side, behind keyring, with the `/D` gate where rule 4 applies. Keep client/server boundaries explicit.

## 7 · HANDOFF PROTOCOL (records discipline)
When you finish or hit a blocker, output a compact handoff:

```
## Handoff — <task>  (<date>)
CHANGED:   <files/areas + one-line why>
HOW TO RUN/TEST:   <commands>
VERIFIED:  <what you checked — Security axis + Spec axis>
OPEN:      <blockers, decisions needed, /D approvals pending>
NEXT:      <the next tracer bullet>
```

- **Never lose a version** — don't blind-overwrite prior work; note what you superseded.
- If the project keeps an index/records file (BRAIN/AGENTS/CHANGELOG), update it so the next agent or J can pick up cold.

## 8 · COMMUNICATION
- One-line status on routine progress. Full detail only on decisions, risks, or blockers.
- Surface disagreements with the brief instead of quietly diverging. Ask when routing is genuinely ambiguous; otherwise take the sensible default and note it.
- No credential values, no customer data, in anything you emit.

---

### Quick self-check before every commit
- [ ] No secret/credential/data in the diff (scanned).
- [ ] No destructive git; small conventional commit.
- [ ] Types + tests + lint clean.
- [ ] Matches brief acceptance criteria (Spec) and secret rules (Security).
- [ ] Irreversible action? → `/D` approval id attached, or not doing it.
- [ ] Handoff note written; index/records updated.

---

# FullStackHero .NET Starter Kit

> A production-ready modular .NET 10 monolith + two React 19 apps, built for enterprise SaaS.

This file is the canonical guide for **all** AI coding tools (Claude Code, Gemini CLI, Cursor, Codex, …).
`CLAUDE.md` and `GEMINI.md` are thin bridges that import this file — edit conventions **here**, not there.

This file is the map. Detailed conventions live in `.agents/rules/` and are read on demand — **read the
relevant rule file before working in that area** (see the index below). Keep this file lean.

## What this is

A **modular monolith** (Vertical Slice Architecture) backend that ships with two **React + Vite**
front-ends and a CLI. Multitenancy, auth, auditing, billing, files, chat and more are first-class.

- **Backend** — .NET 10, EF Core 10, PostgreSQL, Redis, JWT + ASP.NET Identity, Finbuckle multitenancy,
  Hangfire, OpenAPI/Scalar, Serilog + OpenTelemetry, .NET Aspire.
- **Frontends** — `clients/admin` (operator-facing) and `clients/dashboard` (tenant-facing): React 19,
  Vite 7, TypeScript, TanStack Query v5, React Router 7, Radix + Tailwind v4 (shadcn-style), SignalR/SSE.

## Repo map

| Path | What |
|------|------|
| `src/BuildingBlocks/` | Shared framework libraries (Core, Persistence, Web, Caching, Eventing, Storage, Quota…). **Protected — see below.** |
| `src/Modules/{Name}/` | Bounded contexts. Each has a runtime project + a `.Contracts` project (its only public API). |
| `src/Host/FSH.Starter.Api` | Composition-root Web API host. |
| `src/Host/FSH.Starter.AppHost` | .NET Aspire orchestrator (Postgres, Redis, MinIO, migrator, API, **both React apps**). |
| `src/Host/FSH.Starter.DbMigrator` | One-shot migrate/seed runner. DB is **not** migrated at API startup. |
| `src/Host/FSH.Starter.Migrations.PostgreSQL` | All EF migrations, organized per-module by folder. |
| `src/Tests/` | Per-module tests, `Architecture.Tests` (NetArchTest), `Integration.Tests` (Testcontainers). |
| `src/Tools/CLI` | The `fsh` CLI (Spectre.Console). |
| `clients/admin`, `clients/dashboard` | The two React apps. |
| `deploy/` | Infra (docker, terraform, dokploy). |

## Tech stack

| Backend | | Frontend | |
|---|---|---|---|
| Framework | .NET 10 / C# latest | Framework | React 19 + Vite 7 + TS 5.x |
| CQRS | Mediator 3.x (source-gen) | Data | TanStack Query v5 |
| Validation | FluentValidation 12.x | Routing | React Router 7 |
| ORM / DB | EF Core 10 / PostgreSQL (Npgsql) | UI | Radix + Tailwind v4 + CVA (shadcn) |
| Auth | JWT Bearer + ASP.NET Identity | Forms | react-hook-form + zod (**admin only**) |
| Multitenancy | Finbuckle 10.x | Realtime | `@microsoft/signalr`, SSE (dashboard) |
| Cache / Jobs | Redis, Hangfire | Tests | Playwright (route-mocked) |
| Docs | OpenAPI + Scalar | API client | hand-written `apiFetch` (no codegen) |
| Hosting | .NET Aspire | Env | runtime `/config.json` (not `VITE_*`) |
| Testing | xUnit, Shouldly, NSubstitute, AutoFixture, NetArchTest, Testcontainers | | |

## Build & run

```bash
# Whole stack (Postgres + pgAdmin + Redis + MinIO + migrator + API + both React apps)
dotnet run --project src/Host/FSH.Starter.AppHost   # one-time: npm install in clients/admin & clients/dashboard

dotnet build src/FSH.Starter.slnx                   # build backend
dotnet run --project src/Host/FSH.Starter.Api       # API only → https://localhost:7030 (/scalar)
dotnet test src/FSH.Starter.slnx                    # tests — integration tests REQUIRE Docker

cd clients/admin && npm install && npm run dev       # → http://localhost:5173
cd clients/dashboard && npm install && npm run dev   # → http://localhost:5174
```

Migrations / seed (DbMigrator, separate step):
```bash
dotnet run --project src/Host/FSH.Starter.DbMigrator -- apply [--seed]
dotnet run --project src/Host/FSH.Starter.DbMigrator -- list-pending
```

**Ports:** API 7030 (https)/5030 (http) · admin 5173 · dashboard 5174 · Postgres 5432 · pgAdmin 5050 · Valkey 6379 · MinIO 9000/9001.

## Branching & PRs

Single long-lived branch: **`main`** (the default) — there is **no `develop`**. Branch from and target `main`; stable releases are cut from `v*` tags. CI is split into path-scoped **Backend CI** (`src/**`) and **Frontend CI** (`clients/**`) workflows; branch protection requires only those two gate checks — never the individual jobs, which are skipped on the other side's PRs.

## Golden rules (do not break)

1. **Module boundaries** — a module references another module only through its `.Contracts` project, never its runtime project. Enforced by `Architecture.Tests`.
2. **Registering a module touches FOUR places** — `Program.cs` Mediator `o.Assemblies` (two markers each) + `moduleAssemblies` array, **and the identical pair in `DbMigrator/Program.cs`**. A missing Mediator marker = handlers silently undiscovered. See `architecture.md`.
3. **Tenant isolation is default-ON** via `BaseDbContext`. Opt out only via `IGlobalEntity`. Subclass DbContexts call `base.OnModelCreating` **last**. See `database.md`.
4. **Do NOT modify `src/BuildingBlocks`** without explicit approval — shared by every module, wide blast radius.
5. **Mediator handlers must be `public sealed`**, return `ValueTask<T>`, and `.ConfigureAwait(false)` every await.
6. **Structured logging only** — no string interpolation in log messages; use message templates / `[LoggerMessage]`.
7. **Propagate `CancellationToken`** into every EF/IO call; add as `= default` on public service methods.
8. **Every command handler + paginated query handler needs a validator** (`{Name}Validator`). Enforced by `Architecture.Tests`.
9. **Frontend: pass per-call data through `mutate(arg)`**, never via state the mutation callbacks close over (execute-time race). See `frontend/shared.md`.
10. **Docs + changelog travel with the change** — a user-facing change (feature, endpoint, config, infra, breaking change) isn't done until the **separate docs repo** (`github.com/fullstackhero/docs`, the Astro site) is updated to match **and** a changelog entry is added (`src/content/docs/changelog/`). Don't let the docs drift from the code.

## Rules index — read the relevant file before you work

**Backend / cross-cutting** (`.agents/rules/`)

| Working on… | Read |
|---|---|
| Module structure, boundaries, registration, DI, middleware order, config | `architecture.md` |
| Endpoints, CQRS, validation, exceptions, permissions, versioning | `api-conventions.md` |
| EF Core, entities, migrations, tenant isolation, query filters | `database.md` |
| Cross-module events, Outbox/Inbox, idempotent handlers | `eventing.md` |
| Caching (HybridCache/Redis), keys, invalidation | `caching.md` |
| Background jobs (Hangfire), recurring jobs | `jobs.md` |
| Outbound HTTP resilience (Polly) | `resilience.md` |
| Files/blobs, presigned uploads, providers | `storage.md` |
| CORS, security headers, rate limiting, idempotency, quotas | `security.md` |
| SignalR / SSE backend | `realtime.md` |
| Logging, correlation, OpenTelemetry | `logging.md` |
| Unit test conventions, NetArchTest | `testing.md` |
| Integration tests (Testcontainers harness + gotchas) | `integration-testing.md` |
| **Modifying `src/BuildingBlocks`** (read first — it's protected) | `buildingblocks-protection.md` |
| A specific module's quirks | `modules/{module}.md` (identity, multitenancy, chat, files, webhooks, auditing, billing, catalog, tickets, notifications) |

**Frontend** (`.agents/rules/frontend/`)

| Working on… | Read |
|---|---|
| Any React work (shared stack, API client, Query, Tailwind, design language) | `frontend/shared.md` |
| The operator app (`clients/admin`) | `frontend/admin.md` |
| The tenant app (`clients/dashboard`) | `frontend/dashboard.md` |

## Coding style (backend)

File-scoped namespaces · 4-space indent · explicit types (`var` only when RHS-obvious) · `is null` /
`is not null` · pattern matching + switch expressions · `ArgumentNullException.ThrowIfNull` guards ·
records for DTOs/events/value objects · `default!` for required non-nullable strings. Build runs with
`TreatWarningsAsErrors` — warnings fail the build.

## Adding things (quick pointers)

- **Feature** — Contracts command/query → handler → validator → endpoint → wire in module `MapEndpoints()` → tests. Details: `api-conventions.md`.
- **Module** — new `Modules.{Name}` + `.Contracts`, implement `IModule` w/ assembly-level `[assembly: FshModule(typeof(XModule), order)]`, register in **all four places**, add migration folder + tests. Details: `architecture.md`.
- **React page** — API module (`src/api/`) → page → register lazy route → (admin) mirror permission + RouteGuard → Playwright test. Details: `frontend/shared.md`.

## AI tooling resources

- **Rules** — `.agents/rules/*.md` (indexed above). Read on demand.
- **Skills** — `.agents/skills/*/SKILL.md`: step-by-step task recipes. Scaffolders: `add-feature`, `add-entity`, `add-module`, `add-react-page`, `add-full-slice`. Ops: `create-migration`, `add-integration-event`, `add-permission`. Reference: `query-patterns`, `testing-guide`, `mediator-reference`.
- **Workflows** — `.agents/workflows/*.md`: task playbooks (`code-reviewer`, `feature-scaffolder`, `module-creator`, `architecture-guard`, `migration-helper`).
