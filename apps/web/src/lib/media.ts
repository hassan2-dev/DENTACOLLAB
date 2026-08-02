/** Local brand assets until content is uploaded via Media → R2. */
export const MEDIA = {
  logo: '/logo.png',
  /** Keep only for the homepage hero header. */
  hero: '/dentacollab-hero.png',
  instructor: '/dr-ammar.png',
  bot: '/denta-bot.png',
} as const;

/** Site stock photos in /public (1.jpg … 19.jpg). */
export const STOCK_PHOTOS = Array.from({ length: 19 }, (_, i) => `/${i + 1}.jpg`) as string[];

/** Pick a stock photo by index (cycles 1–19). */
export function stockPhoto(seed = 0) {
  const i = ((seed % STOCK_PHOTOS.length) + STOCK_PHOTOS.length) % STOCK_PHOTOS.length;
  return STOCK_PHOTOS[i];
}

export function courseCover(url?: string | null, seed = 0) {
  return url?.trim() || stockPhoto(seed);
}

export function personPhoto(url?: string | null) {
  return url?.trim() || MEDIA.instructor;
}
