import { useEffect, useRef, useState } from 'react';
import { LiquidMetalButton } from '../components/LiquidMetalButton';
import { listBuilderOp, useKind } from '../lib/store';
import type { Contact, Lead, ListJob, Rec } from '../lib/store';
import { btnMini, btnPrimary, inp, inpMini } from '../lib/ui';

/** Parse a pasted CSV with a header row into contact rows. */
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], error: 'Need a header row plus at least one data row.' };
  const split = (l: string) =>
    (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? [])
      .map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim())
      .filter((_, i, a) => i < a.length - 1 || a[a.length - 1] !== '');
  const header = split(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    address: col(['address', 'street', 'streetaddress', 'propertyaddress']),
    ownerName: col(['owner', 'ownername', 'name', 'homeowner']),
    phone: col(['phone', 'phonenumber', 'mobile', 'cell']),
    email: col(['email', 'emailaddress']),
    town: col(['town', 'city', 'municipality']),
    zip: col(['zip', 'zipcode', 'postalcode']),
  };
  if (idx.address < 0) return { rows: [], error: 'No address column found (looked for: address, street, property address).' };
  const rows = lines
    .slice(1)
    .map((l) => {
      const c = split(l);
      const g = (i: number) => (i >= 0 && c[i] ? c[i].slice(0, 300) : undefined);
      return {
        address: g(idx.address) ?? '',
        ownerName: g(idx.ownerName),
        phone: g(idx.phone),
        email: g(idx.email),
        town: g(idx.town),
        zip: g(idx.zip),
      };
    })
    .filter((r) => r.address);
  return { rows, error: rows.length ? null : 'No usable rows found.' };
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const cols = ['address', 'ownerName', 'phone', 'email', 'town', 'zip', 'list'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

const JOB_TINT: Record<string, string> = {
  running: 'bg-matrix-400/15 text-matrix-200 ring-1 ring-matrix-300/25 animate-pulse',
  done: 'bg-green-400/20 text-green-200 ring-1 ring-green-300/30',
  error: 'bg-red-400/15 text-red-200 ring-1 ring-red-300/25',
};

export default function ListBuilder() {
  const { items: contacts, save: saveContact, remove: removeContact, refresh: refreshContacts } = useKind<Contact>('contact');
  const { save: saveLead } = useKind<Lead>('lead');
  const [jobs, setJobs] = useState<Array<Rec<ListJob> | ListJob & { id: number }>>([]);
  const [zip, setZip] = useState('');
  const [town, setTown] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [importing, setImporting] = useState(false);
  const [csv, setCsv] = useState('');
  const [pushed, setPushed] = useState<Set<number>>(new Set());
  const checking = useRef(false);

  async function check() {
    if (checking.current) return;
    checking.current = true;
    try {
      const d = await listBuilderOp({ op: 'check' });
      setJobs(d.jobs ?? []);
      if ((d.jobs ?? []).some((j: ListJob) => j.status === 'done')) await refreshContacts();
    } catch {
      /* transient — next tick retries */
    } finally {
      checking.current = false;
    }
  }

  useEffect(() => {
    check();
    const t = setInterval(() => {
      // poll faster while something is running, slower otherwise
      check();
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const all = contacts ?? [];
  const shown = all.filter((c) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return [c.address, c.ownerName, c.phone, c.email, c.town, c.zip, c.list].filter(Boolean).some((x) => String(x).toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">List Builder</h1>
          <p className="mt-1 text-sm text-white/60">Scrape a zip into a homeowner list (Parallel web research), or import a CSV from Clay / Apollo / Bright Data.</p>
        </div>
      </div>

      {/* Build from the web */}
      <form
        className="mt-5 flex flex-wrap items-center gap-2 liquid-glass rounded-2xl p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          if (!/^\d{5}$/.test(zip.trim())) { setErr('Enter a 5-digit zip'); return; }
          try {
            await listBuilderOp({ op: 'start', zip: zip.trim(), town: town.trim() || undefined });
            setZip(''); setTown('');
            await check();
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : String(ex));
          }
        }}
      >
        <p className="font-display text-sm font-bold text-matrix-300">Build a list from the web</p>
        <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Zip (e.g. 08753)" className={`w-36 ${inp}`} inputMode="numeric" />
        <input value={town} onChange={(e) => setTown(e.target.value)} placeholder="Town (optional)" className={`w-44 ${inp}`} />
        <LiquidMetalButton type="submit" width={190} label="Start research" />
        {err && <p className="w-full text-xs text-red-300">{err}</p>}
        <p className="w-full text-xs text-white/45">Runs take a few minutes — results land in the contacts table below automatically.</p>
      </form>

      {/* Jobs */}
      {jobs.length > 0 && (
        <div className="mt-4 liquid-glass rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Research runs</p>
          <div className="mt-2 space-y-1.5">
            {jobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-bold ${JOB_TINT[j.status] ?? 'bg-white/10 text-white/70'}`}>{j.status}</span>
                <span className="font-semibold text-white">{j.zip}{j.town ? ` · ${j.town}` : ''}</span>
                {j.count != null && <span className="text-matrix-200">{j.count} contacts</span>}
                {j.note && <span className="truncate text-white/50">{j.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      <div className="mt-5 liquid-glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Contacts <span className="text-white/35">· {shown.length}{filter ? ` of ${all.length}` : ''}</span></p>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter contacts" className={`ml-auto w-44 ${inpMini}`} />
          <button
            onClick={() => {
              const blob = new Blob([toCsv(shown as Array<Record<string, unknown>>)], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'paragon-contacts.csv';
              a.click();
            }}
            className={btnMini}
          >
            Export CSV
          </button>
          <button onClick={() => setImporting(!importing)} className={btnMini}>{importing ? 'Close import' : 'Import CSV'}</button>
        </div>

        {importing && (
          <form
            className="mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const { rows, error } = parseCsv(csv);
              if (error) { setErr(error); return; }
              setErr(null);
              await listBuilderOp({ op: 'import', list: `csv-${new Date().toISOString().slice(0, 10)}`, rows });
              setCsv(''); setImporting(false);
              await refreshContacts();
            }}
          >
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={'Paste CSV with a header row, e.g.\naddress,owner,phone,email,town,zip\n12 Ocean Ave,"Jones, Mary",732-555-0101,mj@x.com,Toms River,08753'}
              rows={5}
              className={`w-full ${inp} font-mono text-xs`}
            />
            <div className="mt-2 flex items-center gap-2">
              <LiquidMetalButton type="submit" width={170} label="Import rows" />
              {err && <p className="text-xs text-red-300">{err}</p>}
            </div>
          </form>
        )}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-white/50">
                <th className="px-3 py-2 font-semibold">Address</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Town</th>
                <th className="px-3 py-2 font-semibold">Zip</th>
                <th className="px-3 py-2 font-semibold">List</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 500).map((c) => (
                <tr key={c.id} className="border-b border-white/10 last:border-0">
                  <td className="max-w-[16rem] truncate px-3 py-2 text-white">
                    <a
                      className="hover:text-matrix-200"
                      href={`https://maps.google.com/?q=${encodeURIComponent([c.address, c.town, c.zip].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {c.address}
                    </a>
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2 text-white/80">{c.ownerName ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-white/80">{c.phone ? <a className="hover:text-matrix-200" href={`tel:${c.phone}`}>{c.phone}</a> : '—'}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2 text-white/80">{c.email ?? '—'}</td>
                  <td className="px-3 py-2 text-white/70">{c.town ?? '—'}</td>
                  <td className="px-3 py-2 text-white/70">{c.zip ?? '—'}</td>
                  <td className="max-w-[8rem] truncate px-3 py-2 text-white/50">{c.list ?? '—'}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    <button
                      onClick={async () => {
                        await saveLead({
                          name: c.ownerName || `Homeowner @ ${c.address}`,
                          phone: c.phone,
                          email: c.email,
                          address: c.address,
                          town: c.town,
                          zip: c.zip,
                          source: 'list-builder',
                          referredFrom: c.list,
                          enteredBy: 'list-builder',
                          stage: 'new',
                          notes: [],
                        });
                        setPushed(new Set(pushed).add(c.id));
                      }}
                      className={`${btnMini} mr-1`}
                      disabled={pushed.has(c.id)}
                    >
                      {pushed.has(c.id) ? 'In pipeline ✓' : '→ Lead'}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete contact "${c.address}"?`)) removeContact(c.id); }}
                      className="rounded-md px-1.5 py-1 text-xs text-red-300/80 hover:bg-red-400/10"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-white/40">No contacts yet — run a zip above or import a CSV.</td></tr>
              )}
            </tbody>
          </table>
          {shown.length > 500 && <p className="mt-2 text-xs text-white/40">Showing first 500 — use the filter or export the full CSV.</p>}
        </div>
      </div>
    </div>
  );
}
