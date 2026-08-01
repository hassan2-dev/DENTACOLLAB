import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
  whatsappUrl?: string | null;
};

type ChatReply = {
  answer: string;
  matched: boolean;
  whatsappUrl?: string | null;
  mode: 'faq' | 'whatsapp';
};

type Bootstrap = {
  welcome: string;
  goodbye: string;
  outOfScope: string;
  quickPrompts: string[];
};

function IconClose({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

function IconExpand({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DentaFabFace({ thinking = false }: { thinking?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="fabShell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9eef4" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="8" r="4" fill="#42d7ff" />
      <path d="M32 12v5" stroke="#101c38" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="16" width="44" height="40" rx="16" fill="url(#fabShell)" stroke="#b7d6e0" strokeWidth="2" />
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

export function FloatingChat() {
  const { pathname } = useLocation();
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [saidGoodbye, setSaidGoodbye] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const bootstrap = useQuery({
    queryKey: ['chatbot-bootstrap', locale],
    queryFn: () => api<Bootstrap>('/chatbot/bootstrap'),
  });

  const welcome =
    bootstrap.data?.welcome ||
    (isAr
      ? 'مرحباً، أنا مساعد DentaCollab. كيف أساعدك في الدورات أو التسجيل؟'
      : 'Hello — I’m the DentaCollab assistant. How can I help with courses or registration?');
  const goodbye =
    bootstrap.data?.goodbye ||
    (isAr ? 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!' : 'Thanks for chatting with us. Have a great day!');
  const quickPrompts = bootstrap.data?.quickPrompts?.length
    ? bootstrap.data.quickPrompts
    : isAr
      ? ['الدورات المتوفرة', 'طريقة التسجيل', 'الشهادة']
      : ['Available courses', 'How to register', 'Certificate'];

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'bot', text: welcome }]);

  useEffect(() => {
    setMessages([{ role: 'bot', text: welcome }]);
    setSaidGoodbye(false);
  }, [welcome]);

  const chat = useMutation({
    mutationFn: (message: string) =>
      api<ChatReply>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, locale }),
      }),
    onSuccess: (data) => {
      setMessages((current) => [
        ...current,
        { role: 'bot', text: data.answer, whatsappUrl: data.whatsappUrl },
      ]);
    },
    onError: () => {
      setMessages((current) => [
        ...current,
        {
          role: 'bot',
          text: isAr ? 'تعذّر الإرسال. حاول مرة أخرى.' : 'Couldn’t send. Please try again.',
        },
      ]);
    },
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages, chat.isPending]);

  const reactToEvent = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
  }, []);

  useEffect(() => {
    const pageMessages: Record<string, string> = isAr
      ? {
          '/': 'جاهز لمساعدتك',
          '/courses': 'أساعدك باختيار الدورة',
          '/workshops': 'تصفّح الورش',
          '/instructors': 'تعرّف على المدربين',
          '/gallery': 'نتائج من التدريب',
          '/about': 'عن الأكاديمية',
          '/contact': 'تواصل معنا',
        }
      : {
          '/': 'Ready to help',
          '/courses': 'I can help pick a course',
          '/workshops': 'Browse workshops',
          '/instructors': 'Meet the instructors',
          '/gallery': 'Training outcomes',
          '/about': 'About the academy',
          '/contact': 'Contact the team',
        };
    const timer = window.setTimeout(() => {
      reactToEvent(
        pageMessages[pathname] ||
          (pathname.startsWith('/courses/')
            ? isAr
              ? 'تفاصيل هذه الدورة'
              : 'Course details'
            : isAr
              ? 'أنا هنا إذا احتجت مساعدة'
              : 'I’m here if you need help'),
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isAr, pathname, reactToEvent]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('[data-chat-control]')) return;
      const action = target.closest('a, button');
      if (!action) return;
      const href = action instanceof HTMLAnchorElement ? action.getAttribute('href') || '' : '';
      if (href.includes('registration') || href.includes('reserve')) {
        reactToEvent(isAr ? 'أساعدك بإكمال التسجيل؟' : 'Need help with registration?');
      } else if (href.includes('contact')) {
        reactToEvent(isAr ? 'يمكنك التواصل من هنا' : 'You can contact us here');
      } else if (action instanceof HTMLButtonElement && action.type === 'submit') {
        reactToEvent(isAr ? 'جاري مراجعة طلبك' : 'Reviewing your request');
      }
    }

    function handleSubmit() {
      reactToEvent(isAr ? 'تم إرسال البيانات بنجاح' : 'Details submitted successfully');
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [isAr, reactToEvent]);

  const closeChat = useCallback(() => {
    if (open && !saidGoodbye) {
      setMessages((current) => [...current, { role: 'bot', text: goodbye }]);
      setSaidGoodbye(true);
      window.setTimeout(() => setOpen(false), 900);
      return;
    }
    setOpen(false);
  }, [goodbye, open, saidGoodbye]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeChat();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeChat();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeChat, open]);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  function send(suggestedMessage?: string) {
    const message = (suggestedMessage ?? input).trim();
    if (!message || chat.isPending) return;
    setMessages((current) => [...current, { role: 'user', text: message }]);
    setInput('');
    chat.mutate(message);
  }

  if (pathname === '/chat') return null;

  const canSend = Boolean(input.trim()) && !chat.isPending;

  return (
    <div
      ref={rootRef}
      className="fixed z-[70] bottom-[max(1rem,env(safe-area-inset-bottom))] start-4 sm:bottom-6 sm:start-6"
    >
      <AnimatePresence>
        {open ? (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            dir={isAr ? 'rtl' : 'ltr'}
            className="mb-3 flex h-[min(540px,calc(100dvh-8rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_28px_70px_rgba(16,28,56,.24)] dark:border-[#1a2f4d] dark:bg-[#071426] sm:h-[min(540px,calc(100dvh-8.5rem))]"
            aria-label={isAr ? 'محادثة DentaCollab' : 'DentaCollab chat'}
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-br from-[#101c38] via-[#122543] to-[#0d3a48] px-4 py-3.5 text-white">
              <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/10 ring-2 ring-[#1fb6d1]/40">
                <DentaFabFace thinking={chat.isPending} />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[13px] font-semibold tracking-tight">
                  {isAr ? 'مساعد DentaCollab' : 'DentaCollab Assistant'}
                </strong>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
                  <i className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                  {chat.isPending
                    ? isAr
                      ? 'يكتب الآن...'
                      : 'Typing...'
                    : isAr
                      ? 'متصل الآن'
                      : 'Online now'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to="/chat"
                  data-chat-control
                  className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={isAr ? 'فتح الصفحة الكاملة' : 'Open full page'}
                  title={isAr ? 'صفحة كاملة' : 'Full page'}
                >
                  <IconExpand className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={closeChat}
                  data-chat-control
                  className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#f5f8fb] px-3.5 py-4 dark:bg-[#050e1c]"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'bot' ? (
                    <div className="me-2 mt-0.5 hidden h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#101c38] ring-1 ring-[#1fb6d1]/30 sm:block">
                      <DentaFabFace />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[82%] space-y-2 px-3.5 py-2.5 text-[13px] leading-6 ${
                      message.role === 'user'
                        ? 'rounded-2xl rounded-ee-md bg-[#101c38] text-white'
                        : 'rounded-2xl rounded-es-md border border-slate-200/90 bg-white text-[#243447] shadow-sm dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-slate-200'
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.whatsappUrl ? (
                      <a
                        href={message.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-chat-control
                        className="inline-flex rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        {isAr ? 'تواصل عبر واتساب' : 'Contact on WhatsApp'}
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
              {chat.isPending ? (
                <div className="flex justify-start">
                  <div className="me-2 mt-0.5 hidden h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#101c38] sm:block">
                    <DentaFabFace thinking />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-es-md border border-slate-200/90 bg-white px-3.5 py-3 dark:border-[#1a2f4d] dark:bg-[#0a1628]">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ repeat: Infinity, duration: 1, delay: dot * 0.15 }}
                        className="h-1.5 w-1.5 rounded-full bg-[#1fb6d1]"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200/80 bg-white p-3 dark:border-[#1a2f4d] dark:bg-[#071426]">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    data-chat-control
                    onClick={() => send(prompt)}
                    disabled={chat.isPending}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-[#1fb6d1] hover:bg-[#e8f9fc] hover:text-[#0f7f94] disabled:opacity-45 dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-slate-300 dark:hover:border-[#1fb6d1]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-[#f7fafc] p-1.5 transition focus-within:border-[#1fb6d1] focus-within:ring-4 focus-within:ring-[#1fb6d1]/12 dark:border-[#1a2f4d] dark:bg-[#06101f]">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  dir="auto"
                  placeholder={isAr ? 'اكتب رسالتك...' : 'Write your message...'}
                  className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-start text-sm text-[#101c38] outline-none placeholder:text-slate-400 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  data-chat-control
                  disabled={!canSend}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1fb6d1] text-white transition hover:bg-[#159db5] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-[#1a2f4d]"
                  aria-label={isAr ? 'إرسال' : 'Send'}
                >
                  <IconSend className="h-4 w-4" flip={isAr} />
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {(() => {
        const fab = (
          <div className="relative shrink-0">
            {!open ? (
              <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[#1fb6d1]/25" />
            ) : null}
            <motion.button
              type="button"
              whileHover={{ y: -3, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (open) closeChat();
                else {
                  setSaidGoodbye(false);
                  setOpen(true);
                }
              }}
              data-chat-control
              className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full shadow-[0_16px_40px_rgba(16,28,56,.32)] transition sm:h-16 sm:w-16 ${
                open
                  ? 'bg-[#101c38] text-white'
                  : 'bg-gradient-to-br from-[#101c38] via-[#14304f] to-[#1fb6d1] p-1.5'
              }`}
              aria-label={open ? (isAr ? 'إغلاق المحادثة' : 'Close chat') : isAr ? 'فتح المحادثة' : 'Open chat'}
            >
              {open ? (
                <IconClose className="h-5 w-5" />
              ) : (
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#071426]/25 [direction:ltr]">
                  <DentaFabFace thinking={chat.isPending} />
                </span>
              )}
              {!open ? (
                <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#34d399]" />
              ) : null}
            </motion.button>
          </div>
        );

        const bubble = (
          <AnimatePresence mode="wait">
            {!open && notice ? (
              <motion.div
                key={notice}
                initial={{ opacity: 0, x: isAr ? -10 : 10, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={`relative mb-2 max-w-[190px] rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-[11px] font-semibold leading-5 text-[#101c38] shadow-[0_12px_30px_rgba(16,28,56,.14)] dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-white ${
                  isAr ? 'rounded-ee-md' : 'rounded-es-md'
                }`}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {notice}
                <span
                  className={`absolute bottom-3 h-3 w-3 rotate-45 border-slate-200/90 bg-white dark:border-[#1a2f4d] dark:bg-[#0a1628] ${
                    isAr ? '-end-1.5 border-b border-e' : '-start-1.5 border-b border-s'
                  }`}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        );

        return (
          <div className="flex items-end gap-3">
            {fab}
            {bubble}
          </div>
        );
      })()}
    </div>
  );
}
