import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, CalendarDays, Eye, GraduationCap, Image, MessageSquare, UserPlus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { cn } from '@/lib/utils';

type Dashboard = {
  cards: Record<string, number>;
  charts: {
    registrationsByStatus: { status: string; count: number }[];
    registrationsByMonth: { month: string; count: number }[];
  };
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  NEW: { ar: 'جديد', en: 'New' },
  CONTACTED: { ar: 'تم التواصل', en: 'Contacted' },
  CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  COMPLETED: { ar: 'مكتمل', en: 'Completed' },
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#1fb6d1',
  CONTACTED: '#3b82f6',
  CONFIRMED: '#16a34a',
  REJECTED: '#dc2626',
  COMPLETED: '#101c38',
};

function formatMonthLabel(month: string, ar: boolean) {
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString(ar ? 'ar-IQ' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const { language } = useAdminPreferences();
  const ar = language === 'ar';
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api<Dashboard>('/analytics/dashboard'),
  });
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api<Array<{ id: string; title: string; body: string; isRead: boolean; createdAt: string }>>('/notifications'),
  });
  const events = useQuery({
    queryKey: ['admin-calendar'],
    queryFn: () =>
      api<Array<{ id: string; title: string; startsAt: string; endsAt: string; isPublished: boolean }>>(
        '/calendar/admin/all',
      ),
  });
  const upcomingWorkshops = (events.data || []).filter((e) => new Date(e.endsAt).getTime() >= Date.now()).slice(0, 4);

  const monthChart = (data?.charts.registrationsByMonth || []).map((row) => ({
    ...row,
    label: formatMonthLabel(row.month, ar),
  }));
  const statusChart = (data?.charts.registrationsByStatus || []).map((row) => ({
    ...row,
    label: STATUS_LABELS[row.status]?.[ar ? 'ar' : 'en'] || row.status,
  }));
  const statusTotal = statusChart.reduce((sum, row) => sum + row.count, 0);

  const metrics = [
    {
      label: ar ? 'زوار الموقع' : 'Site visitors',
      value: data?.cards.siteVisitors,
      hint: ar
        ? `${data?.cards.sitePageViews ?? 0} مشاهدة صفحة (من الموقع)`
        : `${data?.cards.sitePageViews ?? 0} page views (from website)`,
      to: '/',
      icon: Eye,
    },
    {
      label: ar ? 'الدورات' : 'Courses',
      value: data?.cards.courses,
      hint: ar ? `${data?.cards.publishedCourses ?? 0} منشورة` : `${data?.cards.publishedCourses ?? 0} published`,
      to: '/courses',
      icon: BookOpen,
    },
    {
      label: ar ? 'التسجيلات' : 'Registrations',
      value: data?.cards.registrations,
      hint: ar ? `${data?.cards.newRegistrations ?? 0} جديدة` : `${data?.cards.newRegistrations ?? 0} new`,
      to: '/registrations',
      icon: UserPlus,
    },
    {
      label: ar ? 'الرسائل' : 'Messages',
      value: data?.cards.messagesUnread,
      hint: ar ? 'غير مقروءة' : 'Unread',
      to: '/messages',
      icon: MessageSquare,
    },
    {
      label: ar ? 'الخريجون' : 'Graduates',
      value: data?.cards.graduates,
      hint: ar ? 'منشورون' : 'Published',
      to: '/graduates',
      icon: GraduationCap,
    },
    {
      label: ar ? 'المدربون' : 'Instructors',
      value: data?.cards.instructors,
      hint: ar ? 'في الأكاديمية' : 'In academy',
      to: '/instructors',
      icon: Users,
    },
  ];

  const shortcuts = [
    {
      to: '/courses',
      ar: 'الدورات',
      en: 'Courses',
      descAr: 'إنشاء ونشر الدورات',
      descEn: 'Create and publish courses',
      icon: BookOpen,
      tone: 'bg-[#e9eef7] text-[#263d68]',
    },
    {
      to: '/registrations',
      ar: 'التسجيلات',
      en: 'Registrations',
      descAr: 'مراجعة طلبات التسجيل',
      descEn: 'Review enrollment requests',
      icon: UserPlus,
      tone: 'bg-[#e2f8fc] text-[#0f8aa3]',
    },
    {
      to: '/messages',
      ar: 'الرسائل',
      en: 'Messages',
      descAr: 'رسائل التواصل الواردة',
      descEn: 'Incoming contact messages',
      icon: MessageSquare,
      tone: 'bg-[#fff3df] text-[#c07a10]',
    },
    {
      to: '/gallery',
      ar: 'المعرض والوسائط',
      en: 'Gallery & media',
      descAr: 'رفع الصور وألبومات الموقع',
      descEn: 'Upload images and site albums',
      icon: Image,
      tone: 'bg-[#e8f8f1] text-[#1a8f5c]',
    },
    {
      to: '/instructors',
      ar: 'المدربون',
      en: 'Instructors',
      descAr: 'ملفات المدربين',
      descEn: 'Instructor profiles',
      icon: Users,
      tone: 'bg-[#e9eef7] text-[#263d68]',
    },
    {
      to: '/calendar',
      ar: 'الورش',
      en: 'Workshops',
      descAr: 'ورش وإعلانات الموقع',
      descEn: 'Workshops and site announcements',
      icon: CalendarDays,
      tone: 'bg-[#e2f8fc] text-[#0f8aa3]',
    },
    {
      to: '/graduates',
      ar: 'الخريجون',
      en: 'Graduates',
      descAr: 'قصص النجاح والشهادات',
      descEn: 'Success stories and certificates',
      icon: GraduationCap,
      tone: 'bg-[#e8f8f1] text-[#1a8f5c]',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="accent" className="mb-2">
            {ar ? 'نظرة عامة' : 'Overview'}
          </Badge>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-ink)] md:text-3xl">
            {ar ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-ink-muted)]">
            {ar
              ? 'هنا تشوف بسرعة: كم زائر، كم طلب تسجيل جديد، وكم رسالة. من الأزرار تحت تفتح الصفحة اللي تحتاجها.'
              : 'Quick view: visitors, new registrations, and messages. Use the shortcuts below to open what you need.'}
          </p>
        </div>
        <Badge variant="outline">
          {new Date().toLocaleDateString(ar ? 'ar-IQ' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const inner = (
            <Card className="h-full">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f9fc] text-[#1fb6d1]">
                  <Icon size={16} />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black tracking-tight">{isLoading ? '—' : (metric.value ?? 0)}</div>
                <p className="mt-1 text-[0.7rem] text-[var(--color-ink-muted)]">{metric.hint}</p>
              </CardContent>
            </Card>
          );
          if (metric.to === '/') {
            return <div key={metric.label}>{inner}</div>;
          }
          return (
            <Link key={metric.label} to={metric.to} className="block transition hover:-translate-y-0.5">
              {inner}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{ar ? 'إجراءات سريعة' : 'Quick actions'}</CardTitle>
          <CardDescription>{ar ? 'اختصارات منظمة لأهم أقسام الإدارة' : 'Organized shortcuts to the main admin sections'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3.5 transition hover:border-[#1fb6d1] hover:bg-[#f7fbfd]"
                >
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', item.tone)}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--color-ink)] group-hover:text-[#101c38]">
                      {ar ? item.ar : item.en}
                    </span>
                    <span className="mt-0.5 block text-[0.72rem] leading-5 text-[var(--color-ink-muted)]">
                      {ar ? item.descAr : item.descEn}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{ar ? 'نمو التسجيلات' : 'Registration growth'}</CardTitle>
            <CardDescription>{ar ? 'آخر 6 أشهر من قاعدة البيانات' : 'Last 6 months from database'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthChart}>
                  <defs>
                    <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1fb6d1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1fb6d1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value), ar ? 'التسجيلات' : 'Registrations']}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#101c38" strokeWidth={2.5} fill="url(#regFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ar ? 'حالة التسجيلات' : 'Registration status'}</CardTitle>
            <CardDescription>{ar ? 'التوزيع الحالي' : 'Current distribution'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusChart.map((row) => {
              const pct = statusTotal ? Math.round((row.count / statusTotal) * 100) : 0;
              return (
                <div key={row.status}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-[var(--color-ink)]">{row.label}</span>
                    <span className="text-xs font-bold text-[var(--color-ink-muted)]">
                      {row.count}
                      {statusTotal ? ` · ${pct}%` : ''}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${statusTotal ? Math.max(pct, row.count ? 4 : 0) : 0}%`,
                        background: STATUS_COLORS[row.status] || '#1fb6d1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {!statusTotal ? (
              <p className="py-6 text-center text-sm text-[var(--color-ink-muted)]">
                {ar ? 'لا توجد تسجيلات بعد' : 'No registrations yet'}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{ar ? 'آخر النشاط' : 'Recent activity'}</CardTitle>
              <CardDescription>{ar ? 'إشعارات المنصة' : 'Platform notifications'}</CardDescription>
            </div>
            <Link to="/messages" className="text-xs font-bold text-[#1fb6d1]">
              {ar ? 'الرسائل' : 'Messages'}
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {(notifications.data || []).slice(0, 5).map((item, index) => (
              <div key={item.id}>
                {index > 0 ? <Separator /> : null}
                <div className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">{item.body}</p>
                  </div>
                  <Badge variant={item.isRead ? 'outline' : 'accent'}>{item.isRead ? (ar ? 'مقروء' : 'Read') : ar ? 'جديد' : 'New'}</Badge>
                </div>
              </div>
            ))}
            {!notifications.data?.length ? (
              <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
                {ar ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{ar ? 'الورش القادمة' : 'Upcoming workshops'}</CardTitle>
              <CardDescription>{ar ? 'من إدارة الورش' : 'From workshops'}</CardDescription>
            </div>
            <Link to="/calendar" className="text-xs font-bold text-[#1fb6d1]">
              {ar ? 'الورش' : 'Workshops'}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingWorkshops.map((event) => (
              <div key={event.id} className="flex gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <span className="mt-0.5 h-10 w-1 rounded-full bg-[#1fb6d1]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {new Date(event.startsAt).toLocaleString(ar ? 'ar-IQ' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {!event.isPublished ? ` · ${ar ? 'متوقفة' : 'Off'}` : ''}
                  </p>
                </div>
              </div>
            ))}
            {!upcomingWorkshops.length ? (
              <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
                {ar ? 'لا توجد ورش قادمة' : 'No upcoming workshops'}
              </p>
            ) : null}
            <div className="rounded-lg bg-[#e8f9fc] p-3">
              <p className="text-xs font-bold text-[#101c38]">{ar ? 'تذكير المحتوى' : 'Content reminder'}</p>
              <p className="mt-1 text-[0.7rem] leading-5 text-[var(--color-ink-muted)]">
                {ar
                  ? 'أي محتوى عام يجب كتابته بالعربية والإنجليزية معاً قبل الحفظ.'
                  : 'Any public content must be written in both Arabic and English before saving.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
