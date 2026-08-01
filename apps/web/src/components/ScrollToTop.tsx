import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '../lib/locale';

function IconArrowUp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 19V7M6.5 11.5 12 6l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScrollToTop() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          whileHover={{ y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed z-[70] bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 grid h-12 w-12 place-items-center rounded-full border border-slate-200/90 bg-white text-[#101c38] shadow-[0_14px_36px_rgba(16,28,56,.2)] transition hover:border-[#1fb6d1] hover:text-[#1789a2] dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-white dark:hover:border-[#1fb6d1] sm:bottom-6 sm:end-6 sm:h-14 sm:w-14"
          aria-label={isAr ? 'العودة للأعلى' : 'Back to top'}
        >
          <IconArrowUp className="h-5 w-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
