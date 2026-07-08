'use node';

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

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
} as const;

/** Run a Parallel web-research task: residential properties + owners in a zip. */
export const run = internalAction({
  args: { jobId: v.id('jobs'), zip: v.string(), town: v.optional(v.string()) },
  handler: async (ctx, { jobId, zip, town }) => {
    const apiKey = process.env.PARALLEL_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.listbuilder.finishJob, { jobId, status: 'error', note: 'PARALLEL_API_KEY not set on Convex' });
      return;
    }
    const where = town ? `${town}, NJ ${zip}` : `ZIP code ${zip} in New Jersey`;
    const input =
      `Extract residential property records for ${where} from public NJ property-record sources ` +
      `(county tax assessment listings, njpropertyrecords, taxrecords-nj, recent sale listings). ` +
      `For each property return the street address and the owner name as recorded, plus phone/email only if ` +
      `publicly listed. Return at least 15 distinct real properties actually in zip ${zip} — more is better.`;

    try {
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
        await ctx.runMutation(internal.listbuilder.finishJob, { jobId, status: 'error', note: `Parallel create failed: ${createRes.status} ${detail}` });
        return;
      }
      const { run_id } = (await createRes.json()) as { run_id: string };
      await ctx.runMutation(internal.listbuilder.finishJob, { jobId, status: 'running', runId: run_id });

      // Long-poll the result for up to ~8.5 minutes.
      const deadline = Date.now() + 8.5 * 60 * 1000;
      while (Date.now() < deadline) {
        const res = await fetch(`https://api.parallel.ai/v1/tasks/runs/${run_id}/result?timeout=60`, {
          headers: { 'x-api-key': apiKey },
        });
        if (res.ok) {
          const data = (await res.json()) as { output?: { content?: { properties?: Array<Record<string, string>> } } };
          const props = data.output?.content?.properties ?? [];
          const rows = props
            .filter((p) => p.address)
            .map((p) => ({
              address: String(p.address).slice(0, 300),
              ownerName: p.owner_name ? String(p.owner_name).slice(0, 200) : undefined,
              phone: p.phone ? String(p.phone).slice(0, 50) : undefined,
              email: p.email ? String(p.email).slice(0, 200) : undefined,
              town: p.town ? String(p.town).slice(0, 100) : town,
              zip: p.zip ? String(p.zip).slice(0, 10) : zip,
            }));
          const list = `zip-${zip}-web`;
          const { inserted } = await ctx.runMutation(internal.listbuilder.importRows, { list, rows });
          await ctx.runMutation(internal.listbuilder.finishJob, {
            jobId, status: 'done', count: inserted,
            note: inserted ? `Imported into list "${list}"` : 'Research finished but found no usable rows',
          });
          return;
        }
        if (res.status !== 202 && res.status !== 408) {
          const detail = (await res.text()).slice(0, 200);
          await ctx.runMutation(internal.listbuilder.finishJob, { jobId, status: 'error', note: `Parallel result failed: ${res.status} ${detail}` });
          return;
        }
        // 202/408 → still running, poll again
      }
      await ctx.runMutation(internal.listbuilder.finishJob, {
        jobId, status: 'error',
        note: `Timed out waiting for Parallel run ${run_id} — it may still finish; re-run later or check Parallel dashboard.`,
      });
    } catch (err) {
      await ctx.runMutation(internal.listbuilder.finishJob, { jobId, status: 'error', note: String(err).slice(0, 200) });
    }
  },
});
