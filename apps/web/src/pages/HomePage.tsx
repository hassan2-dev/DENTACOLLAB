import { Helmet } from 'react-helmet-async';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { MEDIA, courseCover, stockPhoto } from '../lib/media';
import { DynamicCourseRegistrationFields } from '../components/DynamicCourseRegistrationFields';

const DentalHeroScene = lazy(() =>
  import('../components/DentalHeroScene').then((m) => ({ default: m.DentalHeroScene })),
);

type Course = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  level: string;
  duration: string;
  description: string;
  overview: string;
  objectives: string[];
  requirements: string[];
  registrationFormUrl?: string;
  price?: number | null;
  currency?: string | null;
  curriculum: { title: string; lessons: { title: string; duration?: string }[] }[];
  instructors: {
    instructor: {
      id: string;
      name: string;
      title: string;
      biography?: string;
      experience?: string;
      imageUrl?: string;
    };
  }[];
  gallery: { url: string; alt?: string }[];
};
type Faq = { id: string; question: string; answer: string };
type Workshop = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  presenter?: string | null;
  startsAt: string;
  endsAt: string;
};
type Graduate = {
  id: string;
  fullName: string;
  imageUrl?: string;
  courseTitle?: string;
  rating?: number;
  description?: string;
  graduationDate: string;
};

const levelLabel: Record<string, Record<string, string>> = {
  ar: { STUDENTS: 'طلاب', BASIC: 'أساسي', ADVANCED: 'متقدم' },
  en: { STUDENTS: 'Students', BASIC: 'Basic', ADVANCED: 'Advanced' },
};

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1fb6d1] focus:ring-4 focus:ring-[#1fb6d1]/15 dark:border-[#1f3658] dark:bg-[#071426] dark:text-white dark:placeholder:text-slate-500';

export function HomePage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const courses = useQuery({ queryKey: ['courses', locale], queryFn: () => api<Course[]>('/courses') });
  const faq = useQuery({ queryKey: ['faq', locale], queryFn: () => api<Faq[]>('/faq') });
  const featuredWorkshop = useQuery({
    queryKey: ['workshop-featured', locale],
    queryFn: () => api<Workshop | null>(`/calendar/featured?locale=${locale}`),
  });
  const graduates = useQuery({
    queryKey: ['graduates-home', locale, 'featured'],
    queryFn: () => api<Graduate[]>(`/graduates?featured=true&locale=${locale}`),
  });
  const featured = courses.data?.[0];
  const publishedCourses = courses.data ?? [];
  const publishedGraduates = graduates.data ?? [];
  const instructor = featured?.instructors?.[0]?.instructor;
  const [courseSlug, setCourseSlug] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!courseSlug && publishedCourses[0]?.slug) {
      setCourseSlug(publishedCourses[0].slug);
    }
  }, [publishedCourses, courseSlug]);

  useEffect(() => {
    setAnswers({});
  }, [courseSlug]);

  const registration = useMutation({
    mutationFn: async () => {
      if (!courseSlug) throw new Error(isAr ? 'اختر الدورة أولاً' : 'Please select a course first');
      const selected = publishedCourses.find((c) => c.slug === courseSlug);
      const paid = selected?.price != null && selected.price > 0;
      if (paid) {
        const session = await api<{ checkoutUrl: string }>('/payments/create-session', {
          method: 'POST',
          body: JSON.stringify({ courseIdOrSlug: courseSlug, answers, locale }),
        });
        if (!session.checkoutUrl) throw new Error(isAr ? 'تعذر بدء الدفع' : 'Unable to start checkout');
        window.location.href = session.checkoutUrl;
        return session;
      }
      return api(`/courses/${courseSlug}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },
    onSuccess: (result) => {
      if (result && typeof result === 'object' && 'checkoutUrl' in result) return;
      setAnswers({});
    },
  });

  const copy = isAr
    ? {
        badge: 'أكاديمية طب الأسنان الرقمي',
        explore: 'استكشف الدورات',
        contact: 'تواصل معنا',
        trust: ['دورات معتمدة', 'تدريب عملي', 'دعم تقني', 'مختبر حديث'],
        pathTitle: 'اختر مسارك',
        pathBody: 'برامج واضحة للمستويات من الطلاب حتى المتقدمين.',
        disciplinesLabel: 'التخصصات الأساسية',
        disciplinesTitle: 'من التصميم الرقمي إلى النتيجة النهائية',
        coursesLabel: 'دورات مختارة',
        learnMore: 'اعرف المزيد',
        whyTitle: 'لماذا DentaCollab؟',
        aboutTitle: 'رؤية عملية للتدريب الرقمي',
        aboutBody:
          'نربط المعرفة النظرية بالتطبيق السريري الحقيقي عبر منهج واضح، مدربين خبراء، ومختبرات رقمية حديثة.',
        benefitItems: ['مناهج عملية', 'مدربون خبراء', 'شهادات معتمدة', 'مجتمع مهني'],
        heroTitle: 'المنصة الأولى في العراق لتطوير مهاراتك في طب الأسنان الرقمي',
        heroBody: 'أكاديمية متخصصة في طب الأسنان الرقمي لتمكين الأطباء والمختبرات عبر تدريب عملي ومنهج احترافي.',
        instructorLabel: 'المدرب الرئيسي',
        stories: 'الخريجون',
        viewAll: 'عرض الكل',
        reserveTitle: 'احجز مقعدك الآن',
        reserveBody: 'املأ بياناتك واختر الدورة المناسبة، وسيتواصل معك فريق الأكاديمية خلال ساعات.',
        chooseCourse: 'اختر الدورة',
        send: 'إرسال الطلب',
        faqTitle: 'الأسئلة الشائعة',
        success: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.',
        heroStats: [['500+', 'متدرب وطبيب'], ['50+', 'خريج'], ['98%', 'رضا المتدربين']],
        noCourses: 'لا توجد دورات متاحة حالياً',
        noGraduates: 'لا يوجد خريجون معروضون حالياً',
      }
    : {
        badge: 'Digital Dentistry Training Center',
        explore: 'Explore Courses',
        contact: 'Contact Us',
        trust: ['Certified Courses', 'Hands-on Training', 'Tech Support', 'Modern Lab'],
        pathTitle: 'Choose Your Path',
        pathBody: 'Clear pathways from students to advanced digital clinicians.',
        disciplinesLabel: 'Core Disciplines',
        disciplinesTitle: 'From digital design to the final result',
        coursesLabel: 'Curated Courses',
        learnMore: 'Learn More',
        whyTitle: 'Why DentaCollab?',
        aboutTitle: 'A practical vision for digital training',
        aboutBody:
          'We connect clinical theory with real digital workflows through clear curricula, expert instructors, and modern labs.',
        benefitItems: ['Hands-on curricula', 'Expert instructors', 'Accredited certificates', 'Professional community'],
        heroTitle: "Iraq's leading platform for building your digital dentistry skills",
        heroBody:
          'A specialized academy empowering clinicians and labs through hands-on digital dentistry training.',
        instructorLabel: 'Lead Instructor',
        stories: 'Graduates',
        viewAll: 'View all',
        reserveTitle: 'Secure Your Spot',
        reserveBody: 'Fill in your details, pick a course, and our team will contact you shortly.',
        chooseCourse: 'Select a course',
        send: 'Submit Request',
        faqTitle: 'Frequently Asked Questions',
        success: 'Your request was submitted successfully. We will contact you soon.',
        heroStats: [['500+', 'Doctors trained'], ['50+', 'Graduates'], ['98%', 'Learner satisfaction']],
        noCourses: 'No courses available right now',
        noGraduates: 'No graduates to show yet',
      };

  return (
    <div className="bg-[#f7fafc] text-[#0f1b33] transition-colors dark:bg-[#040b18] dark:text-[#eaf4ff]">
      <Helmet>
        <title>{isAr ? 'DentaCollab | أكاديمية طب الأسنان الرقمي' : 'DentaCollab | Digital Dentistry Academy'}</title>
        <meta name="description" content={copy.heroBody} />
      </Helmet>

      <section className="relative min-h-[520px] overflow-hidden bg-white dark:bg-[#06101f] md:min-h-[680px]">
        <img
          src={MEDIA.hero}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover ${isAr ? '-scale-x-100' : ''} dark:opacity-45`}
        />
        <div
          className={`absolute inset-0 ${
            isAr
              ? 'bg-gradient-to-l from-white via-white/95 via-45% to-white/5 dark:from-[#040b18] dark:via-[#040b18]/95 dark:to-transparent'
              : 'bg-gradient-to-r from-white via-white/95 via-45% to-white/5 dark:from-[#040b18] dark:via-[#040b18]/95 dark:to-transparent'
          }`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_70%,rgba(255,255,255,.95))] dark:bg-[linear-gradient(to_bottom,transparent_65%,#06101f)]" />
        <div className="dc-container relative z-10 flex min-h-[520px] items-center py-10 md:min-h-[680px] md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="dc-hero-content max-w-2xl"
          >
            <div className="dc-brand-lockup dc-hero-brand mb-4 md:mb-7" aria-label="DentaCollab">
              <span className="dc-logo-mark"><img src="/logo.png" alt="" /></span>
              <span className="dc-wordmark"><span><strong>DENTA</strong>COLLAB</span><small>Digital Dentistry Academy</small></span>
            </div>
            <span className="inline-flex rounded-full border border-[#cceef4] bg-[#eefbfe] px-4 py-2 text-xs font-bold text-[#1789a2] dark:border-[#1f3658] dark:bg-[#0b2850] dark:text-[#42d7ff]">
              {copy.badge}
            </span>
            <h1 className="mt-4 text-2xl font-black leading-[1.2] tracking-[-0.03em] text-[#101c38] sm:text-3xl md:mt-6 md:text-5xl dark:text-white">
              {copy.heroTitle}
            </h1>
            <p className="mt-3 text-xl font-semibold text-[#1fb6d1] md:text-3xl">
              {isAr ? 'صمّم. خطّط. نفّذ.' : 'Design. Plan. Deliver.'}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:mt-5 md:text-base md:leading-8 dark:text-slate-400">
              {copy.heroBody}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link
                to="/courses"
                className="dc-primary-link rounded-full bg-[#101c38] px-6 py-3 text-sm font-bold shadow-lg shadow-[#101c38]/20 transition hover:bg-[#1fb6d1] md:px-7 md:py-3.5"
              >
                {copy.explore}
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-[#101c38] transition hover:border-[#1fb6d1] hover:text-[#1fb6d1] dark:border-[#1f3658] dark:bg-transparent dark:text-white md:px-7 md:py-3.5"
              >
                {copy.contact}
              </Link>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-t border-slate-200 pt-5 dark:border-[#19314f] sm:gap-4 md:mt-9 md:pt-6">
              {copy.heroStats.map(([value, label]) => (
                <div key={label} className="min-w-0">
                  <strong className="block text-base font-black text-[#101c38] sm:text-xl md:text-2xl dark:text-white">{value}</strong>
                  <span className="mt-1 block text-[11px] font-semibold leading-snug text-slate-500 sm:text-xs dark:text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="explore-3d" className="relative overflow-hidden bg-white py-14 dark:bg-[#06101f] sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(31,182,209,.12),transparent_36%)]" />
        <div className="dc-container relative">
          <div className="mb-8 max-w-2xl text-start">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">
              {isAr ? 'تجربة تفاعلية' : 'Interactive lab'}
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#101c38] sm:text-3xl md:text-4xl dark:text-white">
              {isAr ? 'استكشف طب الأسنان الرقمي' : 'Explore Digital Dentistry'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              {isAr
                ? 'اختر: طقم أسنان كامل، قوس أسنان، أو زرعة — موديلات حقيقية قابلة للتدوير والتكبير.'
                : 'Choose a full denture, a dental arch, or an implant — real models you can orbit and zoom.'}
            </p>
          </div>
          <div className="relative h-[520px] sm:h-[600px] lg:h-[680px]">
            <Suspense
              fallback={
                <div
                  className="grid h-full place-items-center rounded-[1.6rem] border border-slate-200 bg-[radial-gradient(circle_at_center,rgba(31,182,209,.12),transparent_40%),linear-gradient(160deg,#f8fcfd,#e8f1f6)] dark:border-[#19314f] dark:bg-[radial-gradient(circle_at_center,rgba(31,182,209,.14),transparent_40%),linear-gradient(160deg,#071426,#040b18)]"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center px-6">
                    <div className="relative grid h-20 w-20 place-items-center">
                      <span className="absolute inset-0 animate-ping rounded-full border border-[#1fb6d1]/25" />
                      <div className="relative z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/80 bg-white p-1.5 shadow-md dark:border-[#19314f] dark:bg-[#081426]">
                        <img src="/logo.png" alt="" className="h-full w-full object-contain" />
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-black tracking-[.14em] text-[#101c38] dark:text-white">
                      {isAr ? 'جاري تجهيز التجربة' : 'Preparing experience'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {isAr ? 'تحميل الموديل ثلاثي الأبعاد...' : 'Loading 3D model...'}
                    </p>
                    <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-[#1fb6d1]" />
                    </div>
                  </div>
                </div>
              }
            >
              <DentalHeroScene isAr={isAr} className="h-full" />
            </Suspense>
          </div>
        </div>
      </section>

      {publishedGraduates.length ? (
        <section className="relative z-20 -mt-6 mb-6 px-4 sm:-mt-10 sm:mb-10">
          <div className="dc-container">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_22px_55px_rgba(16,28,56,.1)] dark:border-[#1a2f4d] dark:bg-[#081426] dark:shadow-[0_22px_55px_rgba(0,0,0,.4)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_at_top,rgba(31,182,209,.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(66,215,255,.12),transparent_70%)]" />
              <div className="pointer-events-none absolute -end-16 top-8 h-40 w-40 rounded-full bg-[#1fb6d1]/10 blur-3xl" />

              <div className="relative space-y-6 p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#1fb6d1]">
                      {isAr ? 'خريجو الأكاديمية' : 'Academy graduates'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#101c38] sm:text-3xl dark:text-white">
                      {isAr ? 'قصص نجاح حقيقية من برامجنا' : 'Real success stories from our programs'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'أطباء وخريجون أكملوا التدريب وبدؤوا يطبّقون المسار الرقمي بثقة.'
                        : 'Doctors and graduates who finished training and now apply the digital workflow with confidence.'}
                    </p>
                  </div>
                  <Link
                    to="/graduates"
                    className="inline-flex items-center gap-2 rounded-full bg-[#1fb6d1] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1789a2] dark:bg-[#42d7ff] dark:text-[#040b18] dark:hover:bg-[#7be7ff]"
                  >
                    {copy.viewAll}
                    <span aria-hidden className="rtl:rotate-180">
                      →
                    </span>
                  </Link>
                </div>

                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {publishedGraduates.slice(0, 8).map((g, index) => {
                    const stars = Math.min(5, Math.max(1, g.rating ?? 5));
                    return (
                      <motion.article
                        key={g.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.18 + index * 0.05 }}
                        className="w-[min(78vw,17.75rem)] shrink-0 snap-start"
                      >
                        <div className="flex h-full flex-col rounded-[1.25rem] bg-[#f3f7fb] p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-[#e8f9fc] dark:bg-[#0b1a2e] dark:hover:bg-[#10243a]">
                          <div className="flex items-center gap-3">
                            {g.imageUrl ? (
                              <img
                                src={g.imageUrl}
                                alt=""
                                className="h-14 w-14 rounded-full object-cover ring-2 ring-white dark:ring-[#1a2f4d]"
                              />
                            ) : (
                              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#1fb6d1]/15 text-lg font-black text-[#1789a2] ring-2 ring-white dark:bg-[#42d7ff]/15 dark:text-[#7be7ff] dark:ring-[#1a2f4d]">
                                {g.fullName.replace(/^د\.?\s*/u, '').charAt(0)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black text-[#101c38] dark:text-white">{g.fullName}</h3>
                              <p className="mt-1 flex items-center gap-0.5 text-[11px] font-bold text-[#1fb6d1]" aria-label={`${stars}/5`}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < stars ? 'opacity-100' : 'opacity-25'}>
                                    ★
                                  </span>
                                ))}
                              </p>
                            </div>
                          </div>

                          {g.courseTitle ? (
                            <p className="mt-4 line-clamp-2 text-[11px] font-semibold leading-5 text-[#1789a2] dark:text-[#7be7ff]">
                              {g.courseTitle}
                            </p>
                          ) : null}

                          {g.description ? (
                            <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {g.description}
                            </p>
                          ) : null}

                          <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:border-[#19314f]">
                            <span>{isAr ? 'خريج الأكاديمية' : 'Academy graduate'}</span>
                            <span className="text-[#1fb6d1]">
                              {new Date(g.graduationDate).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ) : featuredWorkshop.data ? (
        <section className="relative z-20 -mt-5 mb-2 px-4 sm:-mt-8 sm:mb-4 sm:px-6">
          <div className="dc-container">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <Link
                to={`/workshops/${featuredWorkshop.data.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#101c38] shadow-[0_18px_50px_rgba(16,28,56,.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(16,28,56,.34)] sm:flex-row sm:items-stretch"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(31,182,209,.22),transparent_42%)]" />
                <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-3 p-5 sm:p-6 md:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1fb6d1]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#1fb6d1]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1fb6d1] opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1fb6d1]" />
                      </span>
                      {isAr ? 'حدث قادم' : 'Upcoming event'}
                    </span>
                    <span className="text-[11px] font-semibold text-white/55">
                      {new Date(featuredWorkshop.data.startsAt).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {featuredWorkshop.data.presenter ? (
                      <span className="text-[11px] font-semibold text-white/45">
                        · {isAr ? 'المقدّم' : 'Presenter'}: {featuredWorkshop.data.presenter}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
                    {featuredWorkshop.data.title}
                  </h2>
                  <p className="line-clamp-2 max-w-xl text-sm leading-6 text-white/65">
                    {featuredWorkshop.data.description ||
                      (isAr ? 'سجّل اهتمامك قبل امتلاء المقاعد.' : 'Reserve interest before seats fill up.')}
                  </p>
                  <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition group-hover:bg-[#1fb6d1] group-hover:text-[#101c38]">
                    {isAr ? 'تفاصيل الحدث' : 'Event details'}
                    <span aria-hidden className="transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
                <div className="relative h-36 shrink-0 overflow-hidden sm:h-auto sm:w-[38%] sm:max-w-sm">
                  <img
                    src={courseCover(featuredWorkshop.data.coverUrl, 2)}
                    alt={featuredWorkshop.data.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101c38]/50 to-transparent sm:bg-gradient-to-l sm:from-transparent sm:to-[#101c38]/35 rtl:sm:bg-gradient-to-r" />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-slate-200 bg-[#f8fafc] py-8 dark:border-[#172b48] dark:bg-[#06101f]">
        <div className="dc-container">
          <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(16,28,56,.08)] dark:border-[#19314f] dark:bg-[#081426]">
            <div className="grid lg:grid-cols-[1.05fr_3.4fr_1.2fr]">
              <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#1fb6d1]">
                  {isAr ? 'من التصميم إلى الواقع' : 'From design to reality'}
                </p>
                <h2 className="mt-2 text-xl font-black leading-tight text-[#101c38] sm:text-2xl dark:text-white">
                  {isAr ? 'نطبع ما تصممه' : 'Print What You Design'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'تعلّم سير العمل الرقمي الكامل من التصميم على Exocad وحتى الطباعة والنتيجة النهائية.'
                    : 'Master the complete digital workflow, from Exocad design to printing and the final result.'}
                </p>
              </div>

              <div className="grid grid-cols-1 border-y border-slate-100 sm:grid-cols-2 md:grid-cols-4 lg:border-x lg:border-y-0 dark:border-[#19314f]">
                {[
                  {
                    number: '1',
                    title: isAr ? 'التصميم الرقمي' : 'Digital Design',
                    body: isAr ? 'التصميم داخل Exocad' : 'Designing in exocad',
                    image: '/step-1.jpg',
                  },
                  {
                    number: '2',
                    title: isAr ? 'تصدير ملف STL' : 'Export STL File',
                    body: isAr ? 'تصدير التصميم كملف STL' : 'Export the design as STL file',
                    image: '/step-2.jpg',
                  },
                  {
                    number: '3',
                    title: isAr ? 'الطباعة ثلاثية الأبعاد' : '3D Printing',
                    body: isAr ? 'طباعة النموذج' : 'Printing the model',
                    image: '/step-3.jpg',
                  },
                  {
                    number: '4',
                    title: isAr ? 'النتيجة النهائية' : 'Final Result',
                    body: isAr ? 'نموذج مطبوع بدقة عالية' : 'High-precision 3D printed model',
                    image: '/step-4.jpg',
                  },
                ].map((step, index) => (
                  <article
                    key={step.number}
                    className="group relative flex gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:block sm:min-h-52 sm:border-b-0 sm:border-e sm:p-3 sm:text-center sm:last:border-e-0 dark:border-[#19314f]"
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#111] sm:h-32 sm:w-full">
                      <img
                        src={step.image}
                        alt={step.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    {index < 3 ? (
                      <span className="absolute -end-2.5 top-[4.25rem] z-10 hidden h-6 w-6 place-items-center rounded-full bg-white text-lg font-black text-[#1664c0] shadow-md md:grid dark:bg-[#101c38] dark:text-[#42d7ff]">
                        {isAr ? '‹' : '›'}
                      </span>
                    ) : null}
                    <div className="mt-0 flex min-w-0 items-start gap-2 text-start sm:mt-3 sm:justify-center">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1664c0] text-[11px] font-black text-white">
                        {step.number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#101c38] dark:text-white">{step.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[#071b3d] p-6 text-white lg:min-h-0">
                <div className="absolute inset-0">
                  <img
                    src="/steps.jpg"
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-center opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04101c] via-[#04101c]/55 to-[#04101c]/25" />
                </div>
                <div className="relative z-10">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#42d7ff]">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-[#42d7ff]">✓</span>
                    {isAr ? 'تجربة عملية متكاملة' : 'Hands-on experience'}
                  </p>
                  <p className="mt-5 max-w-52 text-sm font-semibold leading-7">
                    {isAr
                      ? 'لن تتعلم بالمشاهدة فقط، بل ستتدرب وتطبع كل خطوة بنفسك.'
                      : 'You will practice, design and print every step yourself.'}
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="relative z-10 mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/45 px-4 py-2 text-[11px] font-bold transition hover:bg-white hover:text-[#101c38]"
                >
                  {isAr ? 'استكشف الدورات' : 'Explore courses'}
                  <span>◉</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-[#06101f] sm:py-20">
        <div className="dc-container">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.disciplinesLabel}</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white sm:text-3xl md:text-4xl">
              {copy.disciplinesTitle}
            </h2>
          </div>
          <div className="grid gap-4 md:min-h-[520px] md:grid-cols-[1.15fr_.85fr] md:grid-rows-2">
            {[
              {
                title: isAr ? 'التصميم الرقمي' : 'Digital Design',
                body: isAr
                  ? 'تصميم التركيبات والابتسامة عبر Exocad بمسار عملي واضح.'
                  : 'Design restorations and smiles through a practical Exocad workflow.',
                image: '/smale.jpg',
                // Focus bridge / teeth model; crop exocad UI chrome
                imageClass: 'scale-[1.5] object-[55%_48%]',
                className: 'md:row-span-2',
                featured: true,
                badge: 'Exocad' as string | null,
              },
              {
                title: isAr ? 'تخطيط الزرعات' : 'Implant Planning',
                body: isAr ? 'تخطيط دقيق وموجّه للحالات الجراحية.' : 'Precise, guided planning for surgical cases.',
                image: '/exoplan.jpg',
                // Focus CBCT + implant; crop exoplan UI chrome
                imageClass: 'scale-[1.55] object-[58%_48%]',
                className: '',
                featured: false,
                badge: 'Exoplan' as string | null,
              },
              {
                title: isAr ? 'الطباعة ثلاثية الأبعاد' : '3D Printing',
                body: isAr ? 'من الملف الرقمي إلى نموذج جاهز للاستخدام.' : 'From a digital file to a production-ready model.',
                image: '/printer.jpg',
                imageClass: 'object-[50%_45%]',
                className: '',
                featured: false,
                badge: 'Formlabs' as string | null,
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`group relative min-h-[250px] overflow-hidden rounded-[1.6rem] bg-[#101c38] ring-1 ring-black/5 ${item.className}`}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 transition duration-700 group-hover:scale-[1.04]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`h-full w-full object-cover ${item.imageClass}`}
                    />
                  </div>
                </div>
                <div
                  className={`absolute inset-0 ${
                    item.badge
                      ? 'bg-[linear-gradient(180deg,rgba(7,19,41,.15)_0%,rgba(7,19,41,.35)_42%,rgba(7,19,41,.92)_78%,rgba(7,19,41,.98)_100%)]'
                      : 'bg-gradient-to-t from-[#071329]/95 via-[#071329]/25 to-transparent'
                  }`}
                />
                {item.badge ? (
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                  {item.badge ? (
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#7be7ff] backdrop-blur-sm">
                      {item.badge}
                    </span>
                  ) : (
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7be7ff]">{copy.disciplinesLabel}</p>
                  )}
                  <h3 className="mt-2 text-2xl font-black">{item.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-200">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="dc-container">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.coursesLabel}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white md:text-4xl">
              {isAr ? 'مسارات واضحة لكل مستوى' : 'Clear pathways for every level'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{copy.pathBody}</p>
          </div>
        </div>
        {publishedCourses.length ? (
          <div
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] pb-4 pe-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {publishedCourses.map((course, idx) => (
              <article
                key={course.id}
                className="w-[min(86vw,22rem)] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(16,28,56,.06)] dark:border-[#19314f] dark:bg-[#081426] sm:w-[22rem]"
              >
                <img
                  src={courseCover(course.coverUrl, idx)}
                  alt={course.title}
                  className="h-48 w-full object-cover object-center transition duration-500 hover:scale-[1.02]"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold leading-7 text-[#101c38] dark:text-white">{course.title}</h3>
                    <span className="shrink-0 rounded-full bg-[#e8f9fc] px-3 py-1 text-xs font-bold text-[#1789a2] dark:bg-[#0b2850] dark:text-[#42d7ff]">
                      {levelLabel[locale][course.level] || course.level}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{course.duration}</p>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{course.description}</p>
                  {course.price != null ? (
                    <p className="mt-3 text-lg font-black text-[#101c38] dark:text-white">
                      {course.price.toLocaleString(isAr ? 'ar-IQ' : 'en-US')}{' '}
                      {course.currency === 'USD' ? (isAr ? '$' : 'USD') : isAr ? 'د.ع' : 'IQD'}
                    </p>
                  ) : null}
                  <div className="mt-5 grid gap-2">
                    {(course.objectives || []).slice(0, 2).map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1fb6d1]" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <Link to={`/courses/${course.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1fb6d1]">
                    {copy.learnMore} <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dc-container text-center text-sm text-slate-500">{copy.noCourses}</p>
        )}
      </section>

      <section className="bg-white py-20 dark:bg-[#06101f]">
        <div className="dc-container grid gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.whyTitle}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white md:text-4xl">
              {copy.aboutTitle}
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600 dark:text-slate-400">
              {copy.aboutBody}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {copy.benefitItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#f7fafc] p-4 dark:border-[#19314f] dark:bg-[#081426]">
                  <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[#1fb6d1] text-[11px] text-white">✓</span>
                  <span className="text-sm font-semibold text-[#101c38] dark:text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-[#f7fafc] p-6 shadow-sm dark:border-[#19314f] dark:bg-[#081426] md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-[#101c38] dark:text-white">
                {isAr ? 'محتوى الدورة' : 'Curriculum'}
              </h3>
              <span className="rounded-full bg-[#e8f9fc] px-3 py-1 text-[11px] font-bold text-[#1789a2] dark:bg-[#0b2850] dark:text-[#42d7ff]">
                {featured?.duration || (isAr ? '4 أسابيع' : '4 weeks')}
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-[#19314f]">
              {(featured?.curriculum || []).slice(0, 4).map((module, index) => (
                <details key={module.title} className="group py-4" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[#101c38] dark:text-white">
                    <span>
                      {String(index + 1).padStart(2, '0')}. {module.title}
                    </span>
                    <span className="text-[#1fb6d1] transition group-open:rotate-45">＋</span>
                  </summary>
                  <ul className="mt-3 grid gap-2 ps-5">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.title} className="flex justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>◉ {lesson.title}</span>
                        <span>{lesson.duration}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#101c38] py-12 text-white sm:py-20">
        <div className="dc-container grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] border border-[#1fb6d1]/35" />
            <img
              src={instructor?.imageUrl || '/dr-ammar.png'}
              alt={instructor?.name || 'Instructor'}
              className="relative aspect-[4/4.5] w-full rounded-[1.5rem] object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7be7ff]">{copy.instructorLabel}</p>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-5xl">
              {instructor?.name || (isAr ? 'خبراء طب الأسنان الرقمي' : 'Digital Dentistry Experts')}
            </h2>
            <p className="mt-3 text-lg text-[#1fb6d1]">{instructor?.title}</p>
            <p className="mt-6 max-w-2xl leading-8 text-slate-300">
              {instructor?.biography ||
                (isAr
                  ? 'خبرة أكاديمية وسريرية تمنحك فهماً عميقاً وتقنيات قابلة للتطبيق من أول يوم.'
                  : 'Academic and clinical expertise that turns digital concepts into confident daily practice.')}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-7 sm:gap-5">
              {(isAr
                ? [
                    ['10+', 'سنوات خبرة'],
                    ['500+', 'متدرب'],
                    ['12k+', 'ساعة تدريب'],
                  ]
                : [
                    ['10+', 'Years Experience'],
                    ['500+', 'Students'],
                    ['12k+', 'Training Hours'],
                  ]
              ).map(([value, label]) => (
                <div key={label} className="min-w-0">
                  <p className="text-lg font-bold sm:text-2xl">{value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400 sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reserve" className="bg-white py-14 dark:bg-[#06101f] sm:py-20 md:py-24">
        <div className="dc-container">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-[#f7fafc] p-5 shadow-[0_24px_70px_rgba(16,28,56,.08)] dark:border-[#19314f] dark:bg-[#081426] sm:p-7 md:p-10">
            <div className="text-center">
              <div className="dc-brand-lockup mx-auto mb-5 w-fit" aria-label="DentaCollab">
                <span className="dc-logo-mark"><img src="/logo.png" alt="" /></span>
                <span className="dc-wordmark"><span><strong>DENTA</strong>COLLAB</span><small>Digital Dentistry Academy</small></span>
              </div>
              <h2 className="text-2xl font-black text-[#101c38] sm:text-3xl dark:text-white">{copy.reserveTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{copy.reserveBody}</p>
            </div>
            {registration.isSuccess ? (
              <div className="mt-8 rounded-2xl bg-[#e8f9fc] p-6 text-center font-bold text-[#1789a2] dark:bg-[#0b2850] dark:text-[#42d7ff]">
                {copy.success}
              </div>
            ) : (
              <form
                className="mt-8 grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  registration.mutate();
                }}
              >
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.chooseCourse}</span>
                  <select
                    className={fieldClass}
                    required
                    disabled={!publishedCourses.length}
                    value={courseSlug}
                    onChange={(e) => setCourseSlug(e.target.value)}
                  >
                    {!publishedCourses.length ? (
                      <option value="">{copy.noCourses}</option>
                    ) : (
                      publishedCourses.map((course) => (
                        <option key={course.id} value={course.slug}>
                          {course.title}
                          {course.level ? ` — ${levelLabel[locale][course.level] || course.level}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <DynamicCourseRegistrationFields
                  courseIdOrSlug={courseSlug}
                  isAr={isAr}
                  values={answers}
                  onChange={setAnswers}
                  className={fieldClass}
                />
                {registration.isError ? (
                  <p className="text-center text-sm text-red-600 sm:col-span-2">{(registration.error as Error).message}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={registration.isPending || !publishedCourses.length}
                  className="rounded-full bg-[#101c38] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#1fb6d1] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                >
                  {registration.isPending ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : copy.send}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fafc] py-20 dark:bg-[#040b18]">
        <div className="dc-container max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.faqTitle}</p>
            <h2 className="mt-3 text-3xl font-black text-[#101c38] dark:text-white">
              {isAr ? 'إجابات واضحة قبل التسجيل' : 'Clear answers before you enroll'}
            </h2>
          </div>
          <div className="divide-y divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-white px-5 dark:divide-[#19314f] dark:border-[#19314f] dark:bg-[#081426]">
            {(faq.data || []).slice(0, 6).map((item) => (
              <details key={item.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#101c38] dark:text-white">
                  {item.question}
                  <span className="text-[#1fb6d1] transition group-open:rotate-45">＋</span>
                </summary>
                <p className="pt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
