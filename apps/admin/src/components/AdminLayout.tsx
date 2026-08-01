import { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
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

const groups = [
  {
    ar: 'نظرة عامة',
    en: 'Overview',
    links: [
      { to: '/', ar: 'لوحة التحكم', en: 'Dashboard', icon: 'grid' },
      { to: '/registrations', ar: 'التسجيلات', en: 'Registrations', icon: 'users' },
      { to: '/calendar', ar: 'الورش', en: 'Workshops', icon: 'calendar' },
      { to: '/messages', ar: 'الرسائل', en: 'Messages', icon: 'mail' },
    ],
  },
  {
    ar: 'إدارة الأكاديمية',
    en: 'Academy',
    links: [
      { to: '/courses', ar: 'الدورات', en: 'Courses', icon: 'book' },
      { to: '/instructors', ar: 'المدربون', en: 'Instructors', icon: 'badge' },
      { to: '/graduates', ar: 'الخريجون', en: 'Graduates', icon: 'cap' },
      { to: '/testimonials', ar: 'آراء المتدربين', en: 'Testimonials', icon: 'star' },
    ],
  },
  {
    ar: 'المحتوى',
    en: 'Content',
    links: [
      { to: '/gallery', ar: 'المعرض والوسائط', en: 'Gallery & media', icon: 'image' },
      { to: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ', icon: 'help' },
      { to: '/chatbot', ar: 'الشات بوت', en: 'Chatbot', icon: 'spark' },
    ],
  },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 7h8M8 11h6" /></>,
    badge: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2 4.5 2-1-9" /></>,
    cap: <><path d="m2 10 10-5 10 5-10 5L2 10Z" /><path d="M6 12.5V17c3 2.5 9 2.5 12 0v-4.5M22 10v6" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    folder: <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2M12 17h.01" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    spark: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    moon: <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('dc-admin-sidebar') === 'collapsed');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('dc-admin-language') === 'en' ? 'en' : 'ar'));
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('dc-admin-theme') === 'dark' ? 'dark' : 'light'));

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

  if (!user) return <Navigate to="/login" replace />;

  return (
    <PreferencesContext.Provider value={{ language, theme }}>
      <div className={cn('admin-shell', collapsed && 'sidebar-collapsed')} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {mobileOpen ? <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} /> : null}

        <aside className={cn('admin-sidebar', mobileOpen && 'is-open')}>
          <div className="sidebar-brand">
            <span className="admin-logo-mark">
              <img src="/logo.png" alt="" />
            </span>
            <div className="brand-copy">
              <strong>
                <b>DENTA</b>COLLAB
              </strong>
              <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin workspace'}</span>
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
            {groups.map((group) => (
              <div className="nav-group" key={group.en}>
                <p className="nav-group-label">{group[language]}</p>
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    title={link[language]}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => cn('sidebar-link', isActive && 'is-active')}
                  >
                    <Icon name={link.icon} />
                    <span>{link[language]}</span>
                  </NavLink>
                ))}
              </div>
            ))}
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
                <span>Super Admin</span>
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
