import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

/**
 * Website lead ingest — called by the marketing site's /api/eli/lead
 * function (server-to-server, INGEST_SECRET header) so every Eli-chat and
 * quote-calculator lead lands in the pipeline.
 */
http.route({
  path: '/ingest/lead',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.INGEST_SECRET;
    if (secret && req.headers.get('x-ingest-secret') !== secret) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'bad json' }), { status: 400 });
    }
    const s = (k: string) => (typeof body[k] === 'string' && (body[k] as string).trim() ? (body[k] as string).trim().slice(0, 500) : undefined);
    const name = s('name') ?? [s('firstName'), s('lastName')].filter(Boolean).join(' ');
    if (!name && !s('phone') && !s('email')) {
      return new Response(JSON.stringify({ error: 'empty lead' }), { status: 400 });
    }
    const utmEntries = Object.entries(body)
      .filter(([k, val]) => k.startsWith('utm') && typeof val === 'string' && val)
      .map(([k, val]) => [k, (val as string).slice(0, 200)] as const);
    await ctx.runMutation(internal.leads.ingest, {
      name: name || 'Unknown',
      phone: s('phone'),
      email: s('email'),
      address: s('address'),
      town: s('town'),
      zip: s('zip'),
      service: s('service') ?? s('serviceType'),
      message: s('message'),
      source: s('source') ?? 'website',
      utm: utmEntries.length ? Object.fromEntries(utmEntries) : undefined,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }),
});

export default http;
