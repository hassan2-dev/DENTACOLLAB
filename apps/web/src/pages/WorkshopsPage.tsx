import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { courseCover } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';

export type Workshop = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  presenter?: string | null;
  presenterAr?: string | null;
  presenterEn?: string | null;
  startsAt: string;
  endsAt: string;
  isFeatured?: boolean;
};

function formatRange(startsAt: string, endsAt: string, isAr: boolean) {
  const locale = isAr ? 'ar-IQ' : 'en-US';
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · ${start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `${start.toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} → ${end.toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`;
}

function presenterOf(workshop: Workshop) {
  return workshop.presenter || workshop.presenterAr || workshop.presenterEn || '';
}

export function WorkshopsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data, isLoading } = useQuery({
    queryKey: ['workshops', locale],
    queryFn: () => api<Workshop[]>(`/calendar?locale=${locale}`),
  });

  return (
    <div className="bg-white dark:bg-[#040b18]">
      <Helmet>
        <title>{isAr ? 'الورش' : 'Workshops'} | DentaCollab</title>
      </Helmet>

      <section className="border-b border-slate-100 bg-[#f7fafc] py-10 dark:border-[#172b48] dark:bg-[#06101f] sm:py-14">
        <div className="dc-container max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">
            {isAr ? 'داخل المركز' : 'At the center'}
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#101c38] sm:text-4xl md:text-5xl dark:text-white">
            {isAr ? 'الورش' : 'Workshops'}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8 dark:text-slate-400">
            {isAr
              ? 'ورش تطبيقية تُقام داخل مركز DentaCollab. اختر ورشة واطّلع على المقدّم والتفاصيل والموعد.'
              : 'Hands-on workshops hosted inside DentaCollab Center. See the presenter, details, and schedule.'}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="dc-container">
          {isLoading ? (
            <LogoLoader label={isAr ? 'جاري تحميل الورش' : 'Loading workshops'} />
          ) : (data || []).length ? (
            <div className="mx-auto flex max-w-4xl flex-col gap-5">
              {(data || []).map((workshop, index) => {
                const presenter = presenterOf(workshop);
                return (
                  <motion.div
                    key={workshop.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                  >
                    <Link
                      to={`/workshops/${workshop.slug}`}
                      className="group grid overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white transition hover:border-[#1fb6d1]/40 hover:shadow-[0_18px_45px_rgba(16,28,56,.1)] dark:border-[#19314f] dark:bg-[#081426] sm:grid-cols-[220px_1fr]"
                    >
                      <div className="relative h-44 sm:h-full sm:min-h-[180px]">
                        <img
                          src={courseCover(workshop.coverUrl, index)}
                          alt={workshop.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        {workshop.isFeatured ? (
                          <span className="absolute start-3 top-3 rounded-md bg-[#101c38] px-2.5 py-1 text-[10px] font-bold text-white">
                            {isAr ? 'إعلان' : 'Featured'}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-col justify-center p-5 sm:p-6">
                        <p className="text-xs font-bold text-[#1fb6d1]">
                          {formatRange(workshop.startsAt, workshop.endsAt, isAr)}
                        </p>
                        <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#101c38] transition group-hover:text-[#1fb6d1] sm:text-2xl dark:text-white">
                          {workshop.title}
                        </h2>
                        {presenter ? (
                          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">{isAr ? 'المقدّم: ' : 'Presenter: '}</span>
                            {presenter}
                          </p>
                        ) : null}
                        {workshop.description ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                            {workshop.description}
                          </p>
                        ) : null}
                        <span className="mt-4 inline-flex w-fit text-sm font-bold text-[#1fb6d1]">
                          {isAr ? 'التفاصيل ←' : 'Details →'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              {isAr ? 'لا توجد ورش منشورة حالياً.' : 'No published workshops right now.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export function WorkshopDetailsPage() {
  const { slug = '' } = useParams();
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['workshop', slug, locale],
    queryFn: () => api<Workshop>(`/calendar/slug/${slug}?locale=${locale}`),
    enabled: Boolean(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white py-24 dark:bg-[#040b18]">
        <LogoLoader label={isAr ? 'جاري التحميل' : 'Loading'} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white py-24 dark:bg-[#040b18]">
        <div className="dc-container text-center">
          <h1 className="text-2xl font-black text-[#101c38] dark:text-white">
            {isAr ? 'الورشة غير متاحة' : 'Workshop unavailable'}
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {isAr
              ? 'ربما توقفت أو انتهت. تصفّح الورش النشطة.'
              : 'It may have been turned off or ended. Browse active workshops.'}
          </p>
          <Link
            to="/workshops"
            className="mt-6 inline-flex rounded-full bg-[#101c38] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1fb6d1]"
          >
            {isAr ? 'الورش' : 'Workshops'}
          </Link>
        </div>
      </div>
    );
  }

  const presenter = presenterOf(data);

  return (
    <div className="bg-white dark:bg-[#040b18]">
      <Helmet>
        <title>
          {data.title} | {isAr ? 'ورشة' : 'Workshop'} | DentaCollab
        </title>
        {data.description ? <meta name="description" content={data.description} /> : null}
      </Helmet>

      <section className="border-b border-slate-100 bg-[#f7fafc] dark:border-[#172b48] dark:bg-[#06101f]">
        <div className="dc-container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">
              {isAr ? 'ورشة داخل المركز' : 'In-center workshop'}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] text-[#101c38] sm:text-4xl md:text-5xl dark:text-white">
              {data.title}
            </h1>
            <div className="mt-5 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-bold text-[#101c38] dark:text-white">{isAr ? 'الموعد: ' : 'Schedule: '}</span>
                {formatRange(data.startsAt, data.endsAt, isAr)}
              </p>
              {presenter ? (
                <p>
                  <span className="font-bold text-[#101c38] dark:text-white">{isAr ? 'المقدّم: ' : 'Presenter: '}</span>
                  {presenter}
                </p>
              ) : null}
              <p>
                <span className="font-bold text-[#101c38] dark:text-white">{isAr ? 'المكان: ' : 'Venue: '}</span>
                {isAr ? 'مركز DentaCollab' : 'DentaCollab Center'}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex rounded-full bg-[#101c38] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1fb6d1]"
              >
                {isAr ? 'احجز مقعدك' : 'Reserve a seat'}
              </Link>
              <Link
                to="/workshops"
                className="inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-[#101c38] transition hover:border-[#1fb6d1] hover:text-[#1fb6d1] dark:border-[#1f3658] dark:text-white"
              >
                {isAr ? 'كل الورش' : 'All workshops'}
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.5rem]">
            <img
              src={courseCover(data.coverUrl, 11)}
              alt={data.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="dc-container max-w-3xl">
          <h2 className="text-xl font-black text-[#101c38] dark:text-white">
            {isAr ? 'تفاصيل الورشة' : 'Workshop details'}
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
            {data.description ||
              (isAr ? 'تفاصيل الورشة ستُعلن قريباً.' : 'Workshop details will be announced soon.')}
          </p>
        </div>
      </section>
    </div>
  );
}
