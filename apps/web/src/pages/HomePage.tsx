import { Helmet } from 'react-helmet-async';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
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
type Testimonial = { id: string; name: string; profession: string; rating: number; review: string; imageUrl?: string };
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
  const testimonials = useQuery({
    queryKey: ['testimonials', locale],
    queryFn: () => api<Testimonial[]>('/testimonials'),
  });
  const featuredWorkshop = useQuery({
    queryKey: ['workshop-featured', locale],
    queryFn: () => api<Workshop | null>(`/calendar/featured?locale=${locale}`),
  });
  const featured = courses.data?.[0];
  const publishedCourses = courses.data ?? [];
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
    mutationFn: () => {
      if (!courseSlug) throw new Error(isAr ? 'اختر الدورة أولاً' : 'Please select a course first');
      return api(`/courses/${courseSlug}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },
    onSuccess: () => setAnswers({}),
  });

  const gallery =
    featured?.gallery?.length
      ? featured.gallery.slice(0, 3)
      : [
          { url: '/dentacollab-hero.png', alt: 'Clinical result' },
          { url: '/dentacollab-hero.png', alt: 'Digital design' },
          { url: '/dentacollab-hero.png', alt: 'Digital lab' },
        ];

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
        testimonialsLabel: 'آراء المتدربين',
        testimonialsTitle: 'ما يقوله الأطباء بعد التدريب',
        learnMore: 'اعرف المزيد',
        whyTitle: 'لماذا DentaCollab؟',
        aboutTitle: 'رؤية عملية للتدريب الرقمي',
        aboutBody:
          'نربط المعرفة النظرية بالتطبيق السريري الحقيقي عبر منهج واضح، مدربين خبراء، ومختبرات رقمية حديثة.',
        benefitItems: ['مناهج عملية', 'مدربون خبراء', 'شهادات معتمدة', 'مجتمع مهني'],
        heroTitle: 'أتقن طب الأسنان الرقمي',
        heroBody: 'أكاديمية متخصصة في طب الأسنان الرقمي لتمكين الأطباء والمختبرات عبر تدريب عملي ومنهج احترافي.',
        instructorLabel: 'المدرب الرئيسي',
        stories: 'نجاحات المتدربين',
        viewAll: 'عرض الكل',
        reserveTitle: 'احجز مقعدك الآن',
        reserveBody: 'املأ بياناتك واختر الدورة المناسبة، وسيتواصل معك فريق الأكاديمية خلال ساعات.',
        chooseCourse: 'اختر الدورة',
        send: 'إرسال الطلب',
        faqTitle: 'الأسئلة الشائعة',
        success: 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.',
        heroStats: [['500+', 'متدرب وطبيب'], ['15+', 'ورشة متخصصة'], ['98%', 'رضا المتدربين']],
        noCourses: 'لا توجد دورات متاحة حالياً',
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
        testimonialsLabel: 'Trainee Feedback',
        testimonialsTitle: 'What doctors say after training',
        learnMore: 'Learn More',
        whyTitle: 'Why DentaCollab?',
        aboutTitle: 'A practical vision for digital training',
        aboutBody:
          'We connect clinical theory with real digital workflows through clear curricula, expert instructors, and modern labs.',
        benefitItems: ['Hands-on curricula', 'Expert instructors', 'Accredited certificates', 'Professional community'],
        heroTitle: 'Master Digital Dentistry',
        heroBody:
          'A specialized academy empowering clinicians and labs through hands-on digital dentistry training.',
        instructorLabel: 'Lead Instructor',
        stories: 'Student Success',
        viewAll: 'View all',
        reserveTitle: 'Secure Your Spot',
        reserveBody: 'Fill in your details, pick a course, and our team will contact you shortly.',
        chooseCourse: 'Select a course',
        send: 'Submit Request',
        faqTitle: 'Frequently Asked Questions',
        success: 'Your request was submitted successfully. We will contact you soon.',
        heroStats: [['500+', 'Doctors trained'], ['15+', 'Specialist workshops'], ['98%', 'Learner satisfaction']],
        noCourses: 'No courses available right now',
      };

  return (
    <div className="bg-[#f7fafc] text-[#0f1b33] transition-colors dark:bg-[#040b18] dark:text-[#eaf4ff]">
      <Helmet>
        <title>{isAr ? 'DentaCollab | أكاديمية طب الأسنان الرقمي' : 'DentaCollab | Digital Dentistry Academy'}</title>
        <meta name="description" content={copy.heroBody} />
      </Helmet>

      <section className="relative min-h-[520px] overflow-hidden bg-white dark:bg-[#06101f] md:min-h-[680px]">
        <img
          src="/dentacollab-hero.png"
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
            <h1 className="mt-4 text-3xl font-black leading-[1.12] tracking-[-0.04em] text-[#101c38] sm:text-4xl md:mt-6 md:text-6xl dark:text-white">
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

      {featuredWorkshop.data ? (
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
                    src={featuredWorkshop.data.coverUrl || '/dentacollab-hero.png'}
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
                    title: isAr ? 'التصميم على Exocad' : 'Design on Exocad',
                    body: isAr ? 'تصميم الحالة بدقة عالية' : 'Design with precision',
                    image: '/dentacollab-hero.png',
                  },
                  {
                    number: '2',
                    title: isAr ? 'تصدير ملف STL' : 'Export STL File',
                    body: isAr ? 'تهيئة الملف للطباعة' : 'Prepare for printing',
                    image: '/dentacollab-hero.png',
                  },
                  {
                    number: '3',
                    title: isAr ? 'الطباعة ثلاثية الأبعاد' : '3D Printing',
                    body: isAr ? 'طباعة دقيقة وعالية الجودة' : 'High-quality printing',
                    image: '/dentacollab-hero.png',
                  },
                  {
                    number: '4',
                    title: isAr ? 'النتيجة النهائية' : 'Final Result',
                    body: isAr ? 'تقييم عملك واستخدامه' : 'Evaluate and use it',
                    image: '/dentacollab-hero.png',
                  },
                ].map((step, index) => (
                  <article
                    key={step.number}
                    className="group relative flex gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:block sm:min-h-52 sm:border-b-0 sm:border-e sm:p-3 sm:text-center sm:last:border-e-0 dark:border-[#19314f]"
                  >
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f2f5fa] sm:h-28 sm:w-full">
                      <img
                        src={step.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    {index < 3 ? (
                      <span className="absolute -end-2.5 top-16 z-10 hidden h-6 w-6 place-items-center rounded-full bg-white text-lg font-black text-[#1664c0] shadow-md md:grid dark:bg-[#101c38] dark:text-[#42d7ff]">
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
                <div className="absolute inset-0 opacity-30">
                  <img
                    src="/dentacollab-hero.png"
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
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
                body: isAr ? 'تصميم التركيبات والابتسامة عبر Exocad بمسار عملي واضح.' : 'Design restorations and smiles through a practical Exocad workflow.',
                image: '/dentacollab-hero.png',
                className: 'md:row-span-2',
              },
              {
                title: isAr ? 'تخطيط الزرعات' : 'Implant Planning',
                body: isAr ? 'تخطيط دقيق وموجّه للحالات الجراحية.' : 'Precise, guided planning for surgical cases.',
                image: featured?.coverUrl || '/dentacollab-hero.png',
                className: '',
              },
              {
                title: isAr ? 'الطباعة ثلاثية الأبعاد' : '3D Printing',
                body: isAr ? 'من الملف الرقمي إلى نموذج جاهز للاستخدام.' : 'From a digital file to a production-ready model.',
                image: '/dentacollab-hero.png',
                className: '',
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`group relative min-h-[250px] overflow-hidden rounded-[1.6rem] bg-[#101c38] ${item.className}`}
              >
                <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071329]/95 via-[#071329]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7be7ff]">{copy.disciplinesLabel}</p>
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
            {publishedCourses.map((course) => (
              <article
                key={course.id}
                className="w-[min(86vw,22rem)] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(16,28,56,.06)] dark:border-[#19314f] dark:bg-[#081426] sm:w-[22rem]"
              >
                <img
                  src={course.coverUrl || '/dentacollab-hero.png'}
                  alt={course.title}
                  className="h-48 w-full object-cover transition duration-500 hover:scale-[1.02]"
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

      <section className="bg-[#eef3f7] py-20 dark:bg-[#040b18]">
        <div className="dc-container">
          <div className="mb-9 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.stories}</p>
              <h2 className="mt-3 text-3xl font-black text-[#101c38] dark:text-white">
                {isAr ? 'نتائج حقيقية من داخل الأكاديمية' : 'Real outcomes from the academy'}
              </h2>
            </div>
            <Link to="/gallery" className="hidden text-sm font-bold text-[#1fb6d1] sm:block">
              {copy.viewAll} →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.map((item, index) => (
              <figure
                key={`${item.url}-${index}`}
                className="group overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-sm dark:border-[#19314f] dark:bg-[#081426]"
              >
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <figcaption className="p-4">
                  <p className="font-bold text-[#101c38] dark:text-white">
                    {isAr ? `مشروع طالب ${index + 1}` : `Student Project ${index + 1}`}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 dark:border-[#172b48] dark:bg-[#06101f]">
        <div className="dc-container">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.testimonialsLabel}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] md:text-4xl dark:text-white">
                {copy.testimonialsTitle}
              </h2>
              <span className="mt-4 block h-1 w-10 rounded-full bg-[#1fb6d1]" />
            </div>
            <Link to="/testimonials" className="text-sm font-bold text-[#1fb6d1]">
              {copy.viewAll} →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ...(testimonials.data || []),
              {
                id: 'fallback-1',
                name: isAr ? 'د. سارة محمد' : 'Dr. Sarah Mohammed',
                profession: isAr ? 'طبيبة أسنان' : 'Dentist',
                rating: 5,
                imageUrl: undefined,
                review: isAr
                  ? 'المحتوى العملي غيّر طريقة تعاملي مع الحالات الرقمية ومنحني ثقة حقيقية.'
                  : 'The practical content transformed how I approach digital cases and gave me real confidence.',
              },
              {
                id: 'fallback-2',
                name: isAr ? 'د. علي كريم' : 'Dr. Ali Kareem',
                profession: isAr ? 'طبيب أسنان تجميلي' : 'Cosmetic Dentist',
                rating: 5,
                imageUrl: undefined,
                review: isAr
                  ? 'تجربة تدريبية منظمة، واضحة، ومتصلة مباشرة بالعمل السريري اليومي.'
                  : 'A focused, organized experience directly connected to everyday clinical work.',
              },
              {
                id: 'fallback-3',
                name: isAr ? 'د. نور الحسن' : 'Dr. Noor Al Hassan',
                profession: isAr ? 'طبيبة تركيبات' : 'Prosthodontist',
                rating: 5,
                imageUrl: undefined,
                review: isAr
                  ? 'أفضل ما في البرنامج هو الجمع بين التفكير السريري وإتقان الأدوات الرقمية.'
                  : 'The strongest part of the program is how it connects clinical thinking with digital tools.',
              },
            ]
              .slice(0, 3)
              .map((item) => (
                <blockquote
                  key={item.id}
                  className="flex min-h-[250px] flex-col rounded-[1.5rem] border border-slate-200 bg-[#f7fafc] p-6 shadow-[0_12px_40px_rgba(16,28,56,.06)] dark:border-[#19314f] dark:bg-[#081426]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-3xl font-black leading-none text-[#1fb6d1]/35">“</span>
                    <span className="text-xs font-bold tracking-wide text-[#1fb6d1]">{'★'.repeat(item.rating)}</span>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-8 text-slate-600 dark:text-slate-300">{item.review}</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5 dark:border-[#19314f]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#101c38] text-sm font-black text-white">
                        {item.name.charAt(0)}
                      </span>
                    )}
                    <div>
                      <cite className="block text-sm font-bold not-italic text-[#101c38] dark:text-white">{item.name}</cite>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.profession}</span>
                    </div>
                  </div>
                </blockquote>
              ))}
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
