import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Mode = 'implant' | 'denture' | 'teeth';

type DentalHeroSceneProps = {
  isAr?: boolean;
  className?: string;
};

/**
 * Real dental models via Sketchfab embeds.
 * - Implant: Implante Dental (CC BY) — drandrescordova
 * - Denture: Very Good Full Denture — ivoclar.vivadent (full set with teeth)
 * - Teeth: Upper jaw teeth anatomy — elmagnifico
 */
const MODELS: Record<
  Mode,
  {
    uid: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    credit: string;
    creditUrl: string;
    license: string;
  }
> = {
  implant: {
    uid: 'ede1a07475db4236b43a6cd168d1225d',
    titleAr: 'زرعة أسنان',
    titleEn: 'Dental implant',
    bodyAr: 'موديل حقيقي لزرعة — دوّر وقرّب لاستكشاف الشكل.',
    bodyEn: 'A real implant model — orbit and zoom to explore the shape.',
    credit: 'drandrescordova',
    creditUrl: 'https://sketchfab.com/3d-models/implante-dental-ede1a07475db4236b43a6cd168d1225d',
    license: 'CC BY',
  },
  denture: {
    uid: '3c23527760b74021942e7c144849dea4',
    titleAr: 'طقم أسنان كامل',
    titleEn: 'Full denture set',
    bodyAr: 'طقم كامل بأسنان ظاهرة على قاعدة وردية — دوّر النموذج من كل الزوايا.',
    bodyEn: 'A full denture with visible teeth on a pink base — orbit from every angle.',
    credit: 'Ivoclar Vivadent',
    creditUrl: 'https://sketchfab.com/3d-models/very-good-full-denture-3c23527760b74021942e7c144849dea4',
    license: 'Sketchfab',
  },
  teeth: {
    uid: '35b057aa657d4e48989c0c6af657f41d',
    titleAr: 'قوس الأسنان',
    titleEn: 'Dental arch',
    bodyAr: 'تشريح الفك العلوي مع الأسنان ظاهرة بوضوح — للقواطع والأضراس.',
    bodyEn: 'Upper jaw anatomy with clearly visible teeth — centrals through molars.',
    credit: 'elmagnifico',
    creditUrl: 'https://sketchfab.com/3d-models/upper-jaw-teeth-anatomy-35b057aa657d4e48989c0c6af657f41d',
    license: 'Sketchfab',
  },
};

function SketchfabFrame({ uid, title }: { uid: string; title: string }) {
  const src =
    `https://sketchfab.com/models/${uid}/embed` +
    '?autostart=1' +
    '&ui_theme=dark' +
    '&ui_infos=0' +
    '&ui_controls=1' +
    '&ui_stop=0' +
    '&ui_watermark=0' +
    '&ui_watermark_link=0' +
    '&ui_help=0' +
    '&ui_settings=0' +
    '&ui_inspector=0' +
    '&ui_annotations=0' +
    '&ui_vr=0' +
    '&ui_ar=0' +
    '&ui_hint=0' +
    '&dnt=1';

  return (
    <div className="relative h-full w-full">
      <iframe
        title={title}
        src={src}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {/* Cover Sketchfab buy ($) + share chrome (always physical top-right inside iframe) */}
      <div
        className="pointer-events-auto absolute right-0 top-0 z-20 h-14 w-[7.5rem] rounded-bl-2xl bg-[#1b1b1b]"
        aria-hidden
      />
    </div>
  );
}

export function DentalHeroScene({ isAr = true, className = '' }: DentalHeroSceneProps) {
  const [mode, setMode] = useState<Mode>('denture');
  const model = MODELS[mode];

  const tabs: { id: Mode; label: string }[] = [
    { id: 'denture', label: isAr ? 'طقم أسنان' : 'Denture' },
    { id: 'teeth', label: isAr ? 'الأسنان' : 'Teeth' },
    { id: 'implant', label: isAr ? 'زرعة' : 'Implant' },
  ];

  return (
    <div className={`flex h-full min-h-[340px] flex-col gap-3 sm:min-h-[420px] md:min-h-full ${className}`}>
      {/* Tabs outside the iframe — always clickable */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label={isAr ? 'اختيار النموذج' : 'Choose model'}
          className="flex flex-1 flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-[#19314f] dark:bg-[#081426]"
        >
          {tabs.map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={`min-h-11 flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition sm:min-w-[7rem] ${
                  active
                    ? 'bg-[#101c38] text-white shadow-sm dark:bg-[#1fb6d1] dark:!text-[#04101c]'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-[#101c38] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-[#0b1528] shadow-[0_24px_60px_rgba(16,28,56,.14)] dark:border-[#19314f]">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <SketchfabFrame uid={model.uid} title={isAr ? model.titleAr : model.titleEn} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[#f7fafc] px-4 py-3 text-start dark:border-[#19314f] dark:bg-[#081426]">
        <p className="text-sm font-bold text-[#101c38] dark:text-white">
          {isAr ? model.titleAr : model.titleEn}
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {isAr ? model.bodyAr : model.bodyEn}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          {isAr ? 'المصدر: ' : 'Source: '}
          <a
            href={model.creditUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#1789a2] underline-offset-2 hover:underline"
          >
            {model.credit}
          </a>
          {' · '}
          {model.license}
        </p>
      </div>
    </div>
  );
}
