import { useCallback, useEffect, useRef, useState } from 'react';

type Size = 'sm' | 'md';

const SIZE_STYLES: Record<Size, { chip: string; arrow: string }> = {
  sm: {
    chip: 'max-w-[13.5rem] px-2.5 py-1.5 text-[11px]',
    arrow: 'h-7 w-7',
  },
  md: {
    chip: 'max-w-[16rem] px-3 py-1.5 text-[11px]',
    arrow: 'h-8 w-8',
  },
};

/** In RTL tracks scrollLeft runs from 0 down to -(scrollWidth - clientWidth). */
function isRtlTrack(el: HTMLElement) {
  return getComputedStyle(el).direction === 'rtl';
}

function IconChevron({ dir }: { dir: 'start' | 'end' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path
        d={dir === 'end' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QuickPromptsScroller({
  prompts,
  onSelect,
  disabled = false,
  isAr,
  size = 'sm',
  className = '',
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  isAr: boolean;
  size?: Size;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  // Tells a drag gesture apart from a click so dragging never fires a prompt.
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const offset = Math.abs(track.scrollLeft);
    setAtStart(offset <= 2);
    setAtEnd(max <= 2 || offset >= max - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    syncEdges();
    const observer = new ResizeObserver(syncEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [syncEdges, prompts]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function handleWheel(event: WheelEvent) {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollWidth - el.clientWidth <= 2) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = horizontal
        ? event.deltaX
        : event.deltaY * (isRtlTrack(el) ? -1 : 1);
      if (!delta) return;
      event.preventDefault();
      el.scrollBy({ left: delta * 1.4, behavior: 'auto' });
    }

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollByPage = useCallback((towards: 'start' | 'end') => {
    const track = trackRef.current;
    if (!track) return;
    const step = Math.max(track.clientWidth * 0.8, 160);
    const forward = towards === 'end' ? 1 : -1;
    const sign = isRtlTrack(track) ? -1 : 1;
    track.scrollBy({ left: step * forward * sign, behavior: 'smooth' });
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, startX: event.clientX, startScroll: track.scrollLeft, moved: false };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const track = trackRef.current;
    if (!track) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 4) drag.current.moved = true;
    track.scrollLeft = drag.current.startScroll - distance;
  }

  function endDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    window.setTimeout(() => {
      drag.current.moved = false;
    }, 0);
  }

  if (!prompts.length) return null;

  const styles = SIZE_STYLES[size];
  const scrollable = !(atStart && atEnd);
  const arrowBase = `${styles.arrow} grid shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[#1fb6d1] hover:text-[#0f7f94] disabled:pointer-events-none disabled:opacity-0 dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-slate-300`;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {scrollable ? (
        <button
          type="button"
          data-chat-control
          onClick={() => scrollByPage('start')}
          disabled={atStart}
          className={arrowBase}
          aria-label={isAr ? 'السابق' : 'Previous'}
        >
          <IconChevron dir="start" />
        </button>
      ) : null}

      <div
        ref={trackRef}
        onScroll={syncEdges}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="flex flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'x proximity', touchAction: 'pan-x' }}
      >
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            data-chat-control
            title={prompt}
            onClick={() => {
              if (drag.current.moved) return;
              onSelect(prompt);
            }}
            disabled={disabled}
            style={{ scrollSnapAlign: 'start' }}
            className={`${styles.chip} shrink-0 truncate rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-600 transition hover:border-[#1fb6d1] hover:bg-[#e8f9fc] hover:text-[#0f7f94] active:scale-[.97] disabled:opacity-45 dark:border-[#1a2f4d] dark:bg-[#0a1628] dark:text-slate-300 dark:hover:border-[#1fb6d1]`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {scrollable ? (
        <button
          type="button"
          data-chat-control
          onClick={() => scrollByPage('end')}
          disabled={atEnd}
          className={arrowBase}
          aria-label={isAr ? 'التالي' : 'Next'}
        >
          <IconChevron dir="end" />
        </button>
      ) : null}
    </div>
  );
}
