import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';

type Msg = { role: 'user' | 'bot'; text: string; whatsappUrl?: string | null };

type ChatReply = {
  answer: string;
  matched: boolean;
  whatsappUrl?: string | null;
  mode: 'faq' | 'whatsapp';
};

type Bootstrap = {
  welcome: string;
  goodbye: string;
  quickPrompts: string[];
};

function IconSend({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M4.5 12h11.5M12.5 7l5.5 5-5.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DentaFace({ thinking = false, className = '' }: { thinking?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="chatFaceShell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9eef4" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="8" r="4" fill="#42d7ff" />
      <path d="M32 12v5" stroke="#101c38" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="16" width="44" height="40" rx="16" fill="url(#chatFaceShell)" stroke="#b7d6e0" strokeWidth="2" />
      <rect x="16" y="24" width="32" height="24" rx="10" fill="#071426" />
      {thinking ? (
        <>
          <circle cx="24" cy="35" r="2.4" fill="#42d7ff" />
          <circle cx="40" cy="35" r="2.4" fill="#42d7ff" />
          <path d="M26 42h12" stroke="#42d7ff" strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M21 34c2.2-3.5 5.8-3.5 8 0" fill="none" stroke="#42d7ff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M35 34c2.2-3.5 5.8-3.5 8 0" fill="none" stroke="#42d7ff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M26 41c3.2 3 6.8 3 12 0" fill="none" stroke="#42d7ff" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function ChatPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const bootstrap = useQuery({
    queryKey: ['chatbot-bootstrap', locale],
    queryFn: () => api<Bootstrap>('/chatbot/bootstrap'),
  });

  const greeting =
    bootstrap.data?.welcome ||
    (isAr
      ? 'مرحباً بك في DentaCollab. أنا مساعد الأكاديمية — اسأل عن الدورات، التسجيل، أو الشهادات.'
      : 'Welcome to DentaCollab. I’m the academy assistant — ask about courses, registration, or certificates.');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: greeting }]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'bot', text: greeting }]);
  }, [greeting]);

  const mutation = useMutation({
    mutationFn: (message: string) =>
      api<ChatReply>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, locale }),
      }),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.answer, whatsappUrl: data.whatsappUrl },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: isAr ? 'تعذّر الإرسال. حاول مرة أخرى.' : 'Couldn’t send. Please try again.' },
      ]);
    },
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  function send(suggested?: string) {
    const message = (suggested ?? input).trim();
    if (!message || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');
    mutation.mutate(message);
  }

  const quickPrompts = bootstrap.data?.quickPrompts?.length
    ? bootstrap.data.quickPrompts
    : isAr
      ? ['الدورات المتوفرة', 'طريقة التسجيل', 'هل توجد شهادة؟', 'مدة الدورات']
      : ['Available courses', 'How to enroll', 'Certificate included?', 'Course duration'];

  const tips = isAr
    ? [
        ['دورات', 'اسأل عن المستويات والمسارات'],
        ['تسجيل', 'خطوات حجز مقعدك'],
        ['شهادات', 'نوع الاعتماد بعد الإكمال'],
      ]
    : [
        ['Courses', 'Ask about levels and pathways'],
        ['Enrollment', 'How to reserve your seat'],
        ['Certificates', 'What you receive after completion'],
      ];

  const canSend = Boolean(input.trim()) && !mutation.isPending;

  return (
    <div className="min-h-[calc(100dvh-70px)] bg-[#f4f7fa] text-[#101c38] transition-colors dark:bg-[#040b18] dark:text-[#eaf4ff] sm:min-h-[calc(100dvh-78px)]">
      <Helmet>
        <title>{isAr ? 'المساعد' : 'Assistant'} | DentaCollab</title>
        <meta
          name="description"
          content={
            isAr
              ? 'أسئلة وأجوبة حول دورات وتسجيل DentaCollab.'
              : 'FAQ answers about DentaCollab courses and registration.'
          }
        />
      </Helmet>

      <section className="dc-container grid gap-5 py-5 sm:py-8 lg:grid-cols-[0.9fr_1.2fr] lg:items-stretch lg:gap-8 lg:py-10">
        <aside className="hidden flex-col justify-between rounded-[1.6rem] border border-slate-200/90 bg-gradient-to-br from-[#101c38] via-[#122543] to-[#0d3a48] p-6 text-white shadow-[0_24px_60px_rgba(16,28,56,.2)] lg:flex dark:border-[#1a2f4d]">
          <div>
            <div className="mb-6 inline-flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white/10 ring-2 ring-[#1fb6d1]/35">
                <DentaFace thinking={mutation.isPending} className="h-full w-full" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#7be7ff]">DentaBot</p>
                <p className="text-sm font-semibold text-white/90">
                  {isAr ? 'مساعد الأكاديمية' : 'Academy assistant'}
                </p>
              </div>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-[-0.03em]">
              {isAr ? 'أسئلة وأجوبة جاهزة' : 'Ready FAQ answers'}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {isAr
                ? 'إجابات من قائمة الأسئلة المعتمدة. إذا سؤالك خارج النطاق نوجهك لواتساب الدعم.'
                : 'Answers from our approved FAQ. Out-of-scope questions go to WhatsApp support.'}
            </p>

            <div className="mt-8 grid gap-3">
              {tips.map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-xs font-bold text-[#7be7ff]">{title}</p>
                  <p className="mt-1 text-sm text-white/80">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to="/courses"
              className="rounded-full bg-[#1fb6d1] px-4 py-2 text-xs font-bold !text-[#04101c] transition hover:bg-white"
            >
              {isAr ? 'استكشف الدورات' : 'Explore courses'}
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10"
            >
              {isAr ? 'تواصل معنا' : 'Contact us'}
            </Link>
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-[1.4rem] border border-slate-200/90 bg-white shadow-[0_20px_50px_rgba(16,28,56,.1)] dark:border-[#1a2f4d] dark:bg-[#071426] sm:min-h-[560px] lg:min-h-[640px] lg:max-h-[min(720px,78vh)]">
          <header className="flex items-center gap-3 border-b border-slate-200/80 bg-white px-4 py-3.5 dark:border-[#1a2f4d] dark:bg-[#071426] sm:px-5">
            <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#101c38] ring-2 ring-[#1fb6d1]/30">
              <DentaFace thinking={mutation.isPending} className="h-full w-full" />
              <span className="absolute bottom-0.5 end-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#34d399] dark:border-[#071426]" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h2 className="truncate text-sm font-bold text-[#101c38] dark:text-white sm:text-base">
                {isAr ? 'مساعد DentaCollab' : 'DentaCollab Assistant'}
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {mutation.isPending
                  ? isAr
                    ? 'يكتب الآن...'
                    : 'Typing...'
                  : isAr
                    ? 'متصل · سؤال وجواب'
                    : 'Online · FAQ replies'}
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#1fb6d1] hover:text-[#1789a2] dark:border-[#1a2f4d] dark:text-slate-300 sm:inline-flex"
            >
              {isAr ? 'الدورات' : 'Courses'}
            </Link>
          </header>

          <div className="border-b border-slate-200/70 bg-[#f7fafc] px-4 py-3 text-start dark:border-[#1a2f4d] dark:bg-[#06101f] lg:hidden">
            <p className="text-xs font-bold text-[#101c38] dark:text-white">
              {isAr ? 'اسأل عن الدورات والتسجيل' : 'Ask about courses & enrollment'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {isAr ? 'يدعم العربية والإنجليزية' : 'Supports Arabic and English'}
            </p>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#f5f8fb] px-3.5 py-4 dark:bg-[#050e1c] sm:px-5 sm:py-5"
          >
            {messages.map((m, i) => (
              <motion.div
                key={`${m.role}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'bot' ? (
                  <div className="me-2 mt-0.5 hidden h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#101c38] ring-1 ring-[#1fb6d1]/25 sm:block">
                    <DentaFace className="h-full w-full" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[88%] space-y-2 px-3.5 py-2.5 text-sm leading-7 sm:max-w-[80%] ${
                    m.role === 'user'
                      ? 'rounded-2xl rounded-ee-md bg-[#101c38] text-white'
                      : 'rounded-2xl rounded-es-md border border-slate-200/90 bg-white text-[#243447] shadow-sm dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-[#e7f2ff]'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.whatsappUrl ? (
                    <a
                      href={m.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      {isAr ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
                    </a>
                  ) : null}
                </div>
              </motion.div>
            ))}
            {mutation.isPending ? (
              <div className="flex justify-start">
                <div className="me-2 mt-0.5 hidden h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#101c38] sm:block">
                  <DentaFace thinking className="h-full w-full" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-es-md border border-slate-200/90 bg-white px-4 py-3 dark:border-[#1a2f4d] dark:bg-[#0a1628]">
                  {[0, 1, 2].map((dot) => (
                    <motion.i
                      key={dot}
                      animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: dot * 0.14 }}
                      className="h-1.5 w-1.5 rounded-full bg-[#1fb6d1]"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200/80 bg-white p-3 dark:border-[#1a2f4d] dark:bg-[#071426] sm:p-4">
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={mutation.isPending}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-[#1fb6d1] hover:bg-[#e8f9fc] hover:text-[#0f7f94] disabled:opacity-45 dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-slate-300 dark:hover:border-[#1fb6d1]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-[#f7fafc] p-1.5 transition focus-within:border-[#1fb6d1] focus-within:ring-4 focus-within:ring-[#1fb6d1]/12 dark:border-[#1a2f4d] dark:bg-[#06101f]">
              <textarea
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-start text-sm text-[#101c38] outline-none placeholder:text-slate-400 dark:text-white"
                rows={1}
                dir="auto"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={(e) => {
                  const x = window.scrollX;
                  const y = window.scrollY;
                  requestAnimationFrame(() => window.scrollTo(x, y));
                  e.currentTarget.focus({ preventScroll: true });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={isAr ? 'اكتب رسالتك بالعربية أو الإنجليزية...' : 'Type in Arabic or English...'}
                aria-label={isAr ? 'رسالة الشات' : 'Chat message'}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!canSend}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1fb6d1] text-white transition hover:bg-[#159db5] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-[#1a2f4d]"
                aria-label={isAr ? 'إرسال' : 'Send'}
              >
                <IconSend className="h-[18px] w-[18px]" flip={isAr} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
