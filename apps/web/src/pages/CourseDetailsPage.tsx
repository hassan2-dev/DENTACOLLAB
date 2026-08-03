import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { courseCover } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';
import { DynamicCourseRegistrationFields } from '../components/DynamicCourseRegistrationFields';

type Course = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  description: string;
  overview: string;
  objectives: string[];
  requirements: string[];
  duration: string;
  level: string;
  price?: number | null;
  currency?: string | null;
  certificate?: string;
  registrationFormUrl?: string;
  registrationStartsAt?: string | null;
  registrationEndsAt?: string | null;
  registrationClosedManually?: boolean;
  registrationState?: string;
  registrationLabel?: string;
  registrationCta?: string;
  registrationOpen?: boolean;
  gallery: { url: string; alt?: string }[];
  curriculum: {
    title: string;
    description?: string;
    outcomes?: string[];
    lessons: {
      title: string;
      description?: string;
      topics?: string[];
      format?: string;
      duration?: string;
    }[];
  }[];
  instructors: {
    instructor: {
      id: string;
      name: string;
      title: string;
      imageUrl?: string;
      biography?: string;
      experience?: string;
      certificates?: string[];
    };
  }[];
};

type Faq = { id: string; question: string; answer: string };

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

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1fb6d1] focus:ring-4 focus:ring-[#1fb6d1]/15 dark:border-[#1f3658] dark:bg-[#071426] dark:text-white dark:placeholder:text-slate-500';

export function CourseDetailsPage() {
  const { slug = '' } = useParams();
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', slug, locale],
    queryFn: () => api<Course>(`/courses/${slug}`),
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const faq = useQuery({
    queryKey: ['faq', locale],
    queryFn: () => api<Faq[]>('/faq'),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const courseData = course!;
      const paid = courseData.price != null && courseData.price > 0;
      if (paid) {
        const session = await api<{ checkoutUrl: string; paymentId: string }>(
          '/payments/create-session',
          {
            method: 'POST',
            body: JSON.stringify({
              courseIdOrSlug: slug,
              answers,
              locale,
            }),
          },
        );
        if (!session.checkoutUrl) throw new Error(isAr ? 'تعذر بدء الدفع' : 'Unable to start checkout');
        window.location.href = session.checkoutUrl;
        return session;
      }
      return api(`/courses/${slug}/registrations`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },
    onSuccess: (result) => {
      if (result && typeof result === 'object' && 'checkoutUrl' in result) return;
      setAnswers({});
    },
  });

  if (isLoading) {
    return <LogoLoader fullPage label={isAr ? 'جاري تجهيز تفاصيل الدورة' : 'Preparing course details'} />;
  }
  if (error || !course) {
    return <p className="dc-container py-12">{isAr ? 'لم يتم العثور على الدورة' : 'Course not found'}</p>;
  }

  const isPaidCourse = course.price != null && course.price > 0;
  const registrationOpen = course.registrationOpen !== false;
  const lessonCount = course.curriculum.reduce((total, module) => total + module.lessons.length, 0);
  const copy = isAr
    ? {
        badge: 'دورة احترافية في طب الأسنان الرقمي',
        register: 'سجّل في الدورة',
        curriculumCta: 'استعرض المنهج',
        duration: 'المدة',
        level: 'المستوى',
        certificate: 'الشهادة',
        price: 'السعر',
        certified: 'شهادة معتمدة',
        attendance: 'شهادة حضور',
        mode: 'نمط التدريب',
        modeValue: 'عملي وتفاعلي',
        contactForPrice: 'تواصل للسعر',
        about: 'عن الدورة',
        aboutTitle: 'طوّر مهاراتك في طب الأسنان الرقمي',
        content: 'محتوى الدورة',
        lessons: 'درس',
        modules: 'وحدات تدريبية',
        moduleOutcomes: 'مخرجات الوحدة',
        practicalFormat: 'نمط التدريب',
        requirements: 'المتطلبات الأساسية',
        learnWith: 'فريق التدريب',
        supervised: 'تعرّف على المدربين الذين يقودون هذا البرنامج',
        founder: 'المدرب',
        credentials: 'المؤهلات والخبرات',
        viewInstructor: 'عرض ملف المدرب ودوراته',
        instructorBio: 'خبرة عملية متخصصة في تقنيات طب الأسنان الرقمي، مع منهج تدريبي يربط المعرفة بالتطبيق السريري الحقيقي.',
        years: 'سنوات خبرة',
        trainees: 'متدرب',
        hours: 'ساعة تدريب',
        prep: 'ما توفره الأكاديمية',
        prepTitle: 'كل شيء جاهز لك',
        prepBody: 'ما تحتاج تجهّز شيء مسبقاً — الأكاديمية توفر لك كل ما تحتاجه للتدريب، بما فيه حساب رسمي معتمد من exocad.',
        prepItems: [
          ['▣', 'تجهيز كامل من الأكاديمية', 'الأجهزة والبيئة التدريبية جاهزة داخل القاعة'],
          ['⌁', 'البرامج مثبتة مسبقاً', 'ما تحتاج تحمّل أو تثبّت برامج بنفسك'],
          ['◇', 'حساب exocad رسمي معتمد', 'نوفّر لك حساباً رسمياً معتمداً من exocad خلال التدريب'],
          ['✓', 'أنت فقط سجّل واحضر', 'أكمل التسجيل، والباقي تتولاه الأكاديمية'],
        ] as const,
        start: 'ابدأ رحلتك',
        book: 'سجّل وادفع الآن',
        bookBody: 'املأ الاستمارة ثم أكمل الدفع عبر Stripe لتأكيد تسجيلك.',
        successMsg: 'تم استلام طلبك بنجاح. سنتواصل معك قريباً.',
        openForm: 'فتح الاستمارة في نافذة جديدة',
        formTitle: 'استمارة التسجيل',
        fields: [
          ['fullName', 'الاسم الكامل', 'text'],
          ['phone', 'رقم الهاتف', 'tel'],
          ['email', 'البريد الإلكتروني', 'email'],
          ['city', 'المدينة', 'text'],
          ['occupation', 'المهنة', 'text'],
          ['experience', 'سنوات الخبرة', 'text'],
        ] as const,
        notes: 'ملاحظات إضافية (اختياري)',
        required: 'هذا الحقل مطلوب',
        sending: 'جاري التحويل للدفع...',
        submit: 'تسجيل ودفع',
        submitFree: 'إرسال طلب التسجيل',
        closedTitle: 'التسجيل غير متاح حالياً',
        ask: 'لديك سؤال؟',
        faq: 'الأسئلة الشائعة',
      }
    : {
        badge: 'Professional digital dentistry course',
        register: 'Enroll now',
        curriculumCta: 'View curriculum',
        duration: 'Duration',
        level: 'Level',
        certificate: 'Certificate',
        price: 'Price',
        certified: 'Accredited certificate',
        attendance: 'Attendance certificate',
        mode: 'Training mode',
        modeValue: 'Practical & interactive',
        contactForPrice: 'Contact for price',
        about: 'About the course',
        aboutTitle: 'Level up your digital dentistry skills',
        content: 'Course content',
        lessons: 'lessons',
        modules: 'training modules',
        moduleOutcomes: 'Module outcomes',
        practicalFormat: 'Training format',
        requirements: 'Prerequisites',
        learnWith: 'Training team',
        supervised: 'Meet the trainers leading this program',
        founder: 'Instructor',
        credentials: 'Credentials & expertise',
        viewInstructor: 'View instructor profile & courses',
        instructorBio:
          'Hands-on expertise in digital dentistry techniques, with a training path that connects knowledge to real clinical application.',
        years: 'Years experience',
        trainees: 'Trainees',
        hours: 'Training hours',
        prep: 'What the academy provides',
        prepTitle: 'Everything is ready for you',
        prepBody: 'No prep needed — the academy provides everything for training, including an official certified exocad account.',
        prepItems: [
          ['▣', 'Fully prepared by the academy', 'Training devices and classroom environment are ready'],
          ['⌁', 'Software pre-installed', 'You don’t need to download or set up tools yourself'],
          ['◇', 'Official certified exocad account', 'We provide an official exocad-certified account during training'],
          ['✓', 'Just register and attend', 'Complete registration — the academy handles the rest'],
        ] as const,
        start: 'Start your journey',
        book: 'Register & Pay',
        bookBody: 'Fill the form then complete Stripe checkout to confirm your registration.',
        successMsg: 'Your request was received. We will contact you soon.',
        openForm: 'Open form in a new tab',
        formTitle: 'Registration form',
        fields: [
          ['fullName', 'Full name', 'text'],
          ['phone', 'Phone number', 'tel'],
          ['email', 'Email address', 'email'],
          ['city', 'City', 'text'],
          ['occupation', 'Occupation', 'text'],
          ['experience', 'Years of experience', 'text'],
        ] as const,
        notes: 'Additional notes (optional)',
        required: 'This field is required',
        sending: 'Redirecting to payment...',
        submit: 'Register & Pay',
        submitFree: 'Submit registration',
        closedTitle: 'Registration is currently unavailable',
        ask: 'Have a question?',
        faq: 'Frequently asked questions',
      };

  return (
    <div className="bg-white text-start text-[#101c38] transition-colors dark:bg-[#040b18] dark:text-[#eaf4ff]">
      <Helmet>
        <title>{course.title} | DentaCollab</title>
        <meta name="description" content={course.description} />
      </Helmet>

      <section className="relative min-h-[420px] overflow-hidden md:min-h-[650px]">
        <img
          src={courseCover(course.coverUrl)}
          alt={course.title}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className={`absolute inset-0 ${
            isAr
              ? 'bg-gradient-to-r from-[#101c38]/25 via-[#101c38]/65 to-[#101c38]/90'
              : 'bg-gradient-to-l from-[#101c38]/25 via-[#101c38]/65 to-[#101c38]/90'
          }`}
        />
        <div className="dc-container relative z-10 flex min-h-[420px] items-center py-12 md:min-h-[650px] md:py-20">
          <div className="ms-0 me-auto max-w-2xl text-start text-white">
            <span className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur md:mb-6">
              {copy.badge}
            </span>
            <h1 className="break-words text-3xl font-bold leading-[1.15] tracking-[-0.04em] sm:text-4xl md:text-6xl">{course.title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 md:mt-6 md:text-lg md:leading-8">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <a
                href="#registration"
                className="rounded-full bg-[#1fb6d1] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1fb6d1]/25 transition hover:-translate-y-0.5 hover:bg-[#18a3bc] md:px-7 md:py-3.5"
              >
                {copy.register}
              </a>
              <a
                href="#curriculum"
                className="rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 md:px-7 md:py-3.5"
              >
                {copy.curriculumCta}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white dark:border-[#172b48] dark:bg-[#06101f]">
        <div className="dc-container dc-inline-divide dc-inline-divide-four grid grid-cols-2 py-5 md:grid-cols-4 md:py-7">
          {[
            ['◷', copy.duration, course.duration],
            ['◇', copy.level, levelLabel[locale][course.level] || course.level],
            ['▣', copy.certificate, course.certificate ? copy.certified : copy.attendance],
            [
              '◎',
              copy.price,
              formatPrice(course.price, course.currency || 'IQD', isAr) || copy.contactForPrice,
            ],
          ].map(([icon, label, value]) => (
            <div key={label} className="flex items-start justify-center gap-2 px-2 py-3 text-start sm:items-center sm:gap-3 sm:px-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f9fc] text-[#1fb6d1] dark:bg-[#0b2850] dark:text-[#42d7ff] sm:h-10 sm:w-10">
                {icon}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 sm:text-[11px]">{label}</p>
                <p className="text-xs font-bold leading-snug text-slate-700 sm:text-sm dark:text-slate-100">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 dark:bg-[#040b18] sm:py-20">
        <div className="dc-container grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
          <div className="text-start">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.about}</p>
            <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">{copy.aboutTitle}</h2>
            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-400">{course.overview}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {course.objectives.map((objective) => (
                <div key={objective} className="flex items-start gap-3 text-start">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1fb6d1] text-[11px] text-white">
                    ✓
                  </span>
                  <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">{objective}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            id="curriculum"
            className="rounded-2xl border border-slate-200 bg-[#f8fcfd] p-6 text-start shadow-sm dark:border-[#19314f] dark:bg-[#081426] md:p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold">{copy.content}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {course.curriculum.length} {copy.modules} · {lessonCount} {copy.lessons}
                </p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f9fc] text-xl text-[#1fb6d1] dark:bg-[#0b2850]">
                ◈
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-[#19314f]">
              {course.curriculum.map((module, index) => (
                <details key={module.title} className="group py-5" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-start">
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#101c38] text-[11px] font-black text-white dark:bg-[#1fb6d1] dark:text-[#04101c]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm leading-6">{module.title}</strong>
                        <small className="mt-0.5 block font-medium text-slate-400">
                          {module.lessons.length} {copy.lessons}
                        </small>
                      </span>
                    </span>
                    <span className="shrink-0 text-[#1fb6d1] transition group-open:rotate-45">＋</span>
                  </summary>
                  {module.description ? (
                    <p className="mt-4 border-s-2 border-[#1fb6d1] ps-4 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {module.description}
                    </p>
                  ) : null}
                  {module.outcomes?.length ? (
                    <div className="mt-4 rounded-xl bg-white p-4 dark:bg-[#06101f]">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#1fb6d1]">{copy.moduleOutcomes}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {module.outcomes.map((outcome) => (
                          <span
                            key={outcome}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-[#19314f] dark:text-slate-300"
                          >
                            ✓ {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <ul className="mt-4 grid gap-3">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.title}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-[#19314f] dark:bg-[#06101f]"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <strong className="min-w-0 text-xs leading-5 text-[#101c38] dark:text-white">◉ {lesson.title}</strong>
                          {lesson.duration ? <span className="shrink-0 text-[10px] text-slate-400">{lesson.duration}</span> : null}
                        </div>
                        {lesson.description ? (
                          <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{lesson.description}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {lesson.format ? (
                            <span className="rounded-md bg-[#e8f9fc] px-2 py-1 text-[9px] font-bold text-[#1789a2] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                              {copy.practicalFormat}: {lesson.format}
                            </span>
                          ) : null}
                          {lesson.topics?.map((topic) => (
                            <span
                              key={topic}
                              className="rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-500 dark:bg-[#0b1c33] dark:text-slate-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-white p-4 dark:bg-[#06101f]">
              <p className="text-xs font-bold text-slate-400">{copy.requirements}</p>
              <ul className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-400">
                {course.requirements.map((requirement) => (
                  <li key={requirement}>— {requirement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {course.instructors.length ? (
        <section className="relative overflow-hidden bg-[#f6f9fc] py-20 dark:bg-[#040b18]">
          <div className="pointer-events-none absolute -start-32 -top-32 h-96 w-96 rounded-full bg-[#1fb6d1]/8 blur-3xl" />
          <div className="pointer-events-none absolute -end-28 bottom-0 h-80 w-80 rotate-45 rounded-[4rem] border-[45px] border-[#101c38]/[.025] dark:border-white/[.025]" />
          <div className="dc-container">
            <div className="mb-10 text-center">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#1fb6d1]">{copy.learnWith}</p>
              <h2 className="mt-3 text-3xl font-black text-[#101c38] md:text-4xl dark:text-white">{copy.supervised}</h2>
              <span className="mx-auto mt-4 block h-1 w-10 rounded-full bg-[#1fb6d1]" />
            </div>
            {course.instructors.map(({ instructor }) => (
              <div
                key={instructor.id}
                className="relative mx-auto mb-8 grid max-w-5xl overflow-hidden rounded-[1.8rem] border border-white bg-white shadow-[0_24px_70px_rgba(16,28,56,.12)] last:mb-0 md:grid-cols-[.85fr_1.15fr] dark:border-[#19314f] dark:bg-[#081426]"
              >
                <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(145deg,#dcecf6,#9fcde0)] md:min-h-[380px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.75),transparent_34%),linear-gradient(135deg,transparent_45%,rgba(16,28,56,.14))]" />
                  <img
                    src={instructor.imageUrl || '/dr-ammar.png'}
                    alt={instructor.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                  <span className="absolute start-5 top-5 inline-flex items-center gap-2 rounded-xl bg-[#101c38] px-3 py-2 text-[10px] font-black text-white shadow-lg">
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-white/35 text-[#42d7ff]">★</span>
                    {instructor.title || copy.founder}
                  </span>
                </div>

                <div className="flex flex-col justify-center p-5 text-start sm:p-7 md:p-10">
                  <div className="flex items-start justify-between gap-3 sm:gap-5">
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black text-[#101c38] sm:text-3xl md:text-4xl dark:text-white">{instructor.name}</h3>
                      <p className="mt-2 text-sm font-bold text-[#1fb6d1] sm:text-base">{instructor.title}</p>
                    </div>
                    <div className="hidden shrink-0 text-end sm:block">
                      <img src="/logo.png" alt="DentaCollab" className="ms-auto h-14 w-14 object-contain" />
                      <p className="mt-1 text-[10px] font-black tracking-wider text-[#101c38] dark:text-white">
                        DENTA<span className="text-[#1fb6d1]">COLLAB</span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {instructor.biography || copy.instructorBio}
                  </p>

                  <div className="mt-6 border-t border-slate-200 pt-5 dark:border-[#19314f]">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[.15em] text-slate-400">{copy.credentials}</p>
                    <div className="grid gap-2">
                      {(instructor.certificates?.length
                        ? instructor.certificates
                        : instructor.experience
                          ? [instructor.experience]
                          : []
                      ).map((credential, index) => (
                        <div key={credential} className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f9fc] text-[10px] text-[#1789a2] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                            {['◆', '●', '★'][index] || '✓'}
                          </span>
                          {credential}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/instructors/${instructor.id}`}
                    className="mt-6 inline-flex w-fit items-center rounded-full bg-[#1fb6d1] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1789a2] dark:bg-[#42d7ff] dark:text-[#040b18] dark:hover:bg-[#7be7ff]"
                  >
                    {copy.viewInstructor}
                  </Link>
             
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-[#f7fafc] py-20 text-center dark:bg-[#06101f]">
        <div className="dc-container">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.prep}</p>
          <h2 className="mt-3 text-3xl font-bold">{copy.prepTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">{copy.prepBody}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.prepItems.map(([icon, title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-[#19314f] dark:bg-[#081426]"
              >
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#e8f9fc] text-[#1fb6d1] dark:bg-[#0b2850] dark:text-[#42d7ff]">
                  {icon}
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="registration" className="bg-[#f8fafc] py-24 dark:bg-[#06101f]">
        <div className="dc-container">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_60px_rgba(16,28,56,.12)] dark:border-[#19314f] dark:bg-[#081426] dark:shadow-[0_20px_70px_rgba(0,0,0,.4)] sm:p-7 md:p-10">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.start}</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{copy.book}</h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {registrationOpen
                  ? copy.bookBody
                  : course.registrationLabel || copy.closedTitle}
              </p>
            </div>
            {!registrationOpen ? (
              <div className="mt-8 rounded-2xl bg-slate-100 p-6 text-center font-bold text-[#101c38] dark:bg-[#0b1a2e] dark:text-slate-200">
                {course.registrationCta || course.registrationLabel || copy.closedTitle}
              </div>
            ) : mutation.isSuccess && !isPaidCourse ? (
              <div className="mt-8 rounded-2xl bg-[#e8f9fc] p-6 text-center font-bold text-[#101c38] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                {copy.successMsg}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                className="mt-8 grid gap-4 text-start sm:grid-cols-2"
              >
                <DynamicCourseRegistrationFields
                  courseIdOrSlug={slug}
                  isAr={isAr}
                  values={answers}
                  onChange={setAnswers}
                  className={`${fieldClass} text-start`}
                />
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-full bg-gradient-to-r from-[#101c38] to-[#1fb6d1] px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 sm:col-span-2"
                >
                  {mutation.isPending
                    ? copy.sending
                    : isPaidCourse
                      ? copy.submit
                      : copy.submitFree}
                </button>
                {mutation.isError ? (
                  <p className="text-center text-sm text-red-600 sm:col-span-2">{(mutation.error as Error).message}</p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 dark:bg-[#040b18]">
        <div className="dc-container max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.ask}</p>
            <h2 className="mt-3 text-3xl font-bold">{copy.faq}</h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-[#19314f] dark:border-[#19314f]">
            {(faq.data || []).slice(0, 5).map((item) => (
              <details key={item.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-start font-bold">
                  <span className="min-w-0">{item.question}</span>
                  <span className="shrink-0 text-[#1fb6d1] transition group-open:rotate-45">＋</span>
                </summary>
                <p className="pt-4 text-start text-sm leading-7 text-slate-500 dark:text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
