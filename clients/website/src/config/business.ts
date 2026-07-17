/**
 * Single source of truth for business identity, contact info, and
 * third-party integration settings. Everything user-visible on the site
 * pulls from here — never hard-code NAP (name/address/phone) elsewhere,
 * consistency of NAP citations is a local-SEO ranking factor.
 *
 * Integration IDs come from PUBLIC_* env vars so the same build works in
 * dev, preview, and production without code changes.
 */
export const business = {
  name: 'Paragon Exteriors LLC',
  legalName: 'Paragon Exteriors LLC',
  tagline: 'Protecting homes. Perfecting exteriors.',
  phone: '848-633-6440',
  /** E.164 / +1 format for schema.org telephone — the format the Knowledge Graph and AI engines expect. */
  phoneE164: '+1-848-633-6440',
  phoneHref: 'tel:+18486336440',
  email: 'Paragonexteriors.co@gmail.com',
  emailHref: 'mailto:Paragonexteriors.co@gmail.com',
  license: 'NJ HIC #13VH13814500',
  url: 'https://www.paragonexteriorsnj.com',
  areaServed: 'Ocean County, Monmouth County & the Jersey Shore, NJ',
  address: {
    region: 'NJ',
    country: 'US',
    // Service-area business: no storefront published. Towns served are
    // modeled through the towns content collection.
  },
  geo: { latitude: 39.9537, longitude: -74.1979 }, // Toms River, service-area anchor
  founders: [
    {
      name: 'Giuseppe (Joe) Ballaccomo',
      role: 'Managing Partner',
      bio: 'Over 15 years of experience in solar, roofing and home improvement across the East Coast — from roofing and siding to windows, decks, and doors.',
    },
    {
      name: 'Franchi Vacchiano',
      role: 'Managing Partner',
      bio: 'Nearly 40 years in construction, leading major builds from Florida high-rises to the Borgata in Atlantic City. A seasoned general contractor who has built everything from bridges to homes.',
    },
  ],
  cto: {
    name: 'Jarad Derochey',
    role: 'Chief Technology Officer',
    bio: 'A builder of AI-native systems with 20+ years scaling revenue operations — from founding and bootstrapping a consumer brand to $6M ARR to closing $500K commercial infrastructure projects end-to-end. At Paragon, Jarad puts that technology to work for homeowners: photorealistic AI visualizations that show you exactly how your new roof, siding, or deck will look on your home before a single shingle goes on — so you can tweak colors, materials, and details up front instead of wishing you had after the job is done.',
  },
  social: {
    instagram: 'https://www.instagram.com/paragonexteriorsnj/',
    facebook: 'https://www.facebook.com/paragonexteriorsnj',
  },
  hours: 'Mon–Sat 7:00 AM – 7:00 PM',
  openingHoursSpec: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '07:00', closes: '19:00' },
  ],
  /** Payment methods — schema.org paymentAccepted; "Financing" is real (see /financing/). */
  paymentAccepted: ['Cash', 'Check', 'Credit Card', 'Financing'],
  /**
   * Entity topics for schema.org knowsAbout — strengthens the Knowledge-Graph entity and topical
   * relevance AI answer engines draw on. List only things Paragon genuinely does.
   */
  knowsAbout: [
    'Roof replacement',
    'Roof repair',
    'Storm damage roofing',
    'Roof insurance claims',
    'Commercial roofing',
    'Siding installation',
    'Window replacement',
    'Door installation',
    'Gutter installation',
    'Deck building',
    'Kitchen remodeling',
    'Bathroom remodeling',
    'Flooring installation',
    'Exterior painting',
    'Full home renovation',
    'Solar-ready roofing',
    'Coastal and shore-home construction',
  ],
  /**
   * Services offered — emitted as schema.org makesOffer so each real service is a node in the org
   * graph. Kept in sync with the services content collection; add only services Paragon performs.
   */
  offers: [
    'Roof Replacement',
    'Roof Repair',
    'Storm Damage Roofing',
    'Commercial Roofing',
    'Siding Installation',
    'Window Replacement',
    'Door Installation',
    'Gutter Installation',
    'Deck Building',
    'Kitchen Remodeling',
    'Bathroom Remodeling',
    'Flooring Installation',
    'Exterior Painting',
    'Full Home Renovation',
  ],
} as const;

/** Runtime integration switches — all optional; features degrade gracefully. */
export const integrations = {
  /** Mux playback ID for the homepage hero video (the "30 roofs in 30 days" reel). */
  muxPlaybackId: import.meta.env.PUBLIC_MUX_PLAYBACK_ID ?? '',
  /** CRM lead-capture endpoint (FSH.Starter Crm module: POST /api/v1/crm/leads). */
  leadsApi: import.meta.env.PUBLIC_LEADS_API ?? '',
  /** GA4 measurement ID, e.g. G-XXXXXXX. */
  ga4Id: import.meta.env.PUBLIC_GA4_ID ?? '',
  /** Plausible domain (optional, cookieless analytics). */
  plausibleDomain: import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN ?? '',
  /** ElevenLabs Conversational AI agent id — enables the web voice widget. */
  elevenLabsAgentId: import.meta.env.PUBLIC_ELEVENLABS_AGENT_ID ?? '',
  /**
   * Eli assistant backend base URL (`/chat`, `/voice`, `/lead`). Defaults to
   * the site's own /api/eli serverless functions (Hume TTS voice); endpoints
   * that are missing or unconfigured degrade gracefully in the widget.
   */
  eliApi: import.meta.env.PUBLIC_ELI_API ?? '/api/eli',
  /** Finbuckle tenant identifier the CRM capture endpoint requires. */
  tenant: import.meta.env.PUBLIC_TENANT ?? 'root',
  /** Calendly scheduling URL (optional "book an estimate" flow). */
  calendlyUrl: import.meta.env.PUBLIC_CALENDLY_URL ?? '',
} as const;

/**
 * Services whose pages are BUILT but kept out of the public index — `noindex,nofollow`, and
 * excluded from the sitemap and llms.txt — until a licensing/authorization detail is confirmed.
 * The work is not deleted; only its indexing is gated.
 *
 * HVAC was gated here pending the HVACR-license question; owner confirmed 2026-07-16 that HVAC
 * work is subcontracted to a licensed HVACR sub, so the gate is lifted. The list stays as the
 * seam for any future trade that needs its own license before being publicly indexed.
 */
export const indexGatedServices: readonly string[] = [];
