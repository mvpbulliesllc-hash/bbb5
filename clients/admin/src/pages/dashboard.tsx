import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  FileText,
  Receipt,
  UsersRound,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { listTenants } from "@/api/tenants";
import { listInvoices, getPlans } from "@/api/billing";
import { Skeleton } from "@/components/ui/skeleton";
import { ToneIconTile, type ToneIconTileTone } from "@/components/list";
import { TiltCard } from "@/components/ui/tilt-card";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { useAuth } from "@/auth/use-auth";
import { cn } from "@/lib/cn";

/**
 * DashboardPage — the operator overview, rebuilt as the liquid-glass
 * showcase. A live WebGL particle field (see GLBackdrop) refracts through
 * every glass surface here: the header card, the tilting KPI tiles, and the
 * entry-point pivots. All numbers are real, drawn from the tenants, plans,
 * and invoices APIs — no placeholder content.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tenantsQuery = useQuery({
    queryKey: ["tenants", { pageNumber: 1, pageSize: 1 }],
    queryFn: () => listTenants({ pageNumber: 1, pageSize: 1 }),
  });
  const plansQuery = useQuery({
    queryKey: ["billing", "plans", { includeInactive: true }],
    queryFn: () => getPlans(true),
  });
  const invoicesQuery = useQuery({
    queryKey: ["billing", "invoices", { pageNumber: 1, pageSize: 50 }],
    queryFn: () => listInvoices({ pageNumber: 1, pageSize: 50 }),
  });

  const tenantsTotal = tenantsQuery.data?.totalCount;
  const plans = plansQuery.data ?? [];
  const activePlans = plans.filter((p) => p.isActive).length;
  const invoicesPage = invoicesQuery.data;
  const outstandingCount =
    invoicesPage?.items.filter((i) => i.status === "Issued").length ?? 0;

  const firstName = user?.name?.split(" ")[0];

  const stats: StatTileData[] = [
    {
      icon: Building2,
      label: "Tenants",
      value: tenantsQuery.isLoading ? null : tenantsTotal?.toLocaleString() ?? "—",
      hint: "on this instance",
      accent: "emerald",
    },
    {
      icon: Layers,
      label: "Plans",
      value: plansQuery.isLoading ? null : plans.length.toLocaleString(),
      hint: `${activePlans} active`,
      accent: "sky",
    },
    {
      icon: Receipt,
      label: "Invoices",
      value: invoicesQuery.isLoading
        ? null
        : invoicesPage?.items.length.toLocaleString() ?? "—",
      hint: invoicesPage
        ? `${invoicesPage.totalCount.toLocaleString()} total ledger`
        : "loading…",
      accent: "emerald",
    },
    {
      icon: AlertTriangle,
      label: "Outstanding",
      value: invoicesQuery.isLoading ? null : outstandingCount.toLocaleString(),
      hint: "issued, awaiting payment",
      accent: outstandingCount > 0 ? "amber" : "emerald",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header card ──────────────────────────────────────────────── */}
      <div className="fsh-enter liquid-glass rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
              Overview
              {firstName ? (
                <span className="text-[var(--color-muted-foreground)]">, {firstName}</span>
              ) : null}
            </h1>
            <p className="mt-1 max-w-xl text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              Operate every tenant on this instance — identity, multitenancy,
              billing, and the rest of the system surface.
            </p>
          </div>
          <div className="shrink-0">
            <LiquidMetalButton
              label="+ New Tenant"
              width={148}
              onClick={() => navigate("/tenants/new")}
            />
          </div>
        </div>
      </div>

      {/* ── KPI stat tiles ───────────────────────────────────────────── */}
      <div className="fsh-enter fsh-enter-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>

      {/* ── Quick pivots ─────────────────────────────────────────────── */}
      <section className="fsh-enter fsh-enter-3 space-y-3">
        <p className="meta text-[var(--color-muted-foreground)]">Entry points</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PivotCard
            to="/tenants"
            icon={Building2}
            tone="info"
            title="Tenants"
            description="Provision, suspend, and inspect tenants."
          />
          <PivotCard
            to="/users"
            icon={UsersRound}
            tone="primary"
            title="Users"
            description="Root-tenant operators and role management."
          />
          <PivotCard
            to="/billing/plans"
            icon={Receipt}
            tone="success"
            title="Billing"
            description="Plans, subscriptions, invoices and pricing."
          />
          <PivotCard
            to="/billing/invoices"
            icon={FileText}
            tone="warning"
            title="Invoices"
            description="Cross-tenant ledger. Issue, mark paid, void."
          />
        </div>
      </section>
    </div>
  );
}

// ─── subcomponents ───────────────────────────────────────────────────

type StatAccent = "emerald" | "amber" | "sky";

type StatTileData = {
  icon: typeof Building2;
  label: string;
  /** null while the underlying query is loading. */
  value: string | null;
  hint: string;
  accent: StatAccent;
};

const ACCENT_TEXT: Record<StatAccent, string> = {
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  sky: "text-sky-300",
};

function StatTile({ icon: Icon, label, value, hint, accent }: StatTileData) {
  return (
    <TiltCard max={6} className="rounded-3xl">
      <div className="liquid-glass rounded-3xl p-5 transition-all duration-500 ease-out hover:brightness-125">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p data-slot="kpi-label" className="text-[13px] text-[var(--color-muted-foreground)]">
              {label}
            </p>
            <div className="mt-1.5 text-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-[var(--color-foreground)]">
              {value === null ? <Skeleton className="h-7 w-16" /> : value}
            </div>
            <p className={cn("mt-1.5 text-[12px] font-medium", ACCENT_TEXT[accent])}>
              {hint}
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[oklch(1_0_0_/_0.12)] bg-[oklch(1_0_0_/_0.06)]">
            <Icon className={cn("size-5", ACCENT_TEXT[accent])} aria-hidden />
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

function PivotCard({
  to,
  icon: Icon,
  tone,
  title,
  description,
}: {
  to: string;
  icon: typeof Building2;
  tone: ToneIconTileTone;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
      <div
        className={cn(
          "liquid-glass flex h-full flex-col gap-3 rounded-2xl p-4",
          "transition-all duration-300 hover:brightness-125",
        )}
      >
        <div className="flex items-start justify-between">
          <ToneIconTile icon={Icon} tone={tone} size="md" />
          <ArrowRight
            aria-hidden
            className="size-3.5 text-[var(--color-muted-foreground)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        </div>
        <div>
          <div className="font-display text-[14px] font-semibold tracking-tight text-[var(--color-foreground)]">
            {title}
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
