// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.paragonexteriorsnj.com',
  trailingSlash: 'always',
  // Old Wix URLs → new equivalents (also mirrored as 301s in vercel.json).
  // NOTE: do NOT add '/services' here — with trailingSlash:'always' the source
  // normalizes to '/services/' and clobbers the real Services page with a
  // redirect-to-itself (infinite loop). Trailing-slash handling already sends
  // the old Wix '/services' → '/services/' automatically.
  redirects: {
    '/projects-7': '/projects/',
  },
  integrations: [
    sitemap({
      // Exclude /thank-you/ and any index-gated service (see indexGatedServices in
      // src/config/business.ts — HVAC is gated noindex pending HVACR-license confirmation).
      filter: (page) => !page.includes('/thank-you/') && !page.includes('/hvac/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
