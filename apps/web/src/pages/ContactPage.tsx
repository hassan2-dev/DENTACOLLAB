import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(5),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1fb6d1] focus:ring-4 focus:ring-[#1fb6d1]/15 dark:border-[#1f3658] dark:bg-[#071426] dark:text-white dark:placeholder:text-slate-500';

export function ContactPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Record<string, Record<string, string>>>('/settings'),
  });
  const general = settings.data?.general ?? {};
  const social = settings.data?.social ?? {};
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => api('/contact', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => form.reset(),
  });

  const phone = general.phone || '+9647817828545';
  const location = general.location || (isAr ? 'موقع الأكاديمية' : 'Academy location');
  const locationEn = general.locationEn || 'Academy location';
  const locationLabel = isAr ? location : locationEn;
  const coordinates = general.coordinates || "33°17'16.0\"N 44°20'52.4\"E";
  const waDigits = (general.whatsapp || phone).replace(/[^\d]/g, '');
  const waDisplay = general.whatsapp || '+964 781 782 8545';
  const mapsLink = general.mapsUrl || 'https://maps.app.goo.gl/qJ7KMyB6dQEuxGQE7?g_st=ic';
  const mapSrc = general.mapsUrl?.includes('embed')
    ? general.mapsUrl
    : `https://maps.google.com/maps?q=${encodeURIComponent("33.287778,44.347889")}&z=17&output=embed`;

  const socialLabels: Record<string, { ar: string; en: string }> = {
    instagram: { ar: 'انستغرام', en: 'Instagram' },
    facebook: { ar: 'فيسبوك', en: 'Facebook' },
    twitter: { ar: 'تويتر', en: 'X / Twitter' },
    linkedin: { ar: 'لينكدإن', en: 'LinkedIn' },
    youtube: { ar: 'يوتيوب', en: 'YouTube' },
  };

  const copy = isAr
    ? {
        badge: 'تواصل مباشر',
        title: 'خلّينا نكمّل رحلتك الرقمية',
        body: 'سواء تريد استشارة عن دورة، أو مساعدة بالتسجيل، أو شراكة تدريبية — فريق DentaCollab يرد عليك بسرعة.',
        channels: 'قنوات التواصل',
        formTitle: 'أرسل رسالتك',
        formBody: 'املأ النموذج وسنعود إليك خلال ساعات العمل.',
        name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        subject: 'الموضوع',
        message: 'رسالتك',
        send: 'إرسال الرسالة',
        sending: 'جاري الإرسال...',
        success: 'وصلت رسالتك. سنتواصل معك قريباً.',
        successBody: 'يمكنك أيضاً متابعة الدورات أو التحدث مع المساعد الذكي الآن.',
        instagramLabel: 'انستغرام',
        facebookLabel: 'فيسبوك',
        whatsapp: 'واتساب',
        whatsappBody: 'تواصل فوري مع فريق التسجيل',
        locationLabel: 'موقع الأكاديمية',
        mapTitle: 'زورنا',
        mapBody: 'موقع الأكاديمية على الخريطة',
        quickCourses: 'استكشف الدورات',
        quickChat: 'اسأل المساعد الذكي',
        response: 'متوسط الرد',
        responseValue: 'خلال ساعات',
        support: 'دعم التسجيل',
        supportValue: 'متوفر يومياً',
        socialTitle: 'سوشيال ميديا',
      }
    : {
        badge: 'Direct contact',
        title: 'Let’s continue your digital journey',
        body: 'Whether you need course advice, registration help, or a training partnership — the DentaCollab team responds quickly.',
        channels: 'Contact channels',
        formTitle: 'Send a message',
        formBody: 'Fill in the form and we will get back during business hours.',
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone number',
        subject: 'Subject',
        message: 'Your message',
        send: 'Send message',
        sending: 'Sending...',
        success: 'Message received. We will contact you soon.',
        successBody: 'You can also browse courses or talk to the AI assistant now.',
        instagramLabel: 'Instagram',
        facebookLabel: 'Facebook',
        whatsapp: 'WhatsApp',
        whatsappBody: 'Instant chat with the registration team',
        locationLabel: 'Academy location',
        mapTitle: 'Visit us',
        mapBody: 'Academy location on the map',
        quickCourses: 'Explore courses',
        quickChat: 'Ask the AI assistant',
        response: 'Average reply',
        responseValue: 'Within hours',
        support: 'Registration support',
        supportValue: 'Available daily',
        socialTitle: 'Social media',
      };

  const channels = [
    {
      label: copy.instagramLabel,
      value: '@dentacollab',
      href: social.instagram || 'https://www.instagram.com/dentacollab',
      icon: '◎',
    },
    {
      label: copy.whatsapp,
      value: waDisplay,
      href: waDigits ? `https://wa.me/${waDigits}` : undefined,
      icon: '✆',
    },
    {
      label: copy.facebookLabel,
      value: 'Digital dentistry training courses',
      href: social.facebook || 'https://www.facebook.com/Digitaldentistrytrainingcourses',
      icon: 'f',
    },
    {
      label: copy.locationLabel,
      value: coordinates,
      href: mapsLink,
      icon: '⌖',
    },
  ];

  return (
    <div className="bg-[#f7fafc] text-[#101c38] transition-colors dark:bg-[#040b18] dark:text-[#eaf4ff]">
      <Helmet>
        <title>{isAr ? 'تواصل معنا' : 'Contact'} | DentaCollab</title>
        <meta name="description" content={copy.body} />
      </Helmet>

      <section className="relative overflow-hidden bg-[#101c38] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(31,182,209,.28),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(123,231,255,.12),transparent_30%)]" />
        <div className="pointer-events-none absolute -end-20 top-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -start-16 bottom-0 h-56 w-56 rotate-12 rounded-[2rem] border border-[#1fb6d1]/20" />

        <div className="dc-container relative grid items-end gap-10 py-14 lg:grid-cols-[1.2fr_.8fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mb-6 inline-flex items-center gap-3" aria-label="DentaCollab">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white p-1.5">
                <img src="/logo.png" alt="" className="h-full w-full object-contain" />
              </span>
              <span>
                <span className="block text-lg font-black tracking-wide text-white">
                  DENTA<span className="text-[#1fb6d1]">COLLAB</span>
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                  Digital Dentistry Academy
                </span>
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#7be7ff]">{copy.badge}</p>
            <h1 className="mt-4 max-w-xl text-3xl font-black leading-[1.15] tracking-[-0.04em] sm:text-4xl md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{copy.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-full bg-[#1fb6d1] px-5 py-2.5 text-sm font-bold !text-[#04101c] transition hover:bg-white"
              >
                {copy.quickCourses}
              </Link>
              <Link
                to="/chat"
                className="rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {copy.quickChat}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              [copy.response, copy.responseValue],
              [copy.support, copy.supportValue],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-black text-[#7be7ff]">{value}</p>
              </div>
            ))}
            {waDigits ? (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-[#1fb6d1]/35 bg-[#1fb6d1]/10 px-5 py-4 transition hover:bg-[#1fb6d1]/20"
              >
                <div>
                  <p className="text-sm font-black text-white">{copy.whatsapp}</p>
                  <p className="mt-1 text-xs text-slate-300">{waDisplay}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-lg font-black text-white">
                  W
                </span>
              </a>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="dc-container">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1fb6d1]">{copy.channels}</p>
              <h2 className="mt-2 text-2xl font-black text-[#101c38] dark:text-white sm:text-3xl">
                {isAr ? 'اختر الطريقة الأنسب لك' : 'Pick the best way to reach us'}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((item) => {
              const content = (
                <>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f9fc] text-lg text-[#1789a2] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                    {item.icon}
                  </span>
                  <div className="mt-5 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                    <p className="mt-2 break-words text-base font-bold text-[#101c38] dark:text-white">{item.value}</p>
                  </div>
                </>
              );
              const className =
                'group flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(16,28,56,.05)] transition hover:-translate-y-0.5 hover:border-[#1fb6d1]/50 dark:border-[#19314f] dark:bg-[#081426]';
              return item.href ? (
                <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={className}>
                  {content}
                </a>
              ) : (
                <div key={item.label} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-20">
        <div className="dc-container grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-10">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(16,28,56,.08)] dark:border-[#19314f] dark:bg-[#081426] sm:p-8">
            {mutation.isSuccess ? (
              <div className="grid min-h-[360px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8f9fc] text-2xl text-[#1789a2] dark:bg-[#0b2850] dark:text-[#7be7ff]">
                    ✓
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#101c38] dark:text-white">{copy.success}</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">{copy.successBody}</p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/courses"
                      className="rounded-full bg-[#101c38] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1fb6d1]"
                    >
                      {copy.quickCourses}
                    </Link>
                    <Link
                      to="/chat"
                      className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#101c38] transition hover:border-[#1fb6d1] hover:text-[#1fb6d1] dark:border-[#19314f] dark:text-white"
                    >
                      {copy.quickChat}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              >
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1fb6d1]">{copy.formTitle}</p>
                  <h2 className="mt-2 text-2xl font-black text-[#101c38] dark:text-white sm:text-3xl">
                    {isAr ? 'نبدأ من هنا' : 'Start here'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{copy.formBody}</p>
                </div>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.name}</span>
                  <input className={fieldClass} required {...form.register('fullName')} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.email}</span>
                  <input className={fieldClass} type="email" required {...form.register('email')} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.phone}</span>
                  <input className={fieldClass} type="tel" {...form.register('phone')} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.subject}</span>
                  <input className={fieldClass} required {...form.register('subject')} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">{copy.message}</span>
                  <textarea className={fieldClass} rows={5} required {...form.register('message')} />
                </label>

                {mutation.isError ? (
                  <p className="text-sm text-red-600 sm:col-span-2">
                    {(mutation.error as Error).message || (isAr ? 'تعذّر الإرسال، حاول مرة أخرى.' : 'Could not send. Please try again.')}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-full bg-[#101c38] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#1fb6d1] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                >
                  {mutation.isPending ? copy.sending : copy.send}
                </button>
              </form>
            )}
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-[#101c38] shadow-[0_24px_70px_rgba(16,28,56,.12)] dark:border-[#19314f]">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#7be7ff]">{copy.mapTitle}</p>
              <h3 className="mt-2 text-xl font-black text-white">{copy.mapBody}</h3>
              <p className="mt-2 text-sm text-slate-300">{locationLabel}</p>
              <p className="mt-1 text-xs text-slate-400" dir="ltr">
                {coordinates}
              </p>
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-bold text-[#7be7ff] hover:underline"
              >
                {isAr ? 'فتح في خرائط Google' : 'Open in Google Maps'}
              </a>
            </div>
            <iframe
              title={isAr ? 'الخريطة' : 'Map'}
              src={mapSrc}
              className="h-[280px] w-full border-0 sm:h-[360px] lg:h-[calc(100%-150px)] lg:min-h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {Object.keys(social).length ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-4">
                <p className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-500">{copy.socialTitle}</p>
                {Object.entries(social).map(([key, value]) => (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-300 transition hover:border-[#1fb6d1] hover:text-white"
                  >
                    {socialLabels[key]?.[isAr ? 'ar' : 'en'] || key}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
