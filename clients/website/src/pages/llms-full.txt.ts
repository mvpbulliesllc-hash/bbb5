import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { business } from '@/config/business';

/**
 * llms-full.txt — full text of every service, town, and guide page in one
 * plain-text document so LLM crawlers can ingest the site in a single fetch.
 */
export const GET: APIRoute = async () => {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const towns = (await getCollection('towns')).sort((a, b) => a.data.town.localeCompare(b.data.town));
  const combos = await getCollection('combos');
  const posts = (await getCollection('posts')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const faqText = (faqs: ReadonlyArray<{ q: string; a: string }>) =>
    faqs.length ? `\nFAQs:\n${faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n')}` : '';

  const sections = [
    `# ${business.name} — full site content\n\n${business.tagline}\nLicense: ${business.license} · Phone: ${business.phone} · ${business.url}\nService area: ${business.areaServed}`,
    ...services.map(
      (s) => `## Service: ${s.data.title}\nURL: ${business.url}/${s.id}/\n${s.data.metaDescription}\n\n${s.body ?? ''}${faqText(s.data.faqs)}`
    ),
    ...towns.map(
      (t) =>
        `## Service Area: ${t.data.town}, NJ (${t.data.county} County)\nURL: ${business.url}/service-areas/${t.id}/\n${t.data.metaDescription}\n\n${t.body ?? ''}${faqText(t.data.faqs)}`
    ),
    ...combos.map(
      (c) => `## ${c.data.h1}\nURL: ${business.url}/${c.data.service}/${c.data.town}/\n${c.data.metaDescription}\n\n${c.body ?? ''}${faqText(c.data.faqs)}`
    ),
    ...posts.map(
      (p) => `## Guide: ${p.data.title}\nURL: ${business.url}/blog/${p.id}/\n${p.data.description}\n\n${p.body ?? ''}${faqText(p.data.faqs)}`
    ),
  ];

  return new Response(sections.join('\n\n---\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
