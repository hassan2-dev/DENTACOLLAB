import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button, Input } from '@dentacollab/ui';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { user, login } = useAuth();
  const [language, setLanguage] = useState<'ar' | 'en'>(() => (localStorage.getItem('dc-admin-language') === 'en' ? 'en' : 'ar'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('dc-admin-theme') === 'dark' ? 'dark' : 'light'));
  const [email, setEmail] = useState('admin@dentacollab.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ar = language === 'ar';

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    localStorage.setItem('dc-admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
    localStorage.setItem('dc-admin-language', language);
  }, [ar, language]);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page" dir={ar ? 'rtl' : 'ltr'}>
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-toolbar">
        <button onClick={() => { const next = ar ? 'en' : 'ar'; setLanguage(next); localStorage.setItem('dc-admin-language', next); }}>
          {ar ? 'EN' : 'ع'}
        </button>
        <button onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))} aria-label="Toggle theme">
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>
      <section className="login-showcase">
        <div className="login-brand">
          <span className="admin-logo-mark login-logo-mark"><img src="/logo.png" alt="" /></span>
          <div><strong><b>DENTA</b>COLLAB</strong><span>{ar ? 'التعاون يصنع التميز' : 'Better dentistry, together'}</span></div>
        </div>
        <div className="showcase-copy">
          <span className="showcase-pill">{ar ? 'لوحة إدارة متكاملة' : 'Unified admin workspace'}</span>
          <h1>{ar ? 'أدر مجتمع طب الأسنان بكل سهولة.' : 'Manage your dental community with clarity.'}</h1>
          <p>{ar ? 'كل ما تحتاجه لإدارة الدورات والمتدربين والمحتوى في مكان واحد آمن وسريع.' : 'Courses, learners, content, and insights—organized in one secure, focused place.'}</p>
          <div className="showcase-stats">
            <div><strong>360°</strong><span>{ar ? 'رؤية شاملة' : 'Full visibility'}</span></div>
            <div><strong>24/7</strong><span>{ar ? 'وصول آمن' : 'Secure access'}</span></div>
            <div><strong>1</strong><span>{ar ? 'مساحة عمل' : 'Workspace'}</span></div>
          </div>
        </div>
        <p className="login-copyright">© {new Date().getFullYear()} DentaCollab</p>
      </section>
      <section className="login-panel">
        <form onSubmit={onSubmit} className="login-form">
          <div className="mobile-login-logo">
            <span className="admin-logo-mark login-logo-mark"><img src="/logo.png" alt="" /></span>
            <strong><b>DENTA</b>COLLAB</strong>
          </div>
          <span className="login-kicker">{ar ? 'مرحباً بعودتك' : 'WELCOME BACK'}</span>
          <h2>{ar ? 'تسجيل الدخول' : 'Sign in to your account'}</h2>
          <p>{ar ? 'أدخل بياناتك للوصول إلى لوحة التحكم.' : 'Enter your details to access the admin dashboard.'}</p>
          <Input id="email" label={ar ? 'البريد الإلكتروني' : 'Email address'} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input id="password" label={ar ? 'كلمة المرور' : 'Password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="login-options">
            <label><input type="checkbox" /> {ar ? 'تذكرني' : 'Remember me'}</label>
            <span>{ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}</span>
          </div>
          {error ? <p className="dc-error login-error">{error}</p> : null}
          <Button type="submit" className="w-full login-submit" disabled={loading}>
            {loading ? (ar ? 'جاري الدخول...' : 'Signing in...') : (ar ? 'دخول آمن' : 'Sign in securely')}
            <span>←</span>
          </Button>
          <p className="login-help">{ar ? 'هل تحتاج للمساعدة؟ تواصل مع مسؤول النظام' : 'Need help? Contact your system administrator'}</p>
        </form>
      </section>
    </div>
  );
}
