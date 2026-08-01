import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { FloatingChat } from './FloatingChat';
import { PageTransition } from './PageTransition';
import { ScrollToTop } from './ScrollToTop';

const links = [
  { to: '/', key: 'home' },
  { to: '/courses', key: 'courses' },
  { to: '/graduates', key: 'graduates' },
  { to: '/instructors', key: 'instructors' },
  { to: '/gallery', key: 'gallery' },
  { to: '/about', key: 'about' },
  { to: '/contact', key: 'contact' },
] as const;

export function SiteLayout() {
  const { locale, setLocale, t } = useLocale();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('dentacollab-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Record<string, Record<string, string>>>('/settings'),
  });
  const general = settings.data?.general ?? {};
  const social = settings.data?.social ?? {};

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('dentacollab-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const key = 'dentacollab-visit-session';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(key, sessionId);
    }
    api('/analytics/visit', {
      method: 'POST',
      body: JSON.stringify({ sessionId, path: location.pathname || '/' }),
    }).catch(() => undefined);
  }, [location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev || '';
      };
    }
    document.body.style.overflow = '';
    return undefined;
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7fafc] transition-colors duration-300 dark:bg-[#040b18]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#050d1d]/90">
        <div className="dc-container flex h-[70px] items-center justify-between gap-2 sm:h-[78px] sm:gap-5">
          <Link to="/" className="dc-brand-lockup min-w-0 shrink" aria-label={general.siteName || 'DentaCollab'}>
            <span className="dc-logo-mark shrink-0"><img src="/logo.png" alt="" /></span>
            <span className="dc-wordmark max-[380px]:hidden"><span><strong>DENTA</strong>COLLAB</span><small>Digital Dentistry Academy</small></span>
          </Link>
          <nav className="hidden items-center gap-7 text-[14px] font-medium lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `relative py-7 transition-colors ${isActive ? 'text-[#1fb6d1]' : 'text-[#5b6b86] hover:text-[#101c38] dark:text-slate-300 dark:hover:text-[#42d7ff]'}`
                }
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label={isDark ? t('themeLight') : t('themeDark')}
              title={isDark ? t('themeLight') : t('themeDark')}
              onClick={() => setIsDark((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-base text-slate-700 transition hover:border-[#1fb6d1] hover:text-[#1fb6d1] dark:border-white/15 dark:text-slate-200 dark:hover:border-[#42d7ff] dark:hover:text-[#42d7ff] sm:h-10 sm:w-10"
            >
              {isDark ? '☀' : '☾'}
            </button>
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="h-9 rounded-full border border-slate-200 px-2 text-[11px] font-bold text-slate-700 transition hover:border-[#1fb6d1] hover:text-[#1fb6d1] dark:border-white/15 dark:text-slate-200 dark:hover:border-[#42d7ff] dark:hover:text-[#42d7ff] sm:h-10 sm:px-3 sm:text-xs"
              aria-label="Switch language"
            >
              {locale === 'ar' ? 'EN' : 'عربي'}
            </button>
            <Link to="/courses" className="dc-primary-link hidden rounded-full bg-[#101c38] px-5 py-2.5 text-sm font-bold shadow-sm transition hover:bg-[#1fb6d1] sm:inline-flex">
              {t('book')}
            </Link>
            <button
              type="button"
              aria-label="فتح القائمة"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-xl dark:border-white/15 dark:text-white sm:h-10 sm:w-10 lg:hidden"
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-100 bg-white py-3 dark:border-white/10 dark:bg-[#071123] lg:hidden">
            <nav className="dc-container grid gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-[#eaf8f5] dark:text-slate-200 dark:hover:bg-white/5"
              >
                {t(l.key)}
              </NavLink>
            ))}
            <Link
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className="dc-primary-link mt-2 rounded-xl bg-[#101c38] px-4 py-3 text-center text-sm font-bold transition hover:bg-[#1fb6d1] sm:hidden"
            >
              {t('book')}
            </Link>
            </nav>
          </div>
        ) : null}
      </header>
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <footer className="relative z-10 mt-auto overflow-hidden bg-[#0b152b] text-white">
        <div className="pointer-events-none absolute -start-24 top-0 h-56 w-56 rounded-full bg-[#1fb6d1]/10 blur-3xl sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute -end-16 bottom-0 h-48 w-48 rounded-full bg-[#1fb6d1]/[.07] blur-3xl sm:h-64 sm:w-64" />

        <div className="dc-container relative grid gap-8 py-10 sm:gap-12 sm:py-16 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label="DentaCollab">
              <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white p-1.5 shadow-sm">
                <img src="/logo.png" alt="" className="h-full w-full object-contain" />
              </span>
              <span>
                <span className="block text-xl font-black tracking-wide">
                  DENTA<span className="text-[#1fb6d1]">COLLAB</span>
                  <sup className="ms-1 text-[10px] font-semibold text-slate-400">®</sup>
                </span>
                <span className="mt-0.5 block text-xs font-medium text-slate-400">
                  {locale === 'ar' ? 'Denta Collab | دنتا كولاب' : 'Denta Collab | دنتا كولاب'}
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-8 text-slate-300">
              {locale === 'ar'
                ? 'منصّة تهدف لتطوير وبناء مسار ومهارات أطباء الأسنان.'
                : 'A platform dedicated to developing and building the skills pathway of dental professionals.'}
            </p>
            <p className="mt-3 max-w-md text-sm font-semibold leading-7 text-[#7be7ff]">
              {locale === 'ar'
                ? 'استثمر معنا وانقل نفسك إلى مستوى آخر.'
                : 'Invest with us and take yourself to the next level.'}
            </p>

            <Link
              to="/courses"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1fb6d1] px-5 py-2.5 text-sm font-bold !text-[#04101c] transition hover:bg-white hover:!text-[#04101c]"
            >
              {locale === 'ar' ? 'ابدأ رحلتك الآن' : 'Start your journey'}
              <span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
            </Link>

            {Object.keys(social).length ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {Object.entries(social).map(([key, value]) => (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-10 min-w-10 place-items-center rounded-full border border-white/12 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-300 transition hover:border-[#1fb6d1] hover:text-white"
                  >
                    {key === 'instagram' ? (locale === 'ar' ? 'انستا' : 'IG') : key === 'facebook' ? (locale === 'ar' ? 'فيس' : 'FB') : key}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[.18em] text-[#1fb6d1]">{t('quickLinks')}</h3>
            <div className="grid gap-3 text-sm text-slate-300">
              {[
                { to: '/courses', label: t('courses') },
                { to: '/graduates', label: t('graduates') },
                { to: '/instructors', label: t('instructors') },
                { to: '/gallery', label: t('gallery') },
                { to: '/about', label: t('about') },
                { to: '/faq', label: t('faq') },
                { to: '/chat', label: locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant' },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[.18em] text-[#1fb6d1]">{t('contactUs')}</h3>
            <div className="grid gap-4 text-sm leading-7 text-slate-300">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {locale === 'ar' ? 'واتساب' : 'WhatsApp'}
                </p>
                <a
                  href={`https://wa.me/${(general.whatsapp || '+9647817828545').replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                  dir="ltr"
                >
                  {general.whatsapp || '+964 781 782 8545'}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {locale === 'ar' ? 'انستغرام' : 'Instagram'}
                </p>
                <a
                  href={social.instagram || 'https://www.instagram.com/dentacollab'}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  @dentacollab
                </a>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {locale === 'ar' ? 'فيسبوك' : 'Facebook'}
                </p>
                <a
                  href={social.facebook || 'https://www.facebook.com/Digitaldentistrytrainingcourses'}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Digital dentistry training courses
                </a>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {locale === 'ar' ? 'موقع الأكاديمية' : 'Academy location'}
                </p>
                <a
                  href={general.mapsUrl || 'https://maps.app.goo.gl/qJ7KMyB6dQEuxGQE7?g_st=ic'}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  {general.location || (locale === 'ar' ? 'موقع الأكاديمية' : 'Academy location')}
                </a>
                <p className="mt-1 text-xs text-slate-500" dir="ltr">
                  {general.coordinates || "33°17'16.0\"N 44°20'52.4\"E"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="dc-container py-5 text-center text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} Denta Collab® — {locale === 'ar' ? 'دنتا كولاب' : 'DentaCollab'}. {t('rights')}
            </p>
          </div>
        </div>
      </footer>
      <FloatingChat />
      <ScrollToTop />
    </div>
  );
}
