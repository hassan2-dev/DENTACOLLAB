import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Phase = 'idle' | 'covering' | 'revealing';

const COVER_MS = 380;
const HOLD_MS = 120;
const REVEAL_MS = 420;

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const prevPath = useRef(location.pathname);
  const isFirstRender = useRef(true);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPath.current = location.pathname;
      return;
    }

    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (reduceMotion) {
      setPhase('idle');
      return;
    }

    clearTimers();
    setPhase('covering');

    timers.current.push(
      window.setTimeout(() => {
        setPhase('revealing');
      }, COVER_MS + HOLD_MS),
    );

    timers.current.push(
      window.setTimeout(() => {
        setPhase('idle');
      }, COVER_MS + HOLD_MS + REVEAL_MS),
    );
  }, [location.pathname, reduceMotion]);

  const showCurtain = phase === 'covering' || phase === 'revealing';
  const contentDelay = reduceMotion ? 0 : (COVER_MS + HOLD_MS) / 1000 * 0.55;

  return (
    <>
      <motion.div
        key={location.pathname}
        initial={reduceMotion || isFirstRender.current ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.4,
          delay: contentDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {showCurtain ? (
          <motion.div
            key="page-curtain"
            className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#f7fafc] dark:bg-[#040b18]"
            initial={{ y: '-100%' }}
            animate={{ y: phase === 'covering' ? '0%' : '-100%' }}
            exit={{ y: '-100%' }}
            transition={{
              duration: (phase === 'covering' ? COVER_MS : REVEAL_MS) / 1000,
              ease: [0.65, 0, 0.35, 1],
            }}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,182,209,.16),transparent_42%)] dark:bg-[radial-gradient(circle_at_center,rgba(31,182,209,.22),transparent_42%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1fb6d1]/50 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1fb6d1]/40 to-transparent" />

            <motion.div
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: phase === 'covering' ? 1 : 0, scale: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="relative grid h-24 w-24 place-items-center">
                <span className="absolute inset-0 rounded-full border border-[#1fb6d1]/30" />
                <span className="absolute inset-2 rounded-full border border-[#1fb6d1]/15" />
                <div className="relative z-10 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_18px_45px_rgba(16,28,56,.12)] dark:border-white/15 dark:shadow-[0_18px_45px_rgba(0,0,0,.35)]">
                  <img src="/logo.png" alt="" className="h-full w-full object-contain" />
                </div>
              </div>
              <p className="mt-4 text-sm font-black tracking-[.18em] text-[#101c38] dark:text-white">
                DENTA<span className="text-[#1fb6d1]">COLLAB</span>
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
