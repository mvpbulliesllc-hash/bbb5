import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

/** Parse a pasted/uploaded CSV with a header row into contact rows. */
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], error: 'Need a header row plus at least one data row.' };
  const split = (l: string) =>
    (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()).filter((_, i, a) => i < a.length - 1 || a[a.length - 1] !== '');
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
  const rows = lines.slice(1).map((l) => {
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
  }).filter((r) => r.address);
  return { rows, error: rows.length ? null : 'No usable rows found.' };
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const cols = ['address', 'ownerName', 'phone', 'email', 'town', 'zip', 'list'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export default function Search() {
  const [zip, setZip] = useState('');
  const [text, setText] = useState('');
  const [list, setList] = useState('');
  const results = useQuery(api.contacts.search, { zip: zip || undefined, text: text || undefined, list: list || undefined });
  const lists = useQuery(api.contacts.lists);
  const importBatch = useMutation(api.contacts.importBatch);
  const removeContact = useMutation(api.contacts.remove);
  const [importing, setImporting] = useState(false);
  const [importName, setImportName] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runImport(csvText: string) {
    const name = importName.trim() || `import-${new Date().toISOString().slice(0, 10)}`;
    const { rows, error } = parseCsv(csvText);
    if (error) { setImportMsg(error); return; }
    const chunks = [];
    for (let i = 0; i < rows.length; i += 500) chunks.push(rows.slice(i, i + 500));
    let total = 0;
    for (const chunk of chunks) total += (await importBatch({ list: name, rows: chunk })).inserted;
    setImportMsg(`Imported ${total} contacts into "${name}".`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">List search</h1>
          <p className="mt-1 text-sm text-navy-900/60">
            Search your owned lists — pick a zip, get every address, owner and contact on file.
          </p>
        </div>
        <button
          onClick={() => setImporting(!importing)}
          className="rounded-lg bg-navy-950 px-4 py-2 font-display text-sm font-bold text-white hover:bg-navy-900"
        >
          {importing ? 'Close import' : 'Import CSV'}
        </button>
      </div>

      {importing && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              placeholder="List name (e.g. toms-river-08753)"
              className="rounded-lg border border-sand-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await runImport(await f.text());
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
          </div>
          <p className="mt-2 text-xs text-navy-900/55">
            CSV with a header row. Recognized columns: address (required), owner, phone, email, town, zip. Provider
            pulls (Bright Data, Nimble, Clay, Apollo) will import through this same pipeline once their keys land.
          </p>
          {importMsg && <p className="mt-2 rounded-lg bg-gold-50 px-3 py-2 text-xs font-semibold text-navy-900">{importMsg}</p>}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Zip code (e.g. 08753)"
          className="w-40 rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search addresses"
          className="w-64 rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
        />
        <select
          value={list}
          onChange={(e) => setList(e.target.value)}
          className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-navy-900"
        >
          <option value="">All lists</option>
          {Object.entries(lists?.byList ?? {}).map(([name, count]) => (
            <option key={name} value={name}>{name} ({count})</option>
          ))}
        </select>
        {results && results.length > 0 && (
          <button
            onClick={() => {
              const blob = new Blob([toCsv(results as never)], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `paragon-contacts-${zip || text || 'all'}.csv`;
              a.click();
            }}
            className="ml-auto rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-sand-50"
          >
            Export {results.length} rows
          </button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-sand-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-xs uppercase tracking-wider text-navy-900/50">
              {['Address', 'Owner', 'Phone', 'Email', 'Town', 'Zip', 'List', ''].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(results ?? []).map((c) => (
              <tr key={c._id} className="border-b border-sand-100 last:border-0 hover:bg-sand-50">
                <td className="px-4 py-2.5 font-medium text-navy-950">{c.address}</td>
                <td className="px-4 py-2.5">{c.ownerName ?? '—'}</td>
                <td className="px-4 py-2.5">{c.phone ? <a className="hover:text-gold-600" href={`tel:${c.phone}`}>{c.phone}</a> : '—'}</td>
                <td className="px-4 py-2.5">{c.email ? <a className="hover:text-gold-600" href={`mailto:${c.email}`}>{c.email}</a> : '—'}</td>
                <td className="px-4 py-2.5">{c.town ?? '—'}</td>
                <td className="px-4 py-2.5">{c.zip ?? '—'}</td>
                <td className="px-4 py-2.5 text-navy-900/60">{c.list ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => removeContact({ id: c._id })} className="text-xs text-red-600/60 hover:text-red-600">Remove</button>
                </td>
              </tr>
            ))}
            {results && !results.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-navy-900/50">
                No contacts yet — import a CSV above, or wire a data provider (Bright Data, Nimble, Clay, Apollo) to fill lists by zip.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
