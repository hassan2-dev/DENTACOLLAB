import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { personPhoto } from '../lib/media';
import { LogoLoader } from '../components/LogoLoader';

type TeamMember = {
  id: string;
  name: string;
  title: string;
  biography: string;
  imageUrl?: string;
  courses: { id: string }[];
};

export function AboutPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const team = useQuery({
    queryKey: ['instructors', locale],
    queryFn: () => api<TeamMember[]>('/instructors'),
  });

  const copy = isAr
    ? {
        title: 'من نحن',
        eyebrow: 'الأكاديمية',
        heroTitle:
          'منصة تعليمية وتدريبية متخصصة تهدف إلى بناء وتطوير كفاءات أطباء الأسنان والفنيين، وتزويدهم بأحدث الخبرات والتطبيقات العملية على يد نخبة من الخبراء والاستشاريين.',
        heroBody:
          'DentaCollab أكاديمية متخصصة تربط الخبرة السريرية بأحدث التقنيات الرقمية، عبر برامج عملية واضحة للأطباء والمختبرات.',
        storyEyebrow: 'قصتنا',
        storyTitle: 'من فكرة سريرية إلى مسار تدريبي متكامل',
        storyBody:
          'انطلقت الأكاديمية من حاجة حقيقية في العيادة والمختبر: تحويل المعرفة الرقمية إلى مهارة يومية قابلة للتطبيق. نصمم المناهج حول سيناريوهات حقيقية، ونبني التدريب خطوة بخطوة حتى يخرج المتدرب وهو جاهز للعمل.',
        mission: 'المهمة',
        missionBody: 'تأهيل أطباء ومختبرات يثقون بمسارهم الرقمي من التخطيط إلى النتيجة النهائية.',
        vision: 'الرؤية',
        visionBody: 'أن نكون المرجع الإقليمي لتدريب طب الأسنان الرقمي العملي والمعتمد.',
        valuesEyebrow: 'قيمنا',
        valuesTitle: 'ما نلتزم به في كل برنامج',
        values: [
          ['تطبيق عملي', 'كل مفهوم يُترجم إلى تمرين أو سير عمل حقيقي.'],
          ['وضوح المسار', 'منهج مرتب، أهداف محددة، ومتابعة واضحة.'],
          ['خبرة سريرية', 'مدربون يجمعون بين العيادة والتقنية الرقمية.'],
          ['مجتمع مهني', 'تواصل مستمر ودعم بعد انتهاء الدورة.'],
        ] as const,
        teamEyebrow: 'Our Team',
        teamTitle: 'فريق الخبراء',
        teamBody: 'تعرّف على المدربين الذين يقودون برامج الأكاديمية.',
        viewProfile: 'عرض الملف',
        coursesCount: (n: number) => (n === 1 ? 'دورة واحدة' : `${n} دورات`),
        allInstructors: 'كل المدربين',
        ctaTitle: 'جاهز تبدأ رحلتك معنا؟',
        ctaBody: 'استكشف البرامج أو تواصل مع فريق التسجيل مباشرة.',
        ctaCourses: 'استكشف الدورات',
        ctaContact: 'تواصل معنا',
        emptyTeam: 'سيظهر فريق الأكاديمية هنا قريباً.',
      }
    : {
        title: 'About us',
        eyebrow: 'The academy',
        heroTitle:
          'A specialized educational and training platform dedicated to building and developing the competencies of dentists and technicians, and providing them with the latest expertise and practical applications from leading experts and consultants.',
        heroBody:
          'DentaCollab is a specialized academy that connects clinical expertise with modern digital technology through clear, practical programs for doctors and labs.',
        storyEyebrow: 'Our story',
        storyTitle: 'From a clinical need to a complete training path',
        storyBody:
          'The academy started from a real clinic and lab need: turning digital knowledge into daily skill. We design curricula around real scenarios and build training step by step until graduates are ready to work.',
        mission: 'Mission',
        missionBody: 'Train doctors and labs who trust their digital path from planning to final outcome.',
        vision: 'Vision',
        visionBody: 'Become the regional reference for practical, accredited digital dentistry training.',
        valuesEyebrow: 'Our values',
        valuesTitle: 'What we commit to in every program',
        values: [
          ['Hands-on practice', 'Every concept becomes a real exercise or workflow.'],
          ['Clear pathway', 'Structured curriculum, defined goals, and clear follow-up.'],
          ['Clinical expertise', 'Instructors who bridge clinic and digital technology.'],
          ['Professional community', 'Ongoing connection and support after the course.'],
        ] as const,
        teamEyebrow: 'Our Team',
        teamTitle: 'The experts behind the programs',
        teamBody: 'Meet the instructors who lead DentaCollab’s training pathways.',
        viewProfile: 'View profile',
        coursesCount: (n: number) => `${n} course${n === 1 ? '' : 's'}`,
        allInstructors: 'All instructors',
        ctaTitle: 'Ready to start with us?',
        ctaBody: 'Explore the programs or talk to the registration team directly.',
        ctaCourses: 'Explore courses',
        ctaContact: 'Contact us',
        emptyTeam: 'The academy team will appear here soon.',
      };

  return (
    <div className="overflow-x-hidden bg-white text-[#101c38] dark:bg-[#040b18] dark:text-[#eaf4ff]">
      <Helmet>
        <title>{copy.title} | DentaCollab</title>
        <meta name="description" content={copy.heroBody} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#101c38] text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 85% 15%, rgba(31,182,209,.38), transparent 55%), radial-gradient(ellipse 50% 45% at 5% 90%, rgba(66,215,255,.12), transparent 50%), linear-gradient(180deg, #0c1730 0%, #101c38 55%, #0a1528 100%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="dc-container relative grid min-h-[min(78vh,720px)] items-center gap-10 py-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-14 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-start"
          >
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#7be7ff]">{copy.eyebrow}</p>
            <p className="mt-4 font-[family-name:var(--font-display,inherit)] text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
              Denta<span className="text-[#1fb6d1]">Collab</span>
            </p>
            <h1 className="mt-5 max-w-2xl text-lg font-bold leading-8 tracking-[-0.01em] text-white/95 sm:text-xl sm:leading-8 md:text-2xl md:leading-9">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-slate-300 sm:text-base sm:leading-8">{copy.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-full bg-[#1fb6d1] px-5 py-3 text-sm font-bold !text-[#04101c] transition hover:bg-white"
              >
                {copy.ctaCourses}
              </Link>
              <Link
                to="/instructors"
                className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {copy.allInstructors}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-[#1fb6d1]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,.45)]">
              <div className="flex aspect-[4/5] flex-col sm:aspect-[5/6]">
                <div className="relative flex flex-1 items-center justify-center bg-[#f4f8fb] px-8 py-10 sm:px-12 sm:py-12">
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(31,182,209,.18),transparent_58%)]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-6 rounded-[1.4rem] border border-[#101c38]/06 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-[2px]"
                  />
                  <img
                    src="/logo.png"
                    alt="DentaCollab"
                    className="relative z-10 h-auto w-full max-w-[200px] object-contain drop-shadow-[0_8px_24px_rgba(16,28,56,.12)] sm:max-w-[230px]"
                  />
                </div>
                <div className="border-t border-white/10 bg-[#04101c] px-5 py-5 text-center sm:px-6 sm:py-6">
                  <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#7be7ff]">Digital Dentistry</p>
                  <p className="mt-1.5 text-base font-bold text-white sm:text-lg">
                    {isAr ? 'تدريب عملي · تقنية حديثة' : 'Hands-on · Modern tech'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Story + mission/vision */}
      <section className="py-14 sm:py-20">
        <div className="dc-container grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div className="text-start">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.storyEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white sm:text-4xl">
              {copy.storyTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-8">
              {copy.storyBody}
            </p>
          </div>
          <div className="grid gap-4 self-start">
            {[
              [copy.mission, copy.missionBody],
              [copy.vision, copy.visionBody],
            ].map(([label, body], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08 }}
                className="border-s-4 border-[#1fb6d1] bg-[#f7fafc] px-5 py-5 text-start dark:bg-[#081426] sm:px-6"
              >
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1fb6d1]">{label}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-slate-100 bg-[#f7fafc] py-14 dark:border-[#172b48] dark:bg-[#06101f] sm:py-20">
        <div className="dc-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.valuesEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white sm:text-4xl">
              {copy.valuesTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.values.map(([title, body], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-start"
              >
                <span className="text-3xl font-black text-[#1fb6d1]/35">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-lg font-bold text-[#101c38] dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-14 sm:py-20">
        <div className="dc-container">
          <div className="flex flex-wrap items-end justify-between gap-4 text-start">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.teamEyebrow}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#101c38] dark:text-white sm:text-4xl">
                {copy.teamTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-base">{copy.teamBody}</p>
            </div>
            <Link
              to="/instructors"
              className="text-sm font-bold text-[#1789a2] transition hover:text-[#1fb6d1]"
            >
              {copy.allInstructors} {isAr ? '←' : '→'}
            </Link>
          </div>

          {team.isLoading ? (
            <div className="mt-12">
              <LogoLoader label={isAr ? 'جاري تحميل الفريق' : 'Loading team'} />
            </div>
          ) : team.data?.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.data.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.07, 0.28) }}
                >
                  <Link
                    to={`/instructors/${member.id}`}
                    className="group block overflow-hidden rounded-[1.5rem] border border-slate-200/90 bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,28,56,.12)] dark:border-[#19314f] dark:bg-[#081426]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#101c38]">
                      <img
                        src={personPhoto(member.imageUrl)}
                        alt={member.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#04101c] via-[#04101c]/70 to-transparent p-5 pt-20">
                        <h3 className="text-xl font-bold text-white">{member.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-[#7be7ff]">{member.title}</p>
                      </div>
                    </div>
                    <div className="p-5 text-start">
                      <p className="line-clamp-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                        {member.biography}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400">
                          {copy.coursesCount(member.courses?.length ?? 0)}
                        </span>
                        <span className="text-xs font-bold text-[#1789a2] transition group-hover:text-[#1fb6d1]">
                          {copy.viewProfile} {isAr ? '←' : '→'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-sm text-slate-500">{copy.emptyTeam}</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#101c38] text-white">
        <div className="dc-container flex flex-col gap-5 py-8 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-10">
          <div className="min-w-0 max-w-xl">
            <h2 className="text-xl font-black tracking-[-0.02em] sm:text-2xl">{copy.ctaTitle}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-300">{copy.ctaBody}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              to="/courses"
              className="rounded-full bg-[#1fb6d1] px-5 py-2.5 text-sm font-bold !text-[#04101c] transition hover:bg-white"
            >
              {copy.ctaCourses}
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {copy.ctaContact}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
