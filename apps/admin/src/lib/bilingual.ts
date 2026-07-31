/** Shared bilingual helpers — AR + EN are always required for public content. */

export type BilingualCheck = {
  key: string;
  ar: string;
  en: string;
  labelAr: string;
  labelEn: string;
};

const LATIN = /[A-Za-z\u00C0-\u024F]/g;
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

/** Keep Arabic script (+ digits/punctuation/spaces). Strip Latin letters. */
export function filterArabicOnly(value: string) {
  return value.replace(LATIN, '');
}

/** Keep Latin script (+ digits/punctuation/spaces). Strip Arabic letters. */
export function filterEnglishOnly(value: string) {
  return value.replace(ARABIC, '');
}

export function hasLatinLetters(value: string) {
  return /[A-Za-z\u00C0-\u024F]/.test(value);
}

export function hasArabicLetters(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

export function missingBilingualFields(fields: BilingualCheck[], uiLang: 'ar' | 'en' = 'ar') {
  return fields
    .filter((field) => !String(field.ar || '').trim() || !String(field.en || '').trim())
    .map((field) => (uiLang === 'ar' ? field.labelAr : field.labelEn));
}

export function bilingualErrorMessage(missing: string[], uiLang: 'ar' | 'en' = 'ar') {
  if (!missing.length) return null;
  if (uiLang === 'ar') {
    return `يجب تعبئة العربية والإنجليزية معاً. الحقول الناقصة: ${missing.join(' · ')}`;
  }
  return `Arabic and English are both required. Missing: ${missing.join(' · ')}`;
}

export function scriptMismatchMessage(uiLang: 'ar' | 'en' = 'ar') {
  return uiLang === 'ar'
    ? 'حقول العربية تقبل عربي فقط، وحقول الإنجليزية تقبل إنجليزي فقط.'
    : 'Arabic fields accept Arabic only; English fields accept English only.';
}

export function hasCompleteTranslation(row: {
  translations?: Array<{ locale?: string }>;
}) {
  return Boolean(row.translations?.some((item) => item.locale === 'en'));
}
