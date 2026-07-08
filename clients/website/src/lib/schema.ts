import { business } from '@/config/business';
import { aggregateRating, reviews } from '@/config/reviews';

/**
 * JSON-LD builders. Every page emits ONE `@graph` (assembled in Base.astro)
 * with linked `@id`s: Organization ← WebSite ← WebPage, plus page-type nodes
 * (Service / FAQPage / Article / BreadcrumbList) layered on top. Connected
 * entities — not parallel scripts — are what Google and AI answer engines
 * use to disambiguate the business. Rich, valid structured data is the
 * backbone of both the local pack and AI-search (GEO) visibility.
 */

export const ORG_ID = `${business.url}/#organization`;
export const WEBSITE_ID = `${business.url}/#website`;
export const LOGO_ID = `${business.url}/#logo`;

/** The RoofingContractor organization node — the entity everything links to. */
export function orgNode(services: ReadonlyArray<{ name: string; url: string }> = []) {
  const sameAs = [
    business.social.instagram,
    business.social.facebook,
    business.social.googleBusinessProfile,
    business.licenseRegistryUrl,
  ].filter(Boolean);

  return {
    '@type': 'RoofingContractor',
    '@id': ORG_ID,
    name: business.name,
    legalName: business.legalName,
    slogan: business.tagline,
    url: business.url,
    telephone: business.phone,
    email: business.email,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: `${business.url}/media/logo.png`,
      contentUrl: `${business.url}/media/logo.png`,
      caption: business.name,
      width: 400,
      height: 400,
    },
    image: `${business.url}/media/og-default.jpg`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressRegion: business.address.region,
      addressCountry: business.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: business.geo.latitude, longitude: business.geo.longitude },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Ocean County, NJ' },
      { '@type': 'AdministrativeArea', name: 'Monmouth County, NJ' },
    ],
    founder: business.founders.map((f) => ({ '@type': 'Person', name: f.name, jobTitle: f.role })),
    sameAs,
    openingHoursSpecification: business.openingHoursSpec.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: business.license,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.quote,
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
      itemReviewed: { '@id': ORG_ID },
    })),
    ...(services.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Roofing & exterior services',
            itemListElement: services.map((s) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: s.name, url: s.url, provider: { '@id': ORG_ID } },
            })),
          },
        }
      : {}),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: business.name,
    url: business.url,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

export function webPageNode(opts: { url: string; title: string; description: string; image: string }) {
  return {
    '@type': 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.title,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: opts.image },
    inLanguage: 'en-US',
  };
}

/**
 * Assemble the page's single JSON-LD payload. Accepts the page-specific
 * nodes (which may still carry a legacy '@context' — stripped here) and
 * returns one `{'@context', '@graph'}` object.
 */
export function buildGraph(nodes: ReadonlyArray<Record<string, unknown> | null>) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes
      .filter((n): n is Record<string, unknown> => n !== null && n !== undefined)
      .map(({ '@context': _ctx, ...node }) => node),
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  areaName?: string;
  /** Human price range, e.g. "$8,000 – $18,000" — emitted as an Offer. */
  priceRange?: string;
}) {
  const prices = opts.priceRange?.match(/[\d,]+/g)?.map((p) => Number(p.replace(/,/g, '')));
  return {
    '@type': 'Service',
    serviceType: opts.name,
    description: opts.description,
    url: opts.url,
    provider: { '@id': ORG_ID },
    areaServed: opts.areaName
      ? { '@type': 'City', name: opts.areaName }
      : { '@type': 'AdministrativeArea', name: business.areaServed },
    ...(prices && prices.length >= 2
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'PriceSpecification',
              minPrice: prices[0],
              maxPrice: prices[1],
              priceCurrency: 'USD',
            },
          },
        }
      : {}),
  };
}

export function faqSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  if (faqs.length === 0) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  pubDate: Date;
  updatedDate?: Date;
}) {
  return {
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    image: opts.image.startsWith('http') ? opts.image : `${business.url}${opts.image}`,
    datePublished: opts.pubDate.toISOString(),
    dateModified: (opts.updatedDate ?? opts.pubDate).toISOString(),
    author: { '@type': 'Organization', name: business.name, url: business.url },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function breadcrumbSchema(items: ReadonlyArray<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${business.url}${item.url}`,
    })),
  };
}
