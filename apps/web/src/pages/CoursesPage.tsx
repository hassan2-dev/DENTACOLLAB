import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { courseCover } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';

type Course = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  level: string;
  duration: string;
  description: string;
  price?: number | null;
  currency?: string | null;
};

const levelLabel: Record<string, Record<string, string>> = {
  ar: { STUDENTS: 'طلاب', BASIC: 'أساسي', ADVANCED: 'متقدم' },
  en: { STUDENTS: 'Students', BASIC: 'Basic', ADVANCED: 'Advanced' },
};

function formatPrice(price?: number | null, currency = 'IQD', isAr = true) {
  if (price == null) return null;
  const amount = price.toLocaleString(isAr ? 'ar-IQ' : 'en-US');
  if (currency === 'USD') return isAr ? `${amount} $` : `$${amount}`;
  return isAr ? `${amount} د.ع` : `${amount} IQD`;
}

export function CoursesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data, isLoading } = useQuery({
    queryKey: ['courses', locale],
    queryFn: () => api<Course[]>('/courses'),
  });

  return (
    <div className="bg-white dark:bg-[#040b18]">
      <Helmet>
        <title>{isAr ? 'الدورات' : 'Courses'} | DentaCollab</title>
      </Helmet>
      <section className="border-b border-slate-100 bg-[#f7fafc] py-10 dark:border-[#172b48] dark:bg-[#06101f] sm:py-16">
        <div className="dc-container">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">
            {isAr ? 'برامج الأكاديمية' : 'Academy programs'}
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#101c38] sm:text-4xl md:text-5xl dark:text-white">
            {isAr ? 'الدورات' : 'Courses'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8 dark:text-slate-400">
            {isAr
              ? 'برامج احترافية في طب الأسنان الرقمي تجمع بين المعرفة السريرية والتطبيق العملي.'
              : 'Professional digital dentistry programs that combine clinical knowledge with hands-on practice.'}
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="dc-container">
          {isLoading ? (
            <LogoLoader label={isAr ? 'جاري تحميل الدورات' : 'Loading courses'} />
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((course, idx) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-[#19314f] dark:bg-[#081426]"
              >
                <img
                  src={courseCover(course.coverUrl, idx)}
                  alt={course.title}
                  className="h-52 w-full object-cover object-center transition duration-500 group-hover:scale-105"
                />
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#e8f9fc] px-3 py-1 text-xs font-bold text-[#101c38] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                      {levelLabel[locale][course.level] || course.level}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#0b1c33] dark:text-slate-300">
                      {course.duration}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#101c38] transition group-hover:text-[#1fb6d1] dark:text-white">
                    {course.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{course.description}</p>
                  {formatPrice(course.price, course.currency || 'IQD', isAr) ? (
                    <p className="mt-4 text-base font-black text-[#101c38] dark:text-white">
                      {formatPrice(course.price, course.currency || 'IQD', isAr)}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
