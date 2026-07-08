const INTEGRATIONS: Array<{ name: string; status: 'live' | 'ready' | 'waiting'; detail: string }> = [
  { name: 'Admin login', status: 'live', detail: 'Password gate (BACKOFFICE_ADMIN_PASSWORD in Vercel) — no third-party login required.' },
  { name: 'Database (Neon Postgres)', status: 'live', detail: 'All CRM records — leads, contractors, dumpsters, suppliers, expenses — in the site’s own Postgres.' },
  { name: 'Website lead ingest', status: 'live', detail: 'Ellianna chat + quote calculator leads flow into the Pipeline automatically (and still email via AgentMail).' },
  { name: 'AgentMail (lead emails)', status: 'live', detail: 'Leads email from eli-paragon@agentmail.to.' },
  { name: 'Hume (Ellianna voice)', status: 'live', detail: 'Expressive TTS on the marketing site, Ava Song voice.' },
  { name: 'Mux (hero video)', status: 'live', detail: 'Homepage hook video streams via Mux.' },
  { name: 'Expenses ledger', status: 'live', detail: 'Replaces QuickBooks day-to-day: categories, totals, ad-channel breakout, add-your-own categories.' },
  { name: 'List Builder (Parallel web research)', status: 'live', detail: 'Zip → homeowner list, CSV import/export, one-tap push to Pipeline.' },
  { name: 'Clay / Apollo / Nimble / Bright Data / Firecrawl / Browserbase enrichment', status: 'ready', detail: 'Keys on file — next step is enriching contacts (phones, emails, socials) through these providers.' },
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
