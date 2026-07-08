/**
 * Review data — single source of truth for testimonial cards, the trust bar,
 * and the aggregateRating / Review JSON-LD nodes on the organization entity.
 *
 * IMPORTANT: only publish reviews and counts that exist on a public platform
 * (Google Business Profile / Facebook). Inflated or fabricated review markup
 * risks a manual action. When the Google review count grows, update
 * `aggregateRating` here and everything (schema + trust bar) follows.
 */

export interface SiteReview {
  /** Reviewer display name as it appears on the source platform. */
  author: string;
  /** Star rating given (1–5). */
  rating: number;
  /** The review text (verbatim, or a faithful excerpt). */
  quote: string;
  /** Service performed — shown on the card and used as the Review "about". */
  service: string;
  /** Town, when known — hyperlocal proof ("Toms River" beats anonymous). */
  town?: string;
  /** ISO date the review was published on the source platform, if known. */
  datePublished?: string;
}

export const aggregateRating = {
  ratingValue: 5,
  reviewCount: 3,
} as const;

export const reviews: readonly SiteReview[] = [
  {
    author: 'Rob & Linda',
    rating: 5,
    quote:
      'From the initial meeting with Joe and Frank, all the way through the completion of our new roof and chimney cap, the process was seamless. Their team is professional, showed up when they said, delivered on all deadlines and the clean up was impeccable. The workmanship and warranty far exceeded anything we were offered by the other roofing companies.',
    service: 'Roof replacement',
  },
  {
    author: 'Dan Marone',
    rating: 5,
    quote:
      'We are extremely satisfied with the work done by Paragon Exteriors. Their team was professional, efficient, and the results exceeded our expectations.',
    service: 'Exterior renovation',
  },
  {
    author: "Lisa O'Neill",
    rating: 5,
    quote:
      'Professionalism, reliability, and excellence define the people at Paragon Exteriors. They transformed our roof with skill and precision.',
    service: 'Roof replacement',
  },
];
