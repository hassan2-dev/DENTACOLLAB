import { Locale } from '@prisma/client';

type TranslationRow = { locale: Locale } & Record<string, unknown>;

export function resolveLocale(raw?: string): Locale {
  return raw === Locale.en ? Locale.en : Locale.ar;
}

export function pickTranslation<T extends TranslationRow>(
  translations: T[] | undefined,
  locale: Locale,
): T | undefined {
  return (
    translations?.find((item) => item.locale === locale) ??
    translations?.find((item) => item.locale === Locale.ar)
  );
}

export function localizeRecord<T extends { translations?: TranslationRow[] }>(
  row: T,
  locale: Locale,
  fields: string[],
) {
  const translation = pickTranslation(row.translations, locale);
  const next: Record<string, unknown> = { ...row, translations: undefined };
  if (translation) {
    for (const field of fields) {
      if (translation[field] !== undefined) next[field] = translation[field];
    }
  }
  return next as Omit<T, 'translations'> & Record<string, unknown>;
}
