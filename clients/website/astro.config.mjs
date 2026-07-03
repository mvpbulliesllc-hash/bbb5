// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.paragonexteriorsnj.com',
  trailingSlash: 'always',
  // Old Wix URLs → new equivalents (also mirrored as 301s in vercel.json).
  redirects: {
    '/projects-7': '/projects/',
    '/services': '/services/',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thank-you/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
