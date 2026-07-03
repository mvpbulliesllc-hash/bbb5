import type { LeadStatus } from "@/api/leads";

/**
 * Shared presentation helpers for the Leads pipeline — status → badge
 * variant mapping and the value/date formatters used by both the list
 * table and the detail sheet.
 */

type BadgeVariant = "default" | "brand" | "muted" | "success" | "warning" | "info" | "danger";

/**
 * Pipeline-stage color coding. Progression reads cool → warm → resolved:
 * New (info) → Contacted (default) → EstimateScheduled (warning) →
 * EstimateSent (brand) → Won (success) / Lost (danger).
 */
export function leadStatusVariant(status: LeadStatus): BadgeVariant {
  switch (status) {
    case "New":
      return "info";
    case "Contacted":
      return "default";
    case "EstimateScheduled":
      return "warning";
    case "EstimateSent":
      return "brand";
    case "Won":
      return "success";
    case "Lost":
      return "danger";
    default:
      return "muted";
  }
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$12,500" — whole dollars; leads carry estimates, not cents. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return currency.format(value);
}

/** Tight local date: "May 20, 2026". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "May 20, 2026 · 14:22" for note timestamps. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(value)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "0.42" → "42%". */
export function formatPercent(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined) return "—";
  return `${Math.round(fraction * 100)}%`;
}
