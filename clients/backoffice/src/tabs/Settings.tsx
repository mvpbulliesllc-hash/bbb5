const INTEGRATIONS: Array<{ name: string; status: 'live' | 'ready' | 'waiting'; detail: string }> = [
  { name: 'Admin login', status: 'live', detail: 'Password gate (BACKOFFICE_ADMIN_PASSWORD in Vercel) — no third-party login required.' },
  { name: 'Database (Neon Postgres)', status: 'live', detail: 'All CRM records — leads, contractors, dumpsters, suppliers, expenses — in the site’s own Postgres.' },
  { name: 'Website lead ingest', status: 'live', detail: 'Ellianna chat + quote calculator leads flow into the Pipeline automatically (and still email via AgentMail).' },
  { name: 'AgentMail (lead emails)', status: 'live', detail: 'Leads email from eli-paragon@agentmail.to.' },
  { name: 'Hume (Ellianna voice)', status: 'live', detail: 'Expressive TTS on the marketing site, Ava Song voice.' },
  { name: 'Mux (hero video)', status: 'live', detail: 'Homepage hook video streams via Mux.' },
  { name: 'QuickBooks sync', status: 'waiting', detail: 'Expense categories mirror the QuickBooks chart — direct sync available when you want it.' },
  { name: 'List builder (zip research)', status: 'waiting', detail: 'Parked during the Auth0 → password migration; say the word to bring it into /admin.' },
];

const BADGE: Record<string, string> = {
  live: 'bg-green-400/20 text-green-200 ring-1 ring-green-300/30',
  ready: 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25',
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
