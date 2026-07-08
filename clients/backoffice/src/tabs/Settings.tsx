const INTEGRATIONS: Array<{ name: string; status: 'live' | 'ready' | 'waiting'; detail: string }> = [
  { name: 'Admin login', status: 'live', detail: 'Password gate (BACKOFFICE_ADMIN_PASSWORD in Vercel) — no third-party login required.' },
  { name: 'Database (Neon Postgres)', status: 'live', detail: 'All CRM records — leads, contractors, dumpsters, suppliers, expenses — in the site’s own Postgres.' },
  { name: 'Website lead ingest', status: 'live', detail: 'Ellianna chat + quote calculator leads flow into the Pipeline automatically (and still email via AgentMail).' },
  { name: 'AgentMail (lead emails)', status: 'live', detail: 'Leads email from eli-paragon@agentmail.to.' },
  { name: 'Hume (Ellianna voice)', status: 'live', detail: 'Expressive TTS on the marketing site, Ava Song voice.' },
  { name: 'Mux (hero video)', status: 'live', detail: 'Homepage hook video streams via Mux.' },
  { name: 'Expenses ledger', status: 'live', detail: 'Replaces QuickBooks day-to-day: categories, totals, ad-channel breakout, add-your-own categories.' },
  { name: 'Estimates + roofing squares calculator', status: 'live', detail: 'Build a quote (sqft → squares → material/labor), then one-tap convert to an invoice.' },
  { name: 'Invoices + AR aging', status: 'live', detail: 'Deposits & progress payments, balance owed, 0–30/31–60/61–90/90+ aging. Stripe card+ACH is the next wire-up.' },
  { name: 'Unified activity timeline', status: 'live', detail: 'The spine: every lead, stage move, note, estimate, invoice and payment on one feed — ready for call/SMS/email/signature webhooks.' },
  { name: 'List Builder (Parallel web research)', status: 'live', detail: 'Zip → homeowner list, CSV import/export, one-tap push to Pipeline.' },
  { name: 'Clay / Apollo / Nimble / Bright Data / Firecrawl / Browserbase enrichment', status: 'ready', detail: 'Keys on file — next step is enriching contacts (phones, emails, socials) through these providers.' },
  // OpsCenter brief roadmap — integrations that each need vendor keys/DevOps
  { name: 'Stripe (cards + ACH)', status: 'waiting', detail: 'OpsCenter Phase 1: pay invoices online; route large invoices to ACH (0.8% capped at $5). Needs Stripe keys.' },
  { name: 'Docuseal e-signature', status: 'waiting', detail: 'OpsCenter Phase 1: send any contract/quote for signature from the deal; self-hosted (Docker). Needs a Docuseal instance.' },
  { name: 'Telnyx voice + SMS softphone', status: 'waiting', detail: 'OpsCenter Phase 1: click-to-call & text from the lead, logged to the timeline. Needs Telnyx account + number.' },
  { name: 'ElevenLabs AI phone agent (via Telnyx SIP)', status: 'waiting', detail: 'OpsCenter Phase 2: AI answers inbound, books inspections, writes the lead + activity. Reuses client-owned ElevenLabs.' },
  { name: 'EagleView + ABC Supply', status: 'waiting', detail: 'OpsCenter Phase 2: aerial roof measurements into the estimate; material ordering + live pricing (ABC public API).' },
  { name: 'Plaid bank feeds · Check payroll · LiveKit video', status: 'waiting', detail: 'OpsCenter Phase 2–3: reconciliation, payroll, embedded meetings (recordings to Mux). Each needs a vendor contract.' },
];

const BADGE: Record<string, string> = {
  live: 'bg-green-400/20 text-green-200 ring-1 ring-green-300/30',
  ready: 'bg-matrix-400/15 text-matrix-200 ring-1 ring-matrix-300/25',
  waiting: 'bg-white/10 text-white/60 ring-1 ring-white/15',
};

export default function Settings() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-white">Settings</h1>
      <p className="mt-1 text-sm text-white/60">Integration status across the stack.</p>
      <div className="mt-6 space-y-2.5">
        {INTEGRATIONS.map((i) => (
          <div key={i.name} className="flex items-start justify-between gap-4 liquid-glass rounded-2xl p-4">
            <div>
              <p className="font-display text-sm font-bold text-white">{i.name}</p>
              <p className="mt-0.5 text-xs text-white/60">{i.detail}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${BADGE[i.status]}`}>
              {i.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
