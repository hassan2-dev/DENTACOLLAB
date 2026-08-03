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

function IconFacebook({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 8.2h2.2V5H14c-2.3 0-3.9 1.5-3.9 4v1.6H8.2V13H10v6.2h2.9V13h2.1l.4-2.4h-2.5V9.3c0-.7.3-1.1 1.1-1.1Z" />
    </svg>
  );
}

function IconInstagram({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
    </svg>
  );
}

function IconWhatsApp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 3.2c-4.8 0-8.7 3.85-8.7 8.6 0 1.52.4 2.98 1.16 4.27L3.2 20.8l4.9-1.27a8.7 8.7 0 0 0 3.94.94c4.8 0 8.7-3.85 8.7-8.6s-3.9-8.67-8.7-8.67Zm0 15.84c-1.28 0-2.53-.34-3.62-.98l-.26-.15-2.9.76.77-2.82-.17-.29a7.05 7.05 0 0 1-1.1-3.76c0-3.9 3.22-7.07 7.28-7.07 3.9 0 7.28 3.17 7.28 7.07 0 3.9-3.38 7.24-7.28 7.24Zm4-5.28c-.22-.11-1.3-.64-1.5-.71-.2-.08-.35-.11-.5.11-.14.22-.57.71-.7.86-.13.14-.26.16-.48.05-.22-.11-.93-.34-1.77-1.08-.65-.57-1.1-1.28-1.22-1.5-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.14-.22.22-.37.07-.14.04-.27-.02-.38-.05-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38h-.42c-.14 0-.38.05-.58.27-.2.22-.76.74-.76 1.8s.78 2.09.89 2.24c.11.14 1.53 2.33 3.7 3.27 2.17.94 2.17.63 2.56.59.39-.04 1.3-.53 1.48-1.04.18-.51.18-.95.13-1.04-.05-.1-.2-.16-.42-.27Z" />
    </svg>
  );
}

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

            {(() => {
              const waHref = `https://wa.me/${(general.whatsapp || '+9647817828545').replace(/[^\d]/g, '')}`;
              const socialLinks = [
                {
                  key: 'instagram',
                  href: social.instagram || 'https://www.instagram.com/dentacollab',
                  label: 'Instagram',
                  icon: <IconInstagram className="h-5 w-5" />,
                },
                {
                  key: 'facebook',
                  href: social.facebook || 'https://www.facebook.com/Digitaldentistrytrainingcourses',
                  label: 'Facebook',
                  icon: <IconFacebook className="h-5 w-5" />,
                },
                {
                  key: 'whatsapp',
                  href: waHref,
                  label: 'WhatsApp',
                  icon: <IconWhatsApp className="h-5 w-5" />,
                },
              ];
              return (
                <div className="mt-7 flex flex-wrap gap-2.5">
                  {socialLinks.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition hover:border-[#1fb6d1] hover:bg-[#1fb6d1] hover:text-[#04101c]"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              );
            })()}
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
