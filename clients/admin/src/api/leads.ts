import { apiFetch } from "@/lib/api-client";
import type { PagedResponse } from "@/lib/api-types";

// ─── Enums (string-serialized by the API's global JsonStringEnumConverter) ──

export type LeadStatus =
  | "New"
  | "Contacted"
  | "EstimateScheduled"
  | "EstimateSent"
  | "Won"
  | "Lost";

export type LeadSource =
  | "Website"
  | "Phone"
  | "Referral"
  | "Instagram"
  | "Facebook"
  | "GoogleAds"
  | "VoiceAgent"
  | "Other";

export type LeadServiceType =
  | "Roofing"
  | "RoofRepair"
  | "RoofReplacement"
  | "Siding"
  | "Windows"
  | "Doors"
  | "Decks"
  | "Gutters"
  | "Commercial"
  | "Other";

export type LeadContactMethod = "Phone" | "Email" | "Text";

/** Pipeline order — drives the status filter, badges, and the funnel readout. */
export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "EstimateScheduled",
  "EstimateSent",
  "Won",
  "Lost",
];

export const LEAD_SOURCES: LeadSource[] = [
  "Website",
  "Phone",
  "Referral",
  "Instagram",
  "Facebook",
  "GoogleAds",
  "VoiceAgent",
  "Other",
];

export const LEAD_SERVICE_TYPES: LeadServiceType[] = [
  "Roofing",
  "RoofRepair",
  "RoofReplacement",
  "Siding",
  "Windows",
  "Doors",
  "Decks",
  "Gutters",
  "Commercial",
  "Other",
];

export const LEAD_CONTACT_METHODS: LeadContactMethod[] = ["Phone", "Email", "Text"];

/** Human labels for the PascalCase enum names. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  New: "New",
  Contacted: "Contacted",
  EstimateScheduled: "Estimate scheduled",
  EstimateSent: "Estimate sent",
  Won: "Won",
  Lost: "Lost",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  Website: "Website",
  Phone: "Phone",
  Referral: "Referral",
  Instagram: "Instagram",
  Facebook: "Facebook",
  GoogleAds: "Google Ads",
  VoiceAgent: "Voice agent",
  Other: "Other",
};

export const LEAD_SERVICE_TYPE_LABELS: Record<LeadServiceType, string> = {
  Roofing: "Roofing",
  RoofRepair: "Roof repair",
  RoofReplacement: "Roof replacement",
  Siding: "Siding",
  Windows: "Windows",
  Doors: "Doors",
  Decks: "Decks",
  Gutters: "Gutters",
  Commercial: "Commercial",
  Other: "Other",
};

// ─── DTOs (mirrors Modules.Crm.Contracts, camelCase over the wire) ─────────

export type LeadDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  serviceType: LeadServiceType;
  message?: string | null;
  preferredContactMethod: LeadContactMethod;
  status: LeadStatus;
  source: LeadSource;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  estimatedValue?: number | null;
  lostReason?: string | null;
  createdOnUtc: string;
  lastModifiedOnUtc?: string | null;
  noteCount: number;
};

export type LeadNoteDto = {
  id: string;
  leadId: string;
  body: string;
  createdBy?: string | null;
  createdOnUtc: string;
};

export type LeadStatsDto = {
  totalLeads: number;
  byStatus: Array<{ status: LeadStatus; count: number }>;
  bySource: Array<{ source: LeadSource; count: number }>;
  byServiceType: Array<{ serviceType: LeadServiceType; count: number }>;
  /** Zero-filled 12-week series; weekStart is a Monday-aligned ISO date. */
  leadsPerWeek: Array<{ weekStart: string; count: number }>;
  conversionRate: number;
  pipelineValue: number;
  wonValue: number;
};

// ─── Requests ───────────────────────────────────────────────────────────────

/** Sort keys accepted by the search endpoint (default: captured date). */
export type LeadSortBy =
  | "createdOnUtc"
  | "name"
  | "status"
  | "source"
  | "serviceType"
  | "city"
  | "estimatedValue";

export type SearchLeadsParams = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: LeadStatus;
  serviceType?: LeadServiceType;
  source?: LeadSource;
  city?: string;
  capturedFrom?: string;
  capturedTo?: string;
  sortBy?: LeadSortBy;
  sortDir?: "asc" | "desc";
};

export type UpdateLeadInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceType: LeadServiceType;
  preferredContactMethod: LeadContactMethod;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  message?: string | null;
  estimatedValue?: number | null;
};

export type UpdateLeadStatusInput = {
  status: LeadStatus;
  lostReason?: string | null;
  estimatedValue?: number | null;
};

const BASE = "/api/v1/crm/leads";

// ─── Calls ──────────────────────────────────────────────────────────────────

export function searchLeads(params: SearchLeadsParams = {}): Promise<PagedResponse<LeadDto>> {
  const q = new URLSearchParams();
  q.set("PageNumber", String(params.pageNumber ?? 1));
  q.set("PageSize", String(params.pageSize ?? 20));
  if (params.search?.trim()) q.set("Search", params.search.trim());
  if (params.status) q.set("Status", params.status);
  if (params.serviceType) q.set("ServiceType", params.serviceType);
  if (params.source) q.set("Source", params.source);
  if (params.city?.trim()) q.set("City", params.city.trim());
  if (params.capturedFrom) q.set("CapturedFrom", params.capturedFrom);
  if (params.capturedTo) q.set("CapturedTo", params.capturedTo);
  if (params.sortBy) q.set("SortBy", params.sortBy);
  if (params.sortDir) q.set("SortDir", params.sortDir);
  return apiFetch<PagedResponse<LeadDto>>(`${BASE}?${q.toString()}`);
}

export function getLeadStats(): Promise<LeadStatsDto> {
  return apiFetch<LeadStatsDto>(`${BASE}/stats`);
}

export function getLead(id: string): Promise<LeadDto> {
  return apiFetch<LeadDto>(`${BASE}/${encodeURIComponent(id)}`);
}

export function updateLead(id: string, input: UpdateLeadInput): Promise<string> {
  return apiFetch<string>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateLeadStatus(id: string, input: UpdateLeadStatusInput): Promise<string> {
  return apiFetch<string>(`${BASE}/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function addLeadNote(id: string, body: string): Promise<string> {
  return apiFetch<string>(`${BASE}/${encodeURIComponent(id)}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function listLeadNotes(id: string): Promise<LeadNoteDto[]> {
  return apiFetch<LeadNoteDto[]>(`${BASE}/${encodeURIComponent(id)}/notes`);
}
