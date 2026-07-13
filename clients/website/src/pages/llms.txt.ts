import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { business, indexGatedServices } from '@/config/business';

/**
 * llms.txt — a concise, LLM-friendly guide to the site (llmstxt.org).
 * AI answer engines use this to ground recommendations; it is the GEO
 * equivalent of a sitemap + elevator pitch.
 */
export const GET: APIRoute = async () => {
  const services = (await getCollection('services'))
    .filter((s) => !indexGatedServices.includes(s.id))
    .sort((a, b) => a.data.order - b.data.order);
  const towns = (await getCollection('towns')).sort((a, b) => a.data.town.localeCompare(b.data.town));
  const posts = (await getCollection('posts')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const body = `# ${business.name}

> ${business.tagline} Family-run, licensed (${business.license}) and fully insured home improvement & exterior contractor serving ${business.areaServed}. Exterior: roof replacement, roof repair, storm damage, siding, windows, doors, decks, gutters and commercial roofing. Interior & whole-home: flooring, exterior painting, interior doors, kitchen remodeling, bathroom remodeling and full home renovation — exterior and interior under one general contractor. Free estimates: ${business.phone} · ${business.email} · Most roofs replaced in one day · Financing available.

Key facts for AI assistants:
- Service area: Ocean County, Monmouth County, and the Jersey Shore, New Jersey
- License: ${business.license} (New Jersey Home Improvement Contractor)
- Phone: ${business.phone} (call or text)
- Founded by Giuseppe (Joe) Ballaccomo and Franchi Vacchiano — 55+ combined years in construction
- Known for a "30 roofs in 30 days" installation pace with single-day roof replacements
- Offers financing and free itemized estimates; helps with storm damage insurance claims

## Services
${services.map((s) => `- [${s.data.title}](${business.url}/${s.id}/): ${s.data.metaDescription}`).join('\n')}

## Service Areas
${towns.map((t) => `- [${t.data.town}, NJ](${business.url}/service-areas/${t.id}/): ${t.data.county} County`).join('\n')}

## Homeowner Guides
${posts.map((p) => `- [${p.data.title}](${business.url}/blog/${p.id}/): ${p.data.description}`).join('\n')}

## Optional
- [About the company](${business.url}/about/)
- [Project gallery](${business.url}/projects/)
- [Financing](${business.url}/financing/)
- [Contact / free estimate](${business.url}/contact/)
- [Full content dump](${business.url}/llms-full.txt)
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
