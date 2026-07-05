import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/**
 * Bridges the content model (which stores images as `/media/...` string paths)
 * to Astro's build-time image pipeline (astro:assets), which needs real imports.
 *
 * All optimizable content imagery lives in `src/assets/media/**`. We eagerly
 * import it once and key it by the public-style `/media/...` path so call sites
 * (and content-collection `image` fields) can keep using plain strings while
 * still getting AVIF/WebP, responsive `srcset`, and intrinsic width/height.
 *
 * Static assets that must stay at a stable, absolute URL — the logo, the OG
 * fallback, the hero video + its poster — remain in `public/media/` and are
 * referenced by their `/media/...` URL directly.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/media/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true },
);

const byPath: Record<string, ImageMetadata> = {};
for (const [key, mod] of Object.entries(files)) {
  byPath[key.replace('/src/assets/media/', '/media/')] = mod.default;
}

/** Resolve a `/media/...` path to its optimizable ImageMetadata, if managed. */
export function resolveMedia(src: string | undefined): ImageMetadata | undefined {
  return src ? byPath[src] : undefined;
}

/**
 * Absolute, social-ready OG image URL (cropped 1200×630 JPEG) for a `/media/...`
 * path. Managed assets are optimized through astro:assets; anything else (or a
 * missing asset) falls back to the original path, absolute-ized against `site`.
 */
export async function ogImageUrl(src: string | undefined, site: URL | undefined): Promise<string> {
  const base = site ?? new URL('https://www.paragonexteriorsnj.com');
  const abs = (p: string) => (p.startsWith('http') ? p : new URL(p, base).href);
  const img = resolveMedia(src);
  if (!img) return abs(src ?? '/media/og-default.jpg');
  const out = await getImage({ src: img, format: 'jpeg', width: 1200, height: 630, fit: 'cover' });
  return abs(out.src);
}
