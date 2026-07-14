const INTEGRATIONS: Array<{ name: string; status: 'live' | 'ready' | 'waiting'; detail: string }> = [
  { name: 'Convex (database)', status: 'live', detail: 'Production deployment sincere-curlew-165 — leads and contact lists.' },
  { name: 'Auth0 (login)', status: 'live', detail: 'This dashboard is gated by Auth0; Convex functions require a signed-in user.' },
  { name: 'Website lead ingest', status: 'live', detail: 'Ellianna chat + quote calculator leads flow into the Pipeline automatically (and still email via AgentMail).' },
  { name: 'AgentMail (lead emails)', status: 'live', detail: 'Leads email from eli-paragon@agentmail.to.' },
  { name: 'Hume (Ellianna voice)', status: 'live', detail: 'Expressive TTS on the marketing site — "Cool Journalist", the same voice as her EVI phone config.' },
  { name: 'Mux (hero video)', status: 'live', detail: 'Homepage hook video streams via Mux.' },
  { name: 'Meilisearch (search engine)', status: 'waiting', detail: 'Keys received — needs the server/host URL of your Meilisearch instance to connect.' },
  { name: 'Knock (notifications)', status: 'ready', detail: 'Keys received — say the word to add push/SMS lead alerts.' },
  { name: 'Firecrawl (scraping)', status: 'ready', detail: 'Key received — available for list building / site imports.' },
  { name: 'Bright Data / Nimble / Clay / Apollo', status: 'waiting', detail: 'Zip-to-homeowner data providers — waiting on keys to auto-fill lists.' },
];

const BADGE: Record<string, string> = {
  live: 'bg-green-100 text-green-800',
  ready: 'bg-gold-100 text-gold-600',
  waiting: 'bg-sand-100 text-navy-900/60',
};

export default function Settings() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-navy-950">Settings</h1>
      <p className="mt-1 text-sm text-navy-900/60">Integration status across the demo stack.</p>
      <div className="mt-6 space-y-2.5">
        {INTEGRATIONS.map((i) => (
          <div key={i.name} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200">
            <div>
              <p className="font-display text-sm font-bold text-navy-950">{i.name}</p>
              <p className="mt-0.5 text-xs text-navy-900/60">{i.detail}</p>
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
