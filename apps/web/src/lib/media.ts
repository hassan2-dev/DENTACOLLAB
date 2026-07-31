/** Local brand assets until content is uploaded via Media → R2. */
export const MEDIA = {
  logo: '/logo.png',
  hero: '/dentacollab-hero.png',
  instructor: '/dr-ammar.png',
  bot: '/denta-bot.png',
} as const;

export function courseCover(url?: string | null) {
  return url?.trim() || MEDIA.hero;
}

export function personPhoto(url?: string | null) {
  return url?.trim() || MEDIA.instructor;
}
