import { business } from '@/config/business';

/**
 * JSON-LD builders. Every page emits RoofingContractor org data; specific
 * page types layer Service / FAQPage / Article / BreadcrumbList on top.
 * Rich, valid structured data is the backbone of both the local pack and
 * AI-search (GEO) visibility.
 */

export function orgSchema() {
  return {
    '@context': 'https://schema.org',
    // Broadened beyond RoofingContractor so the non-roofing Service nodes (kitchen, bath, flooring,
    // painting, renovation) sit under a correct provider type, without regressing roofing rich results.
    '@type': ['HomeAndConstructionBusiness', 'GeneralContractor', 'RoofingContractor'],
    '@id': `${business.url}/#organization`,
    name: business.name,
    legalName: business.legalName,
    slogan: business.tagline,
    url: business.url,
    telephone: business.phoneE164,
    email: business.email,
    logo: `${business.url}/media/logo.png`,
    image: `${business.url}/media/og-default.jpg`,
    priceRange: '$$',
    paymentAccepted: [...business.paymentAccepted],
    knowsAbout: [...business.knowsAbout],
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
    sameAs: [business.social.instagram, business.social.facebook],
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
    makesOffer: business.offers.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name, provider: { '@id': `${business.url}/#organization` } },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Ocean County, NJ' },
        { '@type': 'AdministrativeArea', name: 'Monmouth County, NJ' },
      ],
    })),
  };
}

export function serviceSchema(opts: { name: string; description: string; url: string; areaName?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: opts.name,
    description: opts.description,
    url: opts.url,
    provider: { '@id': `${business.url}/#organization` },
    areaServed: opts.areaName
      ? { '@type': 'City', name: opts.areaName }
      : { '@type': 'AdministrativeArea', name: business.areaServed },
  };
}

export function faqSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
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
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    image: opts.image.startsWith('http') ? opts.image : `${business.url}${opts.image}`,
    datePublished: opts.pubDate.toISOString(),
    dateModified: (opts.updatedDate ?? opts.pubDate).toISOString(),
    author: { '@type': 'Organization', name: business.name, url: business.url },
    publisher: { '@id': `${business.url}/#organization` },
  };
}

export function breadcrumbSchema(items: ReadonlyArray<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${business.url}${item.url}`,
    })),
  };
}
