import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'ar' | 'en';

const messages = {
  ar: {
    home: 'الرئيسية',
    courses: 'الدورات',
    workshops: 'الورش',
    instructors: 'المدربون',
    gallery: 'المعرض',
    about: 'عن الأكاديمية',
    contact: 'تواصل',
    book: 'احجز دورة',
    quickLinks: 'روابط سريعة',
    graduates: 'الخريجون',
    faq: 'الأسئلة الشائعة',
    contactUs: 'تواصل معنا',
    rights: 'جميع الحقوق محفوظة.',
    themeLight: 'الوضع الفاتح',
    themeDark: 'الوضع الداكن',
  },
  en: {
    home: 'Home',
    courses: 'Courses',
    workshops: 'Workshops',
    instructors: 'Instructors',
    gallery: 'Gallery',
    about: 'About',
    contact: 'Contact',
    book: 'Book a Course',
    quickLinks: 'Quick Links',
    graduates: 'Graduates',
    faq: 'FAQ',
    contactUs: 'Contact Us',
    rights: 'All rights reserved.',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
  },
} as const;

type MessageKey = keyof typeof messages.ar;
type LocaleContextValue = {
  locale: Locale;
  direction: 'rtl' | 'ltr';
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('dentacollab-locale');
    return saved === 'en' ? 'en' : 'ar';
  });

  useEffect(() => {
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    localStorage.setItem('dentacollab-locale', locale);
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    localStorage.setItem('dentacollab-locale', nextLocale);
    setLocaleState(nextLocale);
    window.setTimeout(() => window.location.reload(), 0);
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      direction: locale === 'ar' ? 'rtl' : 'ltr',
      setLocale,
      t: (key) => messages[locale][key],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}
