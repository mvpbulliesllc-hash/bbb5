import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content model:
 *  - services  → pillar pages at /{service}/
 *  - towns     → local hubs at /service-areas/{town}/
 *  - combos    → service × town money pages at /{service}/{town}/
 *  - posts     → guides at /blog/{slug}/
 * FAQ entries ride along in frontmatter and are emitted as FAQPage JSON-LD.
 */

const faq = z.object({ q: z.string(), a: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string().max(175),
    heroTagline: z.string(),
    serviceName: z.string(), // schema.org Service name, e.g. "Roof Replacement"
    image: z.string().default('/media/placeholder.jpg'),
    order: z.number().default(50),
    priceRange: z.string().optional(), // e.g. "$7,500 – $18,000"
    faqs: z.array(faq).default([]),
    comboEligible: z.boolean().default(false), // generate town combo pages
  }),
});

const towns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/towns' }),
  schema: z.object({
    town: z.string(), // "Toms River"
    county: z.enum(['Ocean', 'Monmouth', 'Middlesex']),
    metaTitle: z.string(),
    metaDescription: z.string().max(175),
    zipCodes: z.array(z.string()).default([]),
    neighborhoods: z.array(z.string()).default([]),
    landmarks: z.array(z.string()).default([]),
    housingNotes: z.string(), // roofing-relevant housing stock notes
    coastal: z.boolean().default(false),
    image: z.string().default('/media/area-suburban.jpg'),
    lat: z.number().optional(),
    lng: z.number().optional(),
    faqs: z.array(faq).default([]),
  }),
});

const combos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/combos' }),
  schema: z.object({
    service: z.string(), // services collection id, e.g. "roof-replacement"
    town: z.string(), // towns collection id, e.g. "toms-river"
    metaTitle: z.string(),
    metaDescription: z.string().max(175),
    h1: z.string(),
    faqs: z.array(faq).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string().max(175),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().default('/media/placeholder.jpg'),
    category: z.enum(['Roofing', 'Siding', 'Windows & Doors', 'Decks', 'Gutters', 'Storm Damage', 'Financing', 'Local']),
    faqs: z.array(faq).default([]),
  }),
});

export const collections = { services, towns, combos, posts };
