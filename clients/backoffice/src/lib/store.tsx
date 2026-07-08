import { useCallback, useEffect, useState } from 'react';

/**
 * Data layer for the /admin back office: password session + generic CRUD
 * against /api/admin (Postgres JSONB records). Replaces Auth0 + Convex.
 */

const API = '/api/admin';

export type Rec<T> = T & { id: number; createdAt: string };

/** Strip server bookkeeping before re-saving a record (save replaces `data`). */
export function bare<T extends object>(rec: Rec<T>): T {
  const { id: _id, createdAt: _c, ...rest } = rec as Rec<T> & { id: number; createdAt: string };
  return rest as unknown as T;
}

async function call(body: unknown) {
  const r = await fetch(`${API}/crm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  if (r.status === 401) {
    window.location.reload(); // session expired — back to the password screen
    throw new Error('signed out');
  }
  if (!r.ok) throw new Error(`request failed (${r.status})`);
  return r.json();
}

export function useKind<T extends object>(kind: string) {
  const [items, setItems] = useState<Rec<T>[] | null>(null);
  const refresh = useCallback(async () => {
    const d = await call({ op: 'list', kind });
    setItems(d.items as Rec<T>[]);
  }, [kind]);
  useEffect(() => {
    refresh().catch(() => setItems([]));
  }, [refresh]);
  const save = useCallback(
    async (data: T, id?: number) => {
      await call({ op: 'save', kind, id, data });
      await refresh();
    },
    [kind, refresh],
  );
  const remove = useCallback(
    async (id: number) => {
      await call({ op: 'remove', id });
      await refresh();
    },
    [refresh],
  );
  return { items, save, remove, refresh };
}

export async function checkSession(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/login/`, { credentials: 'same-origin' });
    const d = await r.json();
    return !!d.ok;
  } catch {
    return false;
  }
}

/** Returns null on success, an error message otherwise. */
export async function login(password: string): Promise<string | null> {
  const r = await fetch(`${API}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ password }),
  });
  if (r.ok) return null;
  const d = await r.json().catch(() => null);
  return (d && d.error) || `Login failed (${r.status})`;
}

export async function logout() {
  await fetch(`${API}/login/`, { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
}

/** Fire-and-forget create of any record kind (used to log activities). */
export async function saveKind<T extends object>(kind: string, data: T): Promise<number | undefined> {
  try {
    const d = await call({ op: 'save', kind, data });
    return d.id as number;
  } catch {
    return undefined;
  }
}

/**
 * The unified activity timeline — "the spine" (brief §7). Every meaningful
 * event (lead created, stage moved, note, call, sms, email, estimate,
 * invoice, payment, signature, list push) writes one row here so six tools
 * feel like one product. Retrofitting this later is a rewrite, so it exists
 * from day one — even before the comms integrations that will feed it.
 */
export type ActivityType =
  | 'note' | 'stage' | 'created' | 'call' | 'sms' | 'email'
  | 'meeting' | 'signature' | 'payment' | 'estimate' | 'invoice' | 'task' | 'list';

export type Activity = {
  type: ActivityType;
  title: string;
  body?: string;
  direction?: 'in' | 'out';
  actor?: string;
  at: number;
  // polymorphic links into the CRM
  leadId?: number;
  leadName?: string;
  estimateId?: number;
  invoiceId?: number;
  // reserved for provider webhooks (Telnyx/AgentMail/Docuseal/Stripe)
  provider?: string;
  providerId?: string;
};

export function logActivity(a: Omit<Activity, 'at'> & { at?: number }) {
  return saveKind<Activity>('activity', { ...a, at: a.at ?? Date.now() });
}

// ---------- record shapes ----------

export type Lead = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  town?: string;
  zip?: string;
  service?: string;
  message?: string;
  source?: string;
  stage: string; // new | contacted | estimate | won | lost
  notes: Array<{ text: string; at: number }>;
  // HubSpot-replacement intake fields
  homeAge?: string;
  lastRoofRepair?: string;
  socials?: string;
  referredFrom?: string;
  enteredBy?: string;
  owner?: string;
  // CRM header (Joe's outline)
  scope?: string;
  proposalSentAt?: number;
  contractSignedAt?: number;
  subAssigned?: string;
  jobCost?: number;
  scheduledAt?: number;
  completedAt?: number;
  deposit?: number;
  additionalPayment?: number;
  finalPayment?: number;
  materialCost?: number;
  laborCost?: number;
  dumpsterCost?: number;
};

export type Contractor = {
  name: string;
  phone?: string;
  email?: string;
  specializedIn?: string;
  hicNumber?: string;
  insurance?: string;
  w9?: string;
  license?: string;
  notes?: string;
  extra?: Record<string, string>;
};

export type Dumpster = {
  company: string;
  phone?: string;
  email?: string;
  info?: string;
  cost10?: number;
  cost20?: number;
  cost30?: number;
  extra?: Record<string, string>;
};

export type Supplier = {
  company: string;
  phone?: string;
  email?: string;
  notes?: string;
  materials: Array<{ name: string; cost?: number; unit?: string }>;
  extra?: Record<string, string>;
};

export type Expense = {
  date: number;
  category: string;
  amount: number;
  payee?: string;
  channel?: string;
  notes?: string;
};

export type ExpenseCategory = { name: string };

export type Contact = {
  address: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  town?: string;
  zip?: string;
  list?: string;
  tags?: string[];
};

export type ListJob = {
  zip: string;
  town?: string;
  status: string; // running | done | error
  note?: string;
  count?: number;
  runId?: string;
};

export type LineItem = { name: string; qty: number; unit?: string; unitPrice: number };

/** Estimate → the sales-to-cash entry point (brief §1/§2). Converts to an invoice. */
export type Estimate = {
  number: string; // EST-0001
  customer: string;
  address?: string;
  leadId?: number;
  tradeType?: string; // roofing | siding | windows | decks
  lineItems: LineItem[];
  // roofing squares calculator inputs (optional)
  roofSquares?: number;
  wastePct?: number;
  pricePerSquare?: number;
  taxPct?: number;
  status: string; // draft | sent | accepted | declined | invoiced
  notes?: string;
};

export type Invoice = {
  number: string; // INV-0001
  customer: string;
  address?: string;
  leadId?: number;
  estimateId?: number;
  lineItems: LineItem[];
  taxPct?: number;
  amountPaid?: number;
  status: string; // unpaid | partial | paid
  dueAt?: number;
  notes?: string;
};

/** Sum a line-item list + tax → subtotal, tax, total. */
export function invoiceTotals(items: LineItem[], taxPct = 0) {
  const subtotal = items.reduce((n, li) => n + (li.qty || 0) * (li.unitPrice || 0), 0);
  const tax = subtotal * (taxPct / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export async function listBuilderOp(body: Record<string, unknown>) {
  const r = await fetch(`${API}/listbuilder/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error((d && (d as { error?: string }).error) || `request failed (${r.status})`);
  return d;
}
