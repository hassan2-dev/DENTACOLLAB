import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { AdminToaster } from './AdminToaster';
import { cn } from '@/lib/utils';

type Language = 'ar' | 'en';
type Theme = 'light' | 'dark';

const PreferencesContext = createContext<{ language: Language; theme: Theme }>({
  language: 'ar',
  theme: 'light',
});

export function useAdminPreferences() {
  return useContext(PreferencesContext);
}

type NavLinkItem = { to: string; ar: string; en: string; hintAr: string; hintEn: string; icon: string };

const groups: Array<{
  id: string;
  ar: string;
  en: string;
  links: NavLinkItem[];
}> = [
  {
    id: 'daily',
    ar: 'العمل اليومي',
    en: 'Daily work',
    links: [
      { to: '/', ar: 'لوحة التحكم', en: 'Dashboard', hintAr: 'ملخص سريع', hintEn: 'Quick overview', icon: 'grid' },
      {
        to: '/registrations',
        ar: 'طلبات التسجيل',
        en: 'Registrations',
        hintAr: 'متابعة المتقدمين',
        hintEn: 'Follow applicants',
        icon: 'users',
      },
      {
        to: '/payments',
        ar: 'المدفوعات',
        en: 'Payments',
        hintAr: 'الفواتير والإيرادات',
        hintEn: 'Invoices & revenue',
        icon: 'mail',
      },
      {
        to: '/messages',
        ar: 'رسائل التواصل',
        en: 'Contact messages',
        hintAr: 'رسائل الزوار',
        hintEn: 'Visitor messages',
        icon: 'mail',
      },
      {
        to: '/calendar',
        ar: 'الورش',
        en: 'Workshops',
        hintAr: 'إضافة ونشر الورش',
        hintEn: 'Add & publish workshops',
        icon: 'calendar',
      },
    ],
  },
  {
    id: 'academy',
    ar: 'الأكاديمية',
    en: 'Academy',
    links: [
      {
        to: '/courses',
        ar: 'الدورات',
        en: 'Courses',
        hintAr: 'المناهج والأسعار',
        hintEn: 'Programs & prices',
        icon: 'book',
      },
      {
        to: '/instructors',
        ar: 'المدربون',
        en: 'Instructors',
        hintAr: 'الملفات والصور',
        hintEn: 'Profiles & photos',
        icon: 'badge',
      },
      {
        to: '/graduates',
        ar: 'الخريجون',
        en: 'Graduates',
        hintAr: 'قصص النجاح',
        hintEn: 'Success stories',
        icon: 'cap',
      },
    ],
  },
  {
    id: 'content',
    ar: 'الموقع والمحتوى',
    en: 'Website content',
    links: [
      {
        to: '/gallery',
        ar: 'المعرض والصور',
        en: 'Gallery & media',
        hintAr: 'رفع الصور',
        hintEn: 'Upload images',
        icon: 'image',
      },
      {
        to: '/faq',
        ar: 'الأسئلة الشائعة',
        en: 'FAQ',
        hintAr: 'أسئلة الزوار',
        hintEn: 'Visitor questions',
        icon: 'help',
      },
      {
        to: '/chatbot',
        ar: 'الشات بوت',
        en: 'Chatbot',
        hintAr: 'ردود المساعد',
        hintEn: 'Assistant replies',
        icon: 'spark',
      },
    ],
  },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
        <path d="M8 7h8M8 11h6" />
      </>
    ),
    badge: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" />
      </>
    ),
    cap: (
      <>
        <path d="m2 10 10-5 10 5-10 5L2 10Z" />
        <path d="M6 12.5V17c3 2.5 9 2.5 12 0v-4.5M22 10v6" />
      </>
    ),
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2M12 17h.01" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
      </>
    ),
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function pathMatches(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AdminLayout() {
  const { user, ready, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('dc-admin-sidebar') === 'collapsed');
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem('dc-admin-language') === 'en' ? 'en' : 'ar',
  );
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem('dc-admin-theme') === 'dark' ? 'dark' : 'light',
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('dc-admin-nav-open');
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      /* ignore */
    }
    return { daily: true, academy: true, content: true };
  });

  const activeGroupId = useMemo(() => {
    for (const group of groups) {
      if (group.links.some((link) => pathMatches(location.pathname, link.to))) return group.id;
    }
    return 'daily';
  }, [location.pathname]);

  useEffect(() => {
    setOpenGroups((prev) => {
      if (prev[activeGroupId]) return prev;
      const next = { ...prev, [activeGroupId]: true };
      localStorage.setItem('dc-admin-nav-open', JSON.stringify(next));
      return next;
    });
  }, [activeGroupId]);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    localStorage.setItem('dc-admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('dc-admin-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    localStorage.setItem('dc-admin-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--color-surface)] text-sm text-[var(--color-ink-muted)]">
        {language === 'ar' ? 'جاري التحقق من الجلسة...' : 'Checking session...'}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isAr = language === 'ar';

  return (
    <PreferencesContext.Provider value={{ language, theme }}>
      <div className={cn('admin-shell', collapsed && 'sidebar-collapsed')} dir={isAr ? 'rtl' : 'ltr'}>
        {mobileOpen ? (
          <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
        ) : null}

        <aside className={cn('admin-sidebar', mobileOpen && 'is-open')}>
          <div className="sidebar-brand">
            <span className="admin-logo-mark">
              <img src="/logo.png" alt="" />
            </span>
            <div className="brand-copy">
              <strong>
                <b>DENTA</b>COLLAB
              </strong>
              <span>{isAr ? 'لوحة سهلة للإدارة' : 'Simple admin panel'}</span>
            </div>
            <button
              className="collapse-button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {groups.map((group) => {
              const open = collapsed ? true : Boolean(openGroups[group.id]);
              return (
                <div className={cn('nav-group', open && 'is-open')} key={group.id}>
                  <button
                    type="button"
                    className="nav-group-toggle"
                    onClick={() => {
                      if (collapsed) return;
                      setOpenGroups((prev) => {
                        const next = { ...prev, [group.id]: !prev[group.id] };
                        localStorage.setItem('dc-admin-nav-open', JSON.stringify(next));
                        return next;
                      });
                    }}
                  >
                    <span className="nav-group-label">{group[language]}</span>
                    {!collapsed ? (
                      <span className={cn('nav-group-chevron', open && 'is-open')}>
                        <Icon name="chevron" size={14} />
                      </span>
                    ) : null}
                  </button>
                  {open
                    ? group.links.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          end={link.to === '/'}
                          title={`${link[language]} — ${isAr ? link.hintAr : link.hintEn}`}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            cn('sidebar-link', (isActive || pathMatches(location.pathname, link.to)) && 'is-active')
                          }
                        >
                          <Icon name={link.icon} />
                          <span className="sidebar-link-copy">
                            <strong>{link[language]}</strong>
                            <small>{isAr ? link.hintAr : link.hintEn}</small>
                          </span>
                        </NavLink>
                      ))
                    : null}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-tools">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setLanguage((value) => (value === 'ar' ? 'en' : 'ar'))}
              >
                {language === 'ar' ? 'EN' : 'عربي'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
                aria-label="Toggle theme"
              >
                <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
              </Button>
            </div>
            <Separator className="my-3" />
            <div className="sidebar-user">
              <div className="profile-avatar">{user.fullName?.charAt(0) || 'A'}</div>
              <div className="profile-copy">
                <strong>{user.fullName}</strong>
                <span>{isAr ? 'مشرف النظام' : 'Admin'}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => logout()} aria-label="Sign out">
                <Icon name="logout" size={16} />
              </Button>
            </div>
          </div>
        </aside>

        <div className="admin-workspace">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </Button>
          <main className="admin-content">
            <Outlet />
          </main>
          <AdminToaster />
        </div>
      </div>
    </PreferencesContext.Provider>
  );
}
