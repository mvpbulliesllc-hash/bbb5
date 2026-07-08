/**
 * List Builder — zip → homeowner list via Parallel's web-research task API
 * (ported from the old Convex listbuilderAction). Serverless-shaped: `start`
 * creates the Parallel run and a job record; the tab calls `check` on an
 * interval, which polls Parallel and ingests finished results into contacts.
 *
 *   POST { op:'start', zip, town? }        → { job }
 *   POST { op:'check' }                    → { jobs }   (also ingests results)
 *   POST { op:'import', list, rows: [...] }→ { inserted }  (CSV import)
 *
 * Uses PARALLEL_API_KEY from the project env.
 */

const { sql, ensureSchema } = require('../_lib/db.js');
const { verify } = require('../_lib/auth.js');

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    properties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Full street address of the residential property' },
          owner_name: { type: 'string', description: 'Property owner name from public records' },
          phone: { type: 'string', description: 'Publicly listed phone number, if any' },
          email: { type: 'string', description: 'Publicly listed email, if any' },
          town: { type: 'string' },
          zip: { type: 'string' },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
  },
  required: ['properties'],
  additionalProperties: false,
};

// Parallel marks unfound fields with NOT_FOUND placeholders — drop them.
function clean(val, max) {
  const s = typeof val === 'string' ? val.trim() : '';
  return s && !/^not[_ ]?found/i.test(s) && !/^unknown$/i.test(s) ? s.slice(0, max) : undefined;
}

function sanitizeRow(p, fallbackTown, fallbackZip) {
  return {
    address: clean(p.address, 300) ?? '',
    ownerName: clean(p.ownerName ?? p.owner_name, 200),
    phone: clean(p.phone, 50),
    email: clean(p.email, 200),
    town: clean(p.town, 100) ?? fallbackTown,
    zip: clean(p.zip, 10) ?? fallbackZip,
  };
}

async function insertContacts(list, rows) {
  const vals = rows
    .filter((r) => r.address)
    .slice(0, 1000)
    .map((r) => JSON.stringify({ ...r, list, tags: ['web-research'] }));
  if (!vals.length) return 0;
  const placeholders = vals.map((_, i) => `('contact', $${i + 1}::jsonb)`).join(', ');
  await sql(`INSERT INTO backoffice_records (kind, data) VALUES ${placeholders}`, vals);
  return vals.length;
}

async function patchJob(id, patch) {
  await sql(`UPDATE backoffice_records SET data = data || $1::jsonb WHERE id = $2 AND kind = 'listjob'`, [
    JSON.stringify(patch),
    id,
  ]);
}

async function listJobs() {
  const out = await sql(
    `SELECT id, data, created_at FROM backoffice_records WHERE kind = 'listjob' ORDER BY id DESC LIMIT 25`,
  );
  return out.rows.map((r) => ({ id: Number(r.id), createdAt: r.created_at, ...r.data }));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!verify(req)) return res.status(401).json({ error: 'not signed in' });

  const apiKey = process.env.PARALLEL_API_KEY;
  const { op, zip, town, list, rows } = req.body || {};

  try {
    await ensureSchema();

    if (op === 'start') {
      if (!apiKey) return res.status(503).json({ error: 'PARALLEL_API_KEY not configured' });
      const cleanZip = String(zip || '').trim();
      if (!/^\d{5}$/.test(cleanZip)) return res.status(400).json({ error: 'Enter a 5-digit zip' });
      const cleanTown = String(town || '').trim() || undefined;

      const where = cleanTown ? `${cleanTown}, NJ ${cleanZip}` : `ZIP code ${cleanZip} in New Jersey`;
      const input =
        `Extract residential property records for ${where} from public NJ property-record sources ` +
        `(county tax assessment listings, njpropertyrecords, taxrecords-nj, recent sale listings). ` +
        `For each property return the street address and the owner name as recorded, plus phone/email only if ` +
        `publicly listed. Return at least 15 distinct real properties actually in zip ${cleanZip} — more is better.`;

      const createRes = await fetch('https://api.parallel.ai/v1/tasks/runs', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          processor: 'core',
          task_spec: { output_schema: { type: 'json', json_schema: OUTPUT_SCHEMA } },
        }),
      });
      if (!createRes.ok) {
        const detail = (await createRes.text()).slice(0, 200);
        return res.status(502).json({ error: `Parallel create failed: ${createRes.status} ${detail}` });
      }
      const { run_id } = await createRes.json();
      const job = { zip: cleanZip, town: cleanTown, status: 'running', runId: run_id };
      const out = await sql(`INSERT INTO backoffice_records (kind, data) VALUES ('listjob', $1::jsonb) RETURNING id`, [
        JSON.stringify(job),
      ]);
      return res.status(200).json({ job: { id: Number(out.rows[0].id), ...job } });
    }

    if (op === 'check') {
      if (apiKey) {
        const jobs = await listJobs();
        for (const j of jobs) {
          if (j.status !== 'running' || !j.runId) continue;
          const r = await fetch(`https://api.parallel.ai/v1/tasks/runs/${j.runId}/result?timeout=5`, {
            headers: { 'x-api-key': apiKey },
          });
          if (r.ok) {
            const data = await r.json();
            const props = (data.output && data.output.content && data.output.content.properties) || [];
            const cleanRows = props.map((p) => sanitizeRow(p, j.town, j.zip));
            const listName = `zip-${j.zip}-web`;
            const inserted = await insertContacts(listName, cleanRows);
            await patchJob(j.id, {
              status: 'done',
              count: inserted,
              note: inserted ? `Imported into list "${listName}"` : 'Research finished but found no usable rows',
            });
          } else if (r.status !== 202 && r.status !== 408) {
            const detail = (await r.text()).slice(0, 200);
            await patchJob(j.id, { status: 'error', note: `Parallel result failed: ${r.status} ${detail}` });
          }
          // 202/408 → still running; the tab checks again shortly
        }
      }
      return res.status(200).json({ jobs: await listJobs() });
    }

    if (op === 'import') {
      const listName = String(list || '').trim() || 'csv-import';
      const cleanRows = (Array.isArray(rows) ? rows : []).map((p) => sanitizeRow(p, undefined, undefined));
      const inserted = await insertContacts(listName, cleanRows);
      return res.status(200).json({ inserted });
    }

    return res.status(400).json({ error: 'bad op' });
  } catch (err) {
    console.error('listbuilder error', err);
    return res.status(500).json({ error: 'listbuilder error' });
  }
};
