/**
 * Minimal Neon Postgres client over HTTP (the serverless driver's wire
 * protocol) — no npm dependency, since /api has no package.json of its own.
 * Uses the DATABASE_URL the Neon integration already set on this project.
 */

const CONN = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

async function sql(query, params = []) {
  if (!CONN) throw new Error('DATABASE_URL not configured');
  const host = new URL(CONN).hostname;
  const r = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': CONN,
      'Neon-Raw-Text-Output': 'false',
      'Neon-Array-Mode': 'false',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, params }),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) {
    throw new Error(`sql failed ${r.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body; // { rows, rowCount, fields, ... }
}

/** All back-office records live in one JSONB table — new fields need no migration. */
let ready;
function ensureSchema() {
  ready ??= sql(
    `CREATE TABLE IF NOT EXISTS backoffice_records (
       id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       kind TEXT NOT NULL,
       data JSONB NOT NULL DEFAULT '{}'::jsonb,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  ).then(() => sql(`CREATE INDEX IF NOT EXISTS backoffice_records_kind_idx ON backoffice_records(kind)`));
  return ready;
}

module.exports = { sql, ensureSchema };
