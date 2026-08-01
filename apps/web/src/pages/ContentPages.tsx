import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { personPhoto } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';

function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#040b18]">
      <section className="border-b border-slate-100 bg-[#f7fafc] py-10 dark:border-[#172b48] dark:bg-[#06101f] sm:py-16">
        <div className="dc-container">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#101c38] sm:text-4xl md:text-5xl dark:text-white">{title}</h1>
          {subtitle ? <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8 dark:text-slate-400">{subtitle}</p> : null}
        </div>
      </section>
      <section className="py-10 sm:py-14">
        <div className="dc-container">{children}</div>
      </section>
    </div>
  );
}

export function BenefitsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const title = isAr ? 'مزايا الطالب' : 'Student benefits';
  const subtitle = isAr
    ? 'تدريب عملي، محتوى محدّث، ومتابعة احترافية.'
    : 'Hands-on training, updated curricula, and professional follow-up.';
  const items = isAr
    ? ['مناهج عملية', 'مدربون خبراء', 'شهادات معتمدة', 'مجتمع مهني']
    : ['Hands-on curricula', 'Expert instructors', 'Accredited certificates', 'Professional community'];

  return (
    <>
      <Helmet>
        <title>{title} | DentaCollab</title>
      </Helmet>
      <PageShell eyebrow={isAr ? 'لماذا DentaCollab' : 'Why DentaCollab'} title={title} subtitle={subtitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200 bg-[#f8fcfd] p-6 text-lg font-semibold text-[#101c38] dark:border-[#19314f] dark:bg-[#081426] dark:text-white"
            >
              {item}
            </div>
          ))}
        </div>
      </PageShell>
    </>
  );
}

export function InstructorsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data, isLoading } = useQuery({
    queryKey: ['instructors', locale],
    queryFn: () =>
      api<
        Array<{
          id: string;
          name: string;
          title: string;
          biography: string;
          experience: string;
          certificates: string[];
          imageUrl?: string;
          socialLinks: { platform: string; url: string }[];
          courses: { id: string; slug: string; title: string }[];
        }>
      >('/instructors'),
  });
  return (
    <>
      <Helmet>
        <title>{isAr ? 'المدربون' : 'Instructors'} | DentaCollab</title>
      </Helmet>
      <PageShell
        eyebrow={isAr ? 'الخبراء' : 'Experts'}
        title={isAr ? 'المدربون' : 'Instructors'}
        subtitle={
          isAr
            ? 'تعلّم مع مدربين يجمعون بين الخبرة السريرية والتقنية الرقمية.'
            : 'Learn with instructors who combine clinical expertise and digital technology.'
        }
      >
        {isLoading ? (
          <LogoLoader label={isAr ? 'جاري تحميل المدربين' : 'Loading instructors'} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((ins) => {
              const courseCount = ins.courses?.length ?? 0;
              return (
                <Link
                  key={ins.id}
                  to={`/instructors/${ins.id}`}
                  className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#1fb6d1]/50 hover:shadow-xl dark:border-[#19314f] dark:bg-[#081426]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#101c38]">
                    <img
                      src={personPhoto(ins.imageUrl)}
                      alt={ins.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#04101c]/85 to-transparent p-4 pt-12">
                      <p className="text-[11px] font-bold text-[#7be7ff]">
                        {courseCount
                          ? isAr
                            ? `${courseCount} دورة`
                            : `${courseCount} course${courseCount === 1 ? '' : 's'}`
                          : isAr
                            ? 'ملف المدرب'
                            : 'Instructor profile'}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 text-start">
                    <h2 className="text-xl font-bold text-[#101c38] transition group-hover:text-[#1fb6d1] dark:text-white">
                      {ins.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[#1fb6d1]">{ins.title}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {ins.biography}
                    </p>
                    <span className="mt-4 inline-flex text-xs font-bold text-[#1789a2]">
                      {isAr ? 'عرض التفاصيل والدورات ←' : 'View details & courses →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!isLoading && !data?.length ? (
          <p className="text-slate-500">{isAr ? 'لا يوجد مدربون منشورون بعد.' : 'No published instructors yet.'}</p>
        ) : null}
      </PageShell>
    </>
  );
}

export function GalleryPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data } = useQuery({
    queryKey: ['gallery', locale],
    queryFn: () =>
      api<Array<{ id: string; title: string; description?: string; media: { id: string; url: string; type: string; title?: string }[] }>>(
        '/gallery',
      ),
  });
  return (
    <>
      <Helmet>
        <title>{isAr ? 'المعرض' : 'Gallery'} | DentaCollab</title>
      </Helmet>
      <PageShell
        eyebrow={isAr ? 'نتائج حقيقية' : 'Real results'}
        title={isAr ? 'المعرض' : 'Gallery'}
        subtitle={isAr ? 'لمحات من المشاريع والنتائج التدريبية.' : 'Highlights from training projects and clinical outcomes.'}
      >
        {(data || []).map((album) => (
          <section key={album.id} className="mb-10">
            <h2 className="mb-2 text-2xl font-bold text-[#101c38] dark:text-white">{album.title}</h2>
            {album.description ? <p className="mb-4 text-slate-500 dark:text-slate-400">{album.description}</p> : null}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {album.media.map((m) =>
                m.type === 'VIDEO' ? (
                  <video key={m.id} src={m.url} controls className="h-40 w-full max-w-full rounded-xl bg-black object-cover" />
                ) : (
                  <img key={m.id} src={m.url} alt={m.title || ''} className="h-40 w-full max-w-full rounded-xl object-cover" />
                ),
              )}
            </div>
          </section>
        ))}
        {!data?.length ? (
          <p className="text-slate-500">{isAr ? 'لا توجد عناصر في المعرض بعد.' : 'No gallery items yet.'}</p>
        ) : null}
      </PageShell>
    </>
  );
}

export function GraduatesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data } = useQuery({
    queryKey: ['graduates', locale],
    queryFn: () =>
      api<
        Array<{
          id: string;
          fullName: string;
          imageUrl?: string;
          certificateUrl?: string;
          courseTitle?: string;
          rating?: number;
          graduationDate: string;
          description?: string;
        }>
      >('/graduates'),
  });
  return (
    <>
      <Helmet>
        <title>{isAr ? 'الخريجون' : 'Graduates'} | DentaCollab</title>
      </Helmet>
      <PageShell
        eyebrow={isAr ? 'قصص نجاح' : 'Success stories'}
        title={isAr ? 'الخريجون' : 'Graduates'}
        subtitle={
          isAr
            ? 'أشخاص أكملوا برامج الأكاديمية: الدورة، التقييم، وما أنجزوه.'
            : 'People who completed academy programs — course, rating, and what they achieved.'
        }
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data || []).map((g) => (
            <article key={g.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-[#19314f] dark:bg-[#081426]">
              {g.imageUrl ? (
                <img src={g.imageUrl} alt={g.fullName} className="h-48 w-full object-cover" />
              ) : (
                <div className="grid h-48 place-items-center bg-[#e8f0f8] text-4xl font-black text-[#101c38]/40">
                  {g.fullName.charAt(0)}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#101c38] dark:text-white">{g.fullName}</h2>
                  <span className="shrink-0 text-xs font-bold text-[#1fb6d1]">
                    {'★'.repeat(Math.min(5, Math.max(1, g.rating ?? 5)))}
                  </span>
                </div>
                <p className="text-sm text-[#1fb6d1]">{g.courseTitle}</p>
                <p className="mb-2 text-xs text-slate-400">
                  {new Date(g.graduationDate).toLocaleDateString(isAr ? 'ar' : 'en')}
                </p>
                <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">{g.description}</p>
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </>
  );
}

export function TestimonialsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data } = useQuery({
    queryKey: ['testimonials', locale],
    queryFn: () =>
      api<Array<{ id: string; name: string; profession: string; rating: number; review: string; imageUrl?: string; videoUrl?: string }>>(
        '/testimonials',
      ),
  });
  return (
    <>
      <Helmet>
        <title>{isAr ? 'آراء المتدربين' : 'Testimonials'} | DentaCollab</title>
      </Helmet>
      <PageShell
        eyebrow={isAr ? 'ثقة المتدربين' : 'Learner trust'}
        title={isAr ? 'آراء المتدربين' : 'Testimonials'}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {(data || []).map((t) => (
            <blockquote
              key={t.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-[#19314f] dark:bg-[#081426]"
            >
              <div className="mb-3 flex items-start gap-3">
                {t.imageUrl ? <img src={t.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#101c38] dark:text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.profession}</p>
                </div>
                <span className="shrink-0 text-xs text-[#1fb6d1] sm:text-base">{'★'.repeat(t.rating)}</span>
              </div>
              <p className="leading-7 text-slate-600 dark:text-slate-300">{t.review}</p>
              {t.videoUrl ? <video src={t.videoUrl} controls className="mt-3 w-full rounded-xl" /> : null}
            </blockquote>
          ))}
        </div>
      </PageShell>
    </>
  );
}

export function FaqPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data } = useQuery({
    queryKey: ['faq', locale],
    queryFn: () => api<Array<{ id: string; question: string; answer: string; category: string }>>('/faq'),
  });
  const grouped = (data || []).reduce<Record<string, typeof data>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] || []), item];
    return acc;
  }, {});
  return (
    <>
      <Helmet>
        <title>{isAr ? 'الأسئلة الشائعة' : 'FAQ'} | DentaCollab</title>
      </Helmet>
      <PageShell eyebrow="FAQ" title={isAr ? 'الأسئلة الشائعة' : 'Frequently asked questions'}>
        <div className="mx-auto max-w-3xl">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-[#1fb6d1]">{cat}</h2>
              <div className="space-y-3">
                {(items || []).map((f) => (
                  <details
                    key={f.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#19314f] dark:bg-[#081426]"
                  >
                    <summary className="cursor-pointer font-semibold text-[#101c38] dark:text-white">{f.question}</summary>
                    <p className="mt-2 leading-7 text-slate-500 dark:text-slate-400">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    </>
  );
}
