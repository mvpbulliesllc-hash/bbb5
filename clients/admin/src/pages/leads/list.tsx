import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  MessageSquare,
  RefreshCw,
  X,
} from "lucide-react";
import {
  LEAD_SERVICE_TYPES,
  LEAD_SERVICE_TYPE_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  getLeadStats,
  searchLeads,
  type LeadDto,
  type LeadServiceType,
  type LeadSortBy,
  type LeadSource,
  type LeadStatsDto,
  type LeadStatus,
} from "@/api/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EntityPageHeader,
  ErrorBand,
  FilterBar,
  LoadingRow,
  Pagination,
  Select,
  Stat,
  StatStrip,
} from "@/components/list";
import { EmptyState } from "@/components/empty-state";
import { ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { LeadDetailSheet } from "@/pages/leads/detail";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  leadStatusVariant,
} from "@/pages/leads/lead-meta";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 250;

const SORTABLE: ReadonlyArray<{ key: LeadSortBy; label: string; numeric?: boolean }> = [
  { key: "name", label: "Lead" },
  { key: "serviceType", label: "Service" },
  { key: "source", label: "Source" },
  { key: "city", label: "City" },
  { key: "estimatedValue", label: "Value", numeric: true },
  { key: "status", label: "Status" },
  { key: "createdOnUtc", label: "Captured" },
];

export function LeadsListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  const pageNumber = Number(params.get("page") ?? "1") || 1;
  const status = (params.get("status") as LeadStatus | null) ?? "";
  const serviceType = (params.get("svc") as LeadServiceType | null) ?? "";
  const source = (params.get("src") as LeadSource | null) ?? "";
  const search = params.get("q") ?? "";
  const sortBy = (params.get("sort") as LeadSortBy | null) ?? "createdOnUtc";
  const sortDir: "asc" | "desc" = params.get("dir") === "asc" ? "asc" : "desc";

  // Local search box state + debounced sync into the URL (same pattern as audits).
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput === search) return;
      const next = new URLSearchParams(params);
      if (searchInput.trim()) next.set("q", searchInput.trim());
      else next.delete("q");
      next.set("page", "1");
      setParams(next, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["leads", { pageNumber, status, serviceType, source, search, sortBy, sortDir }],
    queryFn: () =>
      searchLeads({
        pageNumber,
        pageSize: PAGE_SIZE,
        status: status || undefined,
        serviceType: serviceType || undefined,
        source: source || undefined,
        search: search || undefined,
        sortBy,
        sortDir,
      }),
    placeholderData: keepPreviousData,
  });

  const stats = useQuery({
    queryKey: ["leads", "stats"],
    queryFn: () => getLeadStats(),
  });

  const data = query.data;
  const items: LeadDto[] = data?.items ?? [];

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  const setPage = (n: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(n));
    setParams(next, { replace: true });
  };

  const toggleSort = (key: LeadSortBy) => {
    const next = new URLSearchParams(params);
    if (sortBy === key) {
      next.set("dir", sortDir === "desc" ? "asc" : "desc");
    } else {
      next.set("sort", key);
      // Dates/values read best newest/biggest-first; text columns A→Z.
      next.set("dir", key === "createdOnUtc" || key === "estimatedValue" ? "desc" : "asc");
    }
    next.set("page", "1");
    setParams(next, { replace: true });
  };

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setSearchInput("");
  };

  const activeFilters = [status, serviceType, source, search].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <EntityPageHeader
        icon={Filter}
        title="Leads"
        total={data?.totalCount ?? null}
        unit="lead"
        description="The Paragon Exteriors pipeline — every estimate request captured from the website, phone, ads, and referrals. Work a lead from first contact through won or lost."
      >
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching}
          onClick={() => {
            query.refetch();
            stats.refetch();
          }}
          className="flex-1 sm:flex-none"
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", query.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </EntityPageHeader>

      {/* ── Pipeline analytics ─────────────────────────────────────────── */}
      <StatStrip cols={4}>
        <Stat
          label="Total leads"
          value={stats.isLoading ? <Skeleton className="h-7 w-16" /> : (stats.data?.totalLeads ?? 0).toLocaleString()}
          hint="captured all-time"
        />
        <Stat
          label="Conversion rate"
          value={stats.isLoading ? <Skeleton className="h-7 w-16" /> : formatPercent(stats.data?.conversionRate)}
          hint="won of all closed leads"
          tone={(stats.data?.conversionRate ?? 0) > 0 ? "success" : "default"}
        />
        <Stat
          label="Pipeline value"
          value={stats.isLoading ? <Skeleton className="h-7 w-20" /> : formatCurrency(stats.data?.pipelineValue)}
          hint="open estimates in flight"
          tone="info"
        />
        <Stat
          label="Won value"
          value={stats.isLoading ? <Skeleton className="h-7 w-20" /> : formatCurrency(stats.data?.wonValue)}
          hint="closed-won job value"
          tone={(stats.data?.wonValue ?? 0) > 0 ? "signal" : "default"}
        />
      </StatStrip>

      {stats.data && <LeadsAnalytics stats={stats.data} />}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <FilterBar
        trailing={
          activeFilters > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
              <X className="mr-1 h-3.5 w-3.5" /> Clear all ({activeFilters})
            </Button>
          ) : undefined
        }
      >
        <div className="min-w-[14rem] flex-1">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, phone…"
            aria-label="Search leads"
            className="h-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => setParam("status", v || null)}
          options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
          emptyLabel="All statuses"
          className="min-w-[11rem]"
        />
        <Select
          value={serviceType}
          onValueChange={(v) => setParam("svc", v || null)}
          options={LEAD_SERVICE_TYPES.map((s) => ({ value: s, label: LEAD_SERVICE_TYPE_LABELS[s] }))}
          emptyLabel="All services"
          className="min-w-[11rem]"
        />
        <Select
          value={source}
          onValueChange={(v) => setParam("src", v || null)}
          options={LEAD_SOURCES.map((s) => ({ value: s, label: LEAD_SOURCE_LABELS[s] }))}
          emptyLabel="All sources"
          className="min-w-[10rem]"
        />
      </FilterBar>

      {query.isError && (
        <ErrorBand
          message={
            query.error instanceof ApiRequestError
              ? query.error.problem?.detail ?? query.error.message
              : "Failed to load leads."
          }
        />
      )}

      {query.isLoading && <LoadingRow label="Loading leads" />}

      {!query.isLoading && items.length === 0 && !query.isError && (
        <EmptyState
          icon={Filter}
          kicker="// no leads"
          title="No leads match your filters."
          description={
            activeFilters > 0
              ? "Try clearing or relaxing a filter — the pipeline is broad by default."
              : "Nothing captured yet. New estimate requests land here the moment they come in."
          }
          action={
            activeFilters > 0 ? (
              <Button variant="outline" onClick={clearAll}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {SORTABLE.map((col) => (
                <TableHead key={col.key} className={cn(col.numeric && "text-right")}>
                  <SortButton
                    label={col.label}
                    active={sortBy === col.key}
                    dir={sortDir}
                    onClick={() => toggleSort(col.key)}
                  />
                </TableHead>
              ))}
              <TableHead aria-label="Notes" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onOpen={() => setSelectedId(lead.id)} />
            ))}
          </TableBody>
        </Table>
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.pageNumber}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          shown={items.length}
          fetching={query.isFetching}
          hasPrev={data.hasPrevious}
          hasNext={data.hasNext}
          onPrev={() => setPage(Math.max(1, pageNumber - 1))}
          onNext={() => setPage(pageNumber + 1)}
          noun="leads"
        />
      )}

      {/* Lead detail side sheet */}
      <LeadDetailSheet leadId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ─── Table pieces ────────────────────────────────────────────────────────

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label}`}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-[var(--tracking-meta)]",
        "transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded-sm",
        active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]",
      )}
    >
      {label}
      <Icon className={cn("h-3 w-3", !active && "opacity-50")} aria-hidden />
    </button>
  );
}

function LeadRow({ lead, onOpen }: { lead: LeadDto; onOpen: () => void }) {
  return (
    // Whole-row click is a mouse convenience; the accessible open control is
    // the name button in the first cell (same pattern as webhooks rows).
    <TableRow onClick={onOpen} className="cursor-pointer">
      <TableCell>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label={`Open lead ${lead.firstName} ${lead.lastName}`}
          className={cn(
            "-mx-2 block min-w-0 rounded-md px-2 py-1 text-left transition-colors",
            "hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
          )}
        >
          <div className="font-medium text-[var(--color-foreground)]">
            {lead.firstName} {lead.lastName}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-muted-foreground)]">
            {lead.email}
          </div>
        </button>
      </TableCell>
      <TableCell className="whitespace-nowrap text-[13px]">
        {LEAD_SERVICE_TYPE_LABELS[lead.serviceType] ?? lead.serviceType}
      </TableCell>
      <TableCell className="whitespace-nowrap text-[13px] text-[var(--color-muted-foreground)]">
        {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
      </TableCell>
      <TableCell className="whitespace-nowrap text-[13px] text-[var(--color-muted-foreground)]">
        {lead.city ?? "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right font-mono text-[12.5px] tabular-nums">
        {formatCurrency(lead.estimatedValue)}
      </TableCell>
      <TableCell>
        <Badge variant={leadStatusVariant(lead.status)} className="font-mono uppercase tracking-[0.12em]">
          {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-[11.5px] text-[var(--color-muted-foreground)]">
        {formatDate(lead.createdOnUtc)}
      </TableCell>
      <TableCell className="w-12">
        {lead.noteCount > 0 && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-muted-foreground)]"
            title={`${lead.noteCount} ${lead.noteCount === 1 ? "note" : "notes"}`}
          >
            <MessageSquare className="h-3 w-3" aria-hidden />
            {lead.noteCount}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Analytics panels ────────────────────────────────────────────────────

function LeadsAnalytics({ stats }: { stats: LeadStatsDto }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
      <WeeklyLeadsChart data={stats.leadsPerWeek} className="lg:col-span-2 xl:col-span-1" />
      <BreakdownPanel
        title="Pipeline by status"
        items={stats.byStatus.map((s) => ({
          key: s.status,
          label: LEAD_STATUS_LABELS[s.status] ?? s.status,
          count: s.count,
          dotClass: statusDotClass(s.status),
        }))}
      />
      <BreakdownPanel
        title="By source"
        items={stats.bySource.map((s) => ({
          key: s.source,
          label: LEAD_SOURCE_LABELS[s.source] ?? s.source,
          count: s.count,
        }))}
      />
    </div>
  );
}

function statusDotClass(status: LeadStatus): string {
  switch (status) {
    case "New":
      return "bg-[var(--color-info)]";
    case "Contacted":
      return "bg-[var(--color-muted-foreground)]";
    case "EstimateScheduled":
      return "bg-[var(--color-warning)]";
    case "EstimateSent":
      return "bg-[var(--color-primary)]";
    case "Won":
      return "bg-[var(--color-success)]";
    case "Lost":
      return "bg-[var(--color-destructive)]";
    default:
      return "bg-[var(--color-muted-foreground)]/50";
  }
}

/**
 * WeeklyLeadsChart — 12 Monday-aligned buckets as a CSS bar chart. Single
 * series, so identity lives in the panel title (no legend); each bar
 * carries its own accessible label + native tooltip. Zero weeks render a
 * hairline stub so the timeline stays continuous.
 */
function WeeklyLeadsChart({
  data,
  className,
}: {
  data: LeadStatsDto["leadsPerWeek"];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((w) => w.count));
  const total = data.reduce((acc, w) => acc + w.count, 0);
  const first = data[0]?.weekStart;
  const last = data[data.length - 1]?.weekStart;

  return (
    <section
      aria-label="Leads captured per week, last 12 weeks"
      className={cn("card-shell flex flex-col rounded-xl px-5 py-4", className)}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="meta text-[var(--color-muted-foreground)]">Leads per week</span>
        <span className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
          {total.toLocaleString()} in 12 wks
        </span>
      </div>

      <div
        className="mt-3 flex h-28 flex-1 items-end gap-[3px]"
        role="img"
        aria-label={`Leads per week, oldest first: ${data.map((w) => w.count).join(", ")}`}
      >
        {data.map((week) => {
          const label = `Week of ${formatDate(week.weekStart)} — ${week.count} ${week.count === 1 ? "lead" : "leads"}`;
          return (
            <div
              key={week.weekStart}
              aria-hidden
              className="group relative flex h-full flex-1 items-end"
              title={label}
            >
              <div
                style={{ height: week.count === 0 ? "2px" : `${Math.max(6, (week.count / max) * 100)}%` }}
                className={cn(
                  "w-full rounded-t-[4px] transition-colors",
                  week.count === 0
                    ? "bg-[var(--color-border)]"
                    : "bg-[var(--color-accent-signal)]/75 group-hover:bg-[var(--color-accent-signal)]",
                )}
              />
              {/* Hover value flag */}
              <span
                className={cn(
                  "pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full",
                  "rounded border border-[var(--color-border)] bg-[var(--color-popover)] px-1.5 py-0.5",
                  "font-mono text-[10px] tabular-nums text-[var(--color-popover-foreground)] shadow-sm",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                {week.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted-foreground)]">
        <span>{formatDate(first)}</span>
        <span>{formatDate(last)}</span>
      </div>
    </section>
  );
}

/**
 * BreakdownPanel — label / count / share bar rows. Identity is carried by
 * the row label (plus an optional status-colored dot); the bars are a
 * single hue and encode magnitude only.
 */
function BreakdownPanel({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number; dotClass?: string }>;
}) {
  const total = items.reduce((acc, i) => acc + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));
  const sorted = [...items].sort((a, b) => b.count - a.count);

  return (
    <section aria-label={title} className="card-shell flex flex-col rounded-xl px-5 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="meta text-[var(--color-muted-foreground)]">{title}</span>
        <span className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
          {total.toLocaleString()}
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-3 text-[12px] text-[var(--color-muted-foreground)]">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {sorted.map((item) => {
            const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li
                key={item.key}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
                title={`${item.label} — ${item.count} (${share}%)`}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--color-foreground)]">
                  {item.dotClass && (
                    <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", item.dotClass)} />
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                  {item.count.toLocaleString()}
                </span>
                <div
                  aria-hidden
                  className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]"
                >
                  <div
                    style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
                    className="h-full rounded-full bg-[var(--color-primary)]/70"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
