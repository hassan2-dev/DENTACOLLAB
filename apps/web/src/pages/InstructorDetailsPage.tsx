import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { courseCover, personPhoto } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';

type InstructorCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  level: string;
  duration: string;
  price?: number | null;
  currency?: string | null;
};

type Instructor = {
  id: string;
  name: string;
  title: string;
  biography: string;
  experience: string;
  certificates: string[];
  imageUrl?: string | null;
  socialLinks: { platform: string; url: string }[];
  courses: InstructorCourse[];
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

export function InstructorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const { data: instructor, isLoading, isError } = useQuery({
    queryKey: ['instructor', id, locale],
    queryFn: () => api<Instructor>(`/instructors/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-[#040b18]">
        <LogoLoader label={isAr ? 'جاري تحميل المدرب' : 'Loading instructor'} />
      </div>
    );
  }

  if (isError || !instructor) {
    return (
      <div className="bg-white py-20 text-center dark:bg-[#040b18]">
        <Helmet>
          <title>{isAr ? 'المدرب غير موجود' : 'Instructor not found'} | DentaCollab</title>
        </Helmet>
        <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
          {isAr ? 'لم يتم العثور على هذا المدرب.' : 'This instructor could not be found.'}
        </p>
        <Link to="/instructors" className="mt-4 inline-block text-sm font-bold text-[#1fb6d1]">
          {isAr ? 'العودة للمدربين' : 'Back to instructors'}
        </Link>
      </div>
    );
  }

  const certificates = instructor.certificates?.filter(Boolean) ?? [];
  const courses = instructor.courses ?? [];

  return (
    <div className="bg-white dark:bg-[#040b18]">
      <Helmet>
        <title>
          {instructor.name} | {isAr ? 'المدربون' : 'Instructors'} | DentaCollab
        </title>
        <meta name="description" content={instructor.biography?.slice(0, 160) || instructor.title} />
      </Helmet>

      <section className="relative overflow-hidden border-b border-slate-100 bg-[#101c38] text-white dark:border-[#172b48]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 80% 20%, rgba(31,182,209,.35), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(66,215,255,.12), transparent 50%)',
          }}
        />
        <div className="dc-container relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[240px_1fr] lg:items-end lg:gap-12">
          <div>
            <Link
              to="/instructors"
              className="mb-5 inline-flex text-xs font-bold text-[#7be7ff] transition hover:text-white"
            >
              {isAr ? '← كل المدربين' : '← All instructors'}
            </Link>
            <div className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5 shadow-[0_24px_60px_rgba(0,0,0,.35)]">
              <img
                src={personPhoto(instructor.imageUrl)}
                alt={instructor.name}
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          </div>

          <div className="pb-1 text-start">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#7be7ff]">
              {isAr ? 'ملف المدرب' : 'Instructor profile'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl md:text-5xl">
              {instructor.name}
            </h1>
            <p className="mt-3 text-lg font-semibold text-[#1fb6d1] sm:text-xl">{instructor.title}</p>
            {instructor.socialLinks?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {instructor.socialLinks.map((link) => (
                  <a
                    key={`${link.platform}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold capitalize text-white/90 transition hover:border-[#1fb6d1] hover:bg-[#1fb6d1]/15"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="dc-container grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
          <div className="text-start">
            <h2 className="text-xl font-bold text-[#101c38] dark:text-white sm:text-2xl">
              {isAr ? 'نبذة عن المدرب' : 'About the instructor'}
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-8">
              {instructor.biography}
            </p>

            {instructor.experience ? (
              <div className="mt-8 rounded-[1.4rem] border border-slate-200 bg-[#f7fafc] p-5 dark:border-[#19314f] dark:bg-[#081426] sm:p-6">
                <h3 className="text-sm font-bold uppercase tracking-[.14em] text-[#1fb6d1]">
                  {isAr ? 'الخبرة' : 'Experience'}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {instructor.experience}
                </p>
              </div>
            ) : null}

            {certificates.length ? (
              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-[.14em] text-[#1fb6d1]">
                  {isAr ? 'الشهادات والاعتمادات' : 'Certificates & credentials'}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {certificates.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-[#e8f9fc] px-3 py-1.5 text-xs font-bold text-[#101c38] dark:bg-[#0b2850] dark:text-[#7be7ff]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="text-start">
            <div className="sticky top-24 rounded-[1.5rem] border border-slate-200 bg-[#f7fafc] p-5 dark:border-[#19314f] dark:bg-[#081426] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1fb6d1]">
                {isAr ? 'ملخص' : 'Summary'}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-[#1a2f4d]">
                  <span>{isAr ? 'الدورات' : 'Courses'}</span>
                  <strong className="text-[#101c38] dark:text-white">{courses.length}</strong>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-[#1a2f4d]">
                  <span>{isAr ? 'الشهادات' : 'Certificates'}</span>
                  <strong className="text-[#101c38] dark:text-white">{certificates.length}</strong>
                </li>
              </ul>
              <Link
                to="/contact"
                className="mt-5 flex w-full items-center justify-center rounded-full bg-[#1fb6d1] px-4 py-3 text-sm font-bold !text-[#04101c] transition hover:bg-[#159db5]"
              >
                {isAr ? 'تواصل مع الأكاديمية' : 'Contact the academy'}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-[#f7fafc] py-10 dark:border-[#172b48] dark:bg-[#06101f] sm:py-14">
        <div className="dc-container">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 text-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1fb6d1]">
                {isAr ? 'برامج المدرب' : 'Instructor programs'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#101c38] dark:text-white sm:text-3xl">
                {isAr ? 'دوراته' : 'Courses by this instructor'}
              </h2>
            </div>
            <Link to="/courses" className="text-sm font-bold text-[#1789a2] hover:underline">
              {isAr ? 'كل الدورات' : 'All courses'}
            </Link>
          </div>

          {courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className="group overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-[#19314f] dark:bg-[#081426]"
                >
                  <img
                    src={courseCover(course.coverUrl)}
                    alt={course.title}
                    className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="p-4 text-start sm:p-5">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#e8f9fc] px-2.5 py-1 text-[11px] font-bold text-[#101c38] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                        {levelLabel[locale][course.level] || course.level}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-[#0b1c33] dark:text-slate-300">
                        {course.duration}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#101c38] transition group-hover:text-[#1fb6d1] dark:text-white">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {course.description}
                    </p>
                    {formatPrice(course.price, course.currency || 'IQD', isAr) ? (
                      <p className="mt-3 text-sm font-black text-[#101c38] dark:text-white">
                        {formatPrice(course.price, course.currency || 'IQD', isAr)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500 dark:border-[#1a2f4d] dark:bg-[#081426] dark:text-slate-400">
              {isAr
                ? 'لا توجد دورات منشورة مرتبطة بهذا المدرب حالياً.'
                : 'No published courses are linked to this instructor yet.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
