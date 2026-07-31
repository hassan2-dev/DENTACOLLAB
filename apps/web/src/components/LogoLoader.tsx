import { motion } from 'framer-motion';

type LogoLoaderProps = {
  fullPage?: boolean;
  label?: string;
};

export function LogoLoader({ fullPage = false, label }: LogoLoaderProps) {
  return (
    <div
      className={`grid place-items-center ${
        fullPage
          ? 'min-h-[calc(100vh-78px)] bg-[radial-gradient(circle_at_center,rgba(31,182,209,.1),transparent_34%)]'
          : 'min-h-72'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div className="relative grid h-28 w-28 place-items-center">
          {[0, 1].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-0 rounded-full border border-[#1fb6d1]/35"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [0.7, 1.25], opacity: [0, 0.6, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeOut',
                delay: ring * 0.9,
              }}
            />
          ))}

          <motion.div
            className="relative z-10 grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-white/80 bg-white p-2 shadow-[0_18px_45px_rgba(16,28,56,.18)] dark:border-[#19314f] dark:bg-[#081426]"
            animate={{ y: [0, -5, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/logo.png" alt="" className="h-full w-full object-contain" />
          </motion.div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-sm font-black tracking-[.16em] text-[#101c38] dark:text-white">
            DENTA<span className="text-[#1fb6d1]">COLLAB</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-[#1fb6d1]"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
              />
            ))}
          </div>
          {label ? <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p> : null}
        </div>
      </div>
    </div>
  );
}
