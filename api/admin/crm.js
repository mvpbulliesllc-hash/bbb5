/**
 * Back-office CRUD — one endpoint, one JSONB table, session-cookie gated.
 *   POST { op: 'list',   kind }             → { items: [{ id, createdAt, ...data }] }
 *   POST { op: 'save',   kind, id?, data }  → { ok, id }   (replace-on-update)
 *   POST { op: 'remove', id }               → { ok }
 */

const { sql, ensureSchema } = require('../_lib/db.js');
const { verify } = require('../_lib/auth.js');

const KINDS = ['lead', 'contractor', 'dumpster', 'supplier', 'expense', 'expense_category', 'contact', 'listjob'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!verify(req)) return res.status(401).json({ error: 'not signed in' });

  const { op, kind, id, data } = req.body || {};
  try {
    await ensureSchema();

    if (op === 'list') {
      if (!KINDS.includes(kind)) return res.status(400).json({ error: 'bad kind' });
      const out = await sql(
        `SELECT id, data, created_at FROM backoffice_records WHERE kind = $1 ORDER BY id DESC LIMIT 2000`,
        [kind],
      );
      return res.status(200).json({
        items: out.rows.map((r) => ({ id: Number(r.id), createdAt: r.created_at, ...r.data })),
      });
    }

    if (op === 'save') {
      if (!KINDS.includes(kind)) return res.status(400).json({ error: 'bad kind' });
      const json = JSON.stringify(data && typeof data === 'object' ? data : {});
      if (id) {
        await sql(`UPDATE backoffice_records SET data = $1::jsonb WHERE id = $2 AND kind = $3`, [json, id, kind]);
        return res.status(200).json({ ok: true, id });
      }
      const out = await sql(
        `INSERT INTO backoffice_records (kind, data) VALUES ($1, $2::jsonb) RETURNING id`,
        [kind, json],
      );
      return res.status(200).json({ ok: true, id: Number(out.rows[0].id) });
    }

    if (op === 'remove') {
      if (!id) return res.status(400).json({ error: 'id required' });
      await sql(`DELETE FROM backoffice_records WHERE id = $1`, [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'bad op' });
  } catch (err) {
    console.error('crm error', err);
    return res.status(500).json({ error: 'db error' });
  }
};
