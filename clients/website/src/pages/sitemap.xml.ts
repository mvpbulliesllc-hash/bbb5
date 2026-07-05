import type { APIRoute } from 'astro';

/**
 * @astrojs/sitemap emits `sitemap-index.xml` + `sitemap-0.xml`, but many tools
 * and AI crawlers guess the conventional `/sitemap.xml`. This endpoint answers
 * it with a valid sitemap index (HTTP 200) pointing at the real urlset, so the
 * guessed path resolves instead of 404-ing.
 */
export const GET: APIRoute = ({ site }) => {
  const base = (site?.href ?? 'https://www.paragonexteriorsnj.com/').replace(/\/$/, '');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${base}/sitemap-0.xml</loc></sitemap>
</sitemapindex>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
