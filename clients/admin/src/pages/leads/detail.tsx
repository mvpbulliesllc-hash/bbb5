import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Contact,
  Hammer,
  MapPin,
  Megaphone,
  MessageSquare,
  Pencil,
  StickyNote,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  LEAD_CONTACT_METHODS,
  LEAD_SERVICE_TYPES,
  LEAD_SERVICE_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  addLeadNote,
  getLead,
  listLeadNotes,
  updateLead,
  updateLeadStatus,
  type LeadContactMethod,
  type LeadDto,
  type LeadServiceType,
  type LeadStatus,
  type UpdateLeadInput,
  type UpdateLeadStatusInput,
} from "@/api/leads";
import { useAuth } from "@/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
} from "@/components/ui/dialog";
import { ErrorBand, Field, LoadingRow, Select } from "@/components/list";
import { ApiRequestError } from "@/lib/api-client";
import { CrmPermissions } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  leadStatusVariant,
} from "@/pages/leads/lead-meta";

// ─────────────────────────────────────────────────────────────────────────
// LeadDetailSheet — side sheet opened by clicking a row on the leads list.
// Contact info, job details, pipeline status changer, marketing
// attribution, and the notes timeline.
// ─────────────────────────────────────────────────────────────────────────

export function LeadDetailSheet({
  leadId,
  onClose,
}: {
  leadId: string | null;
  onClose: () => void;
}) {
  const open = Boolean(leadId);
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showClose={false}
        className="w-[min(640px,95vw)] max-w-none overflow-hidden p-0"
      >
        {leadId && <LeadDetailBody leadId={leadId} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function LeadDetailBody({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { user } = useAuth();
  const granted = user?.permissions ?? [];
  const canUpdate = granted.includes(CrmPermissions.Leads.Update);
  const canUpdateStatus = granted.includes(CrmPermissions.Leads.UpdateStatus);
  const canNote = granted.includes(CrmPermissions.Leads.Note);

  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    queryKey: ["leads", leadId],
    queryFn: () => getLead(leadId),
  });

  const lead = query.data;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--color-muted)]">
            <Contact className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
                {lead ? `${lead.firstName} ${lead.lastName}` : "Lead"}
              </span>
              {lead && (
                <Badge variant={leadStatusVariant(lead.status)} className="font-mono uppercase tracking-[0.12em]">
                  {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 font-mono text-[10.5px] text-[var(--color-muted-foreground)]">
              {lead ? `captured ${formatDate(lead.createdOnUtc)}` : "Loading…"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {lead && canUpdate && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md",
              "text-[var(--color-muted-foreground)] transition-colors",
              "hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.isLoading && (
          <div className="p-6">
            <LoadingRow label="Loading lead" />
          </div>
        )}

        {query.isError && (
          <div className="p-6">
            <ErrorBand
              message={
                query.error instanceof ApiRequestError
                  ? query.error.problem?.detail ?? query.error.message
                  : "Failed to load lead."
              }
            />
          </div>
        )}

        {lead && (
          <div className="space-y-0 divide-y divide-[var(--color-border)]">
            <ContactSection lead={lead} />
            <JobSection lead={lead} />
            {canUpdateStatus && (
              <StatusSection key={`${lead.id}:${lead.status}`} lead={lead} />
            )}
            <AttributionSection lead={lead} />
            <NotesSection leadId={lead.id} canNote={canNote} />
          </div>
        )}
      </div>

      {lead && (
        <EditLeadDialog lead={lead} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  );
}

// ─── Section chrome ──────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  label,
  aside,
}: {
  icon: typeof Contact;
  label: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" aria-hidden />
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted-foreground)]">
        {label}
      </span>
      {aside && <span className="ml-auto">{aside}</span>}
    </div>
  );
}

function FactTile({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
        {label}
      </div>
      <div
        className={cn(
          "min-w-0 break-words text-sm text-[var(--color-foreground)]",
          mono && "font-mono text-[12px]",
        )}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

// ─── 1. Contact ──────────────────────────────────────────────────────────

function ContactSection({ lead }: { lead: LeadDto }) {
  const addressLine =
    [lead.address, lead.city, lead.zipCode].filter(Boolean).join(", ") || null;
  return (
    <div className="px-6 py-4">
      <SectionHeading icon={Contact} label="Contact" />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}
      >
        <FactTile label="Email" value={lead.email} />
        <FactTile label="Phone" value={lead.phone} />
        <FactTile label="Prefers" value={lead.preferredContactMethod} />
        <FactTile
          label="Address"
          value={
            addressLine ? (
              <span className="inline-flex items-start gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
                {addressLine}
              </span>
            ) : (
              "—"
            )
          }
        />
      </div>
    </div>
  );
}

// ─── 2. Job ──────────────────────────────────────────────────────────────

function JobSection({ lead }: { lead: LeadDto }) {
  return (
    <div className="px-6 py-4">
      <SectionHeading icon={Hammer} label="Job" />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}
      >
        <FactTile
          label="Service"
          value={LEAD_SERVICE_TYPE_LABELS[lead.serviceType] ?? lead.serviceType}
          mono={false}
        />
        <FactTile label="Estimated value" value={formatCurrency(lead.estimatedValue)} />
      </div>
      {lead.message && (
        <blockquote className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-foreground)]">
          {lead.message}
        </blockquote>
      )}
      {lead.status === "Lost" && lead.lostReason && (
        <p className="mt-2 rounded-lg border border-[oklch(from_var(--color-destructive)_l_c_h_/_0.35)] bg-[oklch(from_var(--color-destructive)_l_c_h_/_0.08)] px-4 py-3 text-[12.5px] text-[var(--color-destructive)]">
          Lost — {lead.lostReason}
        </p>
      )}
    </div>
  );
}

// ─── 3. Status changer ───────────────────────────────────────────────────

function StatusSection({ lead }: { lead: LeadDto }) {
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<LeadStatus>(lead.status);
  const [lostReason, setLostReason] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(
    lead.estimatedValue !== null && lead.estimatedValue !== undefined
      ? String(lead.estimatedValue)
      : "",
  );

  const mutation = useMutation({
    mutationFn: (input: UpdateLeadStatusInput) => updateLeadStatus(lead.id, input),
    onSuccess: (_id, variables) => {
      toast.success(`Lead moved to ${LEAD_STATUS_LABELS[variables.status]}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error("Status update failed", { description: describe(err) }),
  });

  const parsedValue = estimatedValue.trim() === "" ? null : Number(estimatedValue);
  const valueInvalid =
    parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0);
  const lostReasonMissing = nextStatus === "Lost" && lostReason.trim().length === 0;
  const dirty =
    nextStatus !== lead.status || parsedValue !== (lead.estimatedValue ?? null);

  const apply = () => {
    if (lostReasonMissing) {
      toast.warning("A lost reason is required when marking a lead as Lost.");
      return;
    }
    if (valueInvalid) {
      toast.warning("Estimated value must be a non-negative number.");
      return;
    }
    // Per-call data rides through mutate(arg) — never closed-over state.
    mutation.mutate({
      status: nextStatus,
      lostReason: nextStatus === "Lost" ? lostReason.trim() : null,
      estimatedValue: parsedValue,
    });
  };

  return (
    <div className="px-6 py-4">
      <SectionHeading icon={ArrowRight} label="Pipeline" />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[13rem] flex-1 space-y-1.5">
          <label
            htmlFor="lead-next-status"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]"
          >
            Move to
          </label>
          <Select
            id="lead-next-status"
            value={nextStatus}
            onValueChange={(v) => v && setNextStatus(v as LeadStatus)}
            options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
          />
        </div>
        <div className="min-w-[9rem] space-y-1.5">
          <label
            htmlFor="lead-estimated-value"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]"
          >
            Estimated value ($)
          </label>
          <Input
            id="lead-estimated-value"
            type="number"
            min={0}
            step={100}
            inputMode="decimal"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            placeholder="e.g. 12500"
            aria-invalid={valueInvalid ? true : undefined}
            className="font-mono"
          />
        </div>
        <Button
          onClick={apply}
          disabled={mutation.isPending || !dirty}
          className="shrink-0"
        >
          {mutation.isPending ? "Updating…" : "Update status"}
        </Button>
      </div>

      {nextStatus === "Lost" && (
        <div className="mt-3 space-y-1.5">
          <label
            htmlFor="lead-lost-reason"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]"
          >
            Lost reason
            <span className="ml-1 text-[var(--color-destructive)]" aria-hidden>·</span>
          </label>
          <textarea
            id="lead-lost-reason"
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="e.g. Went with another contractor; price too high"
            rows={2}
            maxLength={1024}
            className={cn(
              "w-full resize-y rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm",
              "transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)]",
              "hover:border-[var(--color-border-strong)]",
              "focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(from_var(--color-ring)_l_c_h_/_0.5)]",
              "placeholder:text-[var(--color-muted-foreground)]",
            )}
          />
        </div>
      )}
    </div>
  );
}

// ─── 4. Attribution ──────────────────────────────────────────────────────

function AttributionSection({ lead }: { lead: LeadDto }) {
  return (
    <div className="px-6 py-4">
      <SectionHeading
        icon={Megaphone}
        label="Attribution"
        aside={
          <Badge variant="outline" className="font-mono uppercase tracking-[0.12em]">
            {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
          </Badge>
        }
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FactTile label="utm_source" value={lead.utmSource ?? "—"} />
        <FactTile label="utm_medium" value={lead.utmMedium ?? "—"} />
        <FactTile label="utm_campaign" value={lead.utmCampaign ?? "—"} />
        <FactTile label="utm_term" value={lead.utmTerm ?? "—"} />
        <FactTile label="utm_content" value={lead.utmContent ?? "—"} />
        <FactTile label="Landing page" value={lead.landingPage ?? "—"} />
        <FactTile label="Referrer" value={lead.referrer ?? "—"} />
      </div>
    </div>
  );
}

// ─── 5. Notes timeline ───────────────────────────────────────────────────

function NotesSection({ leadId, canNote }: { leadId: string; canNote: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const notesQuery = useQuery({
    queryKey: ["leads", leadId, "notes"],
    queryFn: () => listLeadNotes(leadId),
  });

  const addNote = useMutation({
    mutationFn: (vars: { body: string }) => addLeadNote(leadId, vars.body),
    onSuccess: () => {
      toast.success("Note added");
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error("Failed to add note", { description: describe(err) }),
  });

  const notes = notesQuery.data ?? [];

  return (
    <div className="px-6 py-4">
      <SectionHeading
        icon={StickyNote}
        label="Notes"
        aside={
          <span className="font-mono text-[10.5px] text-[var(--color-muted-foreground)]">
            {notes.length}
          </span>
        }
      />

      {canNote && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            addNote.mutate({ body });
          }}
          className="mb-3 space-y-2"
        >
          <label htmlFor="lead-new-note" className="sr-only">
            Add a note
          </label>
          <textarea
            id="lead-new-note"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Call summary, estimate detail, follow-up reminder…"
            rows={2}
            maxLength={4096}
            className={cn(
              "w-full resize-y rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm",
              "transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)]",
              "hover:border-[var(--color-border-strong)]",
              "focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(from_var(--color-ring)_l_c_h_/_0.5)]",
              "placeholder:text-[var(--color-muted-foreground)]",
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={addNote.isPending || draft.trim().length === 0}>
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              {addNote.isPending ? "Adding…" : "Add note"}
            </Button>
          </div>
        </form>
      )}

      {notesQuery.isLoading && <LoadingRow label="Loading notes" />}

      {notesQuery.isError && (
        <ErrorBand
          message={
            notesQuery.error instanceof ApiRequestError
              ? notesQuery.error.problem?.detail ?? notesQuery.error.message
              : "Failed to load notes."
          }
        />
      )}

      {!notesQuery.isLoading && notes.length === 0 && !notesQuery.isError && (
        <p className="text-[12.5px] text-[var(--color-muted-foreground)]">
          No notes yet{canNote ? " — add the first call summary above." : "."}
        </p>
      )}

      {notes.length > 0 && (
        <ol className="space-y-2.5 border-l border-[var(--color-border)] pl-4">
          {notes.map((note) => (
            <li key={note.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[var(--color-border-strong)]"
              />
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-muted-foreground)]">
                {formatDateTime(note.createdOnUtc)}
                {note.createdBy && <> · {note.createdBy}</>}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-foreground)]">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Edit dialog (RHF + zod) ─────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().trim().min(1, "Required.").max(64),
  lastName: z.string().trim().min(1, "Required.").max(64),
  email: z.string().trim().min(1, "Required.").email("Must be a valid email.").max(256),
  phone: z.string().trim().min(1, "Required.").max(32),
  serviceType: z.enum(LEAD_SERVICE_TYPES as [LeadServiceType, ...LeadServiceType[]]),
  preferredContactMethod: z.enum(LEAD_CONTACT_METHODS as [LeadContactMethod, ...LeadContactMethod[]]),
  address: z.string().trim().max(256).optional(),
  city: z.string().trim().max(96).optional(),
  zipCode: z.string().trim().max(16).optional(),
  message: z.string().trim().max(4096).optional(),
  estimatedValue: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) >= 0), {
      message: "Must be a non-negative number.",
    }),
});

type EditFormValues = z.infer<typeof editSchema>;

function EditLeadDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: LeadDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      serviceType: lead.serviceType,
      preferredContactMethod: lead.preferredContactMethod,
      address: lead.address ?? "",
      city: lead.city ?? "",
      zipCode: lead.zipCode ?? "",
      message: lead.message ?? "",
      estimatedValue:
        lead.estimatedValue !== null && lead.estimatedValue !== undefined
          ? String(lead.estimatedValue)
          : "",
    },
  });

  const mutation = useMutation({
    mutationFn: (input: UpdateLeadInput) => updateLead(lead.id, input),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
    },
    onError: (err) => toast.error("Update failed", { description: describe(err) }),
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      serviceType: values.serviceType,
      preferredContactMethod: values.preferredContactMethod,
      address: values.address || null,
      city: values.city || null,
      zipCode: values.zipCode || null,
      message: values.message || null,
      estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : null,
    });
  });

  const submitting = isSubmitting || mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>
            Contact and job details. Marketing attribution is capture metadata and can't be
            edited; pipeline status has its own control on the lead panel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="lead-first-name" label="First name" required error={errors.firstName?.message}>
                <Input id="lead-first-name" autoComplete="off" {...register("firstName")} />
              </Field>
              <Field id="lead-last-name" label="Last name" required error={errors.lastName?.message}>
                <Input id="lead-last-name" autoComplete="off" {...register("lastName")} />
              </Field>
              <Field id="lead-email" label="Email" required error={errors.email?.message}>
                <Input id="lead-email" type="email" autoComplete="off" {...register("email")} />
              </Field>
              <Field id="lead-phone" label="Phone" required error={errors.phone?.message}>
                <Input id="lead-phone" type="tel" autoComplete="off" {...register("phone")} />
              </Field>
              <Field id="lead-service-type" label="Service" error={errors.serviceType?.message}>
                <Select
                  id="lead-service-type"
                  value={watch("serviceType")}
                  onValueChange={(v) =>
                    v && setValue("serviceType", v as LeadServiceType, { shouldValidate: true })
                  }
                  options={LEAD_SERVICE_TYPES.map((s) => ({
                    value: s,
                    label: LEAD_SERVICE_TYPE_LABELS[s],
                  }))}
                />
              </Field>
              <Field
                id="lead-contact-method"
                label="Preferred contact"
                error={errors.preferredContactMethod?.message}
              >
                <Select
                  id="lead-contact-method"
                  value={watch("preferredContactMethod")}
                  onValueChange={(v) =>
                    v &&
                    setValue("preferredContactMethod", v as LeadContactMethod, {
                      shouldValidate: true,
                    })
                  }
                  options={LEAD_CONTACT_METHODS.map((m) => ({ value: m, label: m }))}
                />
              </Field>
              <Field id="lead-address" label="Address" error={errors.address?.message} className="sm:col-span-2">
                <Input id="lead-address" autoComplete="off" {...register("address")} />
              </Field>
              <Field id="lead-city" label="City" error={errors.city?.message}>
                <Input id="lead-city" autoComplete="off" {...register("city")} />
              </Field>
              <Field id="lead-zip" label="Zip code" error={errors.zipCode?.message}>
                <Input id="lead-zip" autoComplete="off" {...register("zipCode")} />
              </Field>
              <Field
                id="lead-value"
                label="Estimated value ($)"
                error={errors.estimatedValue?.message}
              >
                <Input
                  id="lead-value"
                  type="number"
                  min={0}
                  step={100}
                  inputMode="decimal"
                  className="font-mono"
                  {...register("estimatedValue")}
                />
              </Field>
            </div>
            <Field id="lead-message" label="Message" error={errors.message?.message}>
              <textarea
                id="lead-message"
                rows={3}
                maxLength={4096}
                className={cn(
                  "w-full resize-y rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm",
                  "transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)]",
                  "hover:border-[var(--color-border-strong)]",
                  "focus-visible:border-[var(--color-ring)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[oklch(from_var(--color-ring)_l_c_h_/_0.5)]",
                  "placeholder:text-[var(--color-muted-foreground)]",
                )}
                {...register("message")}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────

function describe(err: unknown): string {
  if (err instanceof ApiRequestError)
    return err.problem?.detail ?? err.problem?.title ?? err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}
