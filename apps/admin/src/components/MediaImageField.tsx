import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useRef } from 'react';
import { api } from '../lib/api';
import { useAdminPreferences } from './AdminLayout';
import { Button } from './ui/button';
import { notify } from '../lib/toast';
import { cn } from '@/lib/utils';

type MediaAsset = {
  id: string;
  name: string;
  url: string;
  type: string;
};

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return api<MediaAsset>('/media/upload', { method: 'POST', body: fd });
}

function useMediaImages() {
  return useQuery({
    queryKey: ['media', 'IMAGE'],
    queryFn: () => api<MediaAsset[]>('/media?type=IMAGE'),
  });
}

/** Single cover / image picker — visual grid, no dropdown */
export function MediaImageField({
  id,
  label,
  value,
  onChange,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const fileRef = useRef<HTMLInputElement>(null);
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const { data: images = [], isLoading } = useMediaImages();

  const upload = useMutation({
    mutationFn: uploadFile,
    onSuccess: (asset) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      onChange(asset.url);
      notify.success(isAr ? 'تم رفع الصورة' : 'Image uploaded');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الرفع' : 'Upload failed')),
  });

  const library = [...images];
  if (value && !library.some((img) => img.url === value)) {
    library.unshift({ id: 'current', name: isAr ? 'الحالية' : 'Current', url: value, type: 'IMAGE' });
  }

  return (
    <div className={className || ''}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-sm font-semibold text-[var(--color-ink)]">
          {label}
        </label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
            {upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع صورة' : 'Upload'}
          </Button>
          {value ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange('')}>
              {isAr ? 'مسح' : 'Clear'}
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        id={fieldId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = '';
        }}
      />

      {value ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
          <img src={value} alt="" className="h-40 w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-3 grid h-40 w-full place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink-muted)] transition hover:border-[#1fb6d1] hover:text-[#1fb6d1]"
        >
          {isAr ? 'اضغط لرفع صورة الغلاف' : 'Click to upload cover image'}
        </button>
      )}

      {isLoading ? <p className="text-xs text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}

      {library.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {library.map((img) => {
            const active = img.url === value;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onChange(active ? '' : img.url)}
                className={cn(
                  'overflow-hidden rounded-lg border-2 transition',
                  active ? 'border-[#1fb6d1] ring-2 ring-[#1fb6d1]/25' : 'border-transparent hover:border-[var(--color-border)]',
                )}
                title={img.name}
              >
                <img src={img.url} alt={img.name} className="aspect-square w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : !isLoading ? (
        <p className="text-xs text-[var(--color-ink-muted)]">
          {isAr ? 'لا صور في المكتبة بعد.' : 'No images in the library yet.'}
        </p>
      ) : null}
    </div>
  );
}

/** Multi-image picker for album interiors */
export function MediaImagesField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const { data: images = [], isLoading } = useMediaImages();

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: MediaAsset[] = [];
      for (const file of files) {
        uploaded.push(await uploadFile(file));
      }
      return uploaded;
    },
    onSuccess: (assets) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      const next = [...value];
      for (const asset of assets) {
        if (!next.includes(asset.url)) next.push(asset.url);
      }
      onChange(next);
      notify.success(isAr ? `تم رفع ${assets.length} صورة` : `Uploaded ${assets.length} image(s)`);
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الرفع' : 'Upload failed')),
  });

  function toggle(url: string) {
    if (value.includes(url)) onChange(value.filter((item) => item !== url));
    else onChange([...value, url]);
  }

  const library = [...images];
  for (const url of value) {
    if (!library.some((img) => img.url === url)) {
      library.unshift({ id: url, name: isAr ? 'مختارة' : 'Selected', url, type: 'IMAGE' });
    }
  }

  return (
    <div className={className || ''}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
            {isAr
              ? `${value.length} صورة مختارة — اضغط للإضافة/الإزالة`
              : `${value.length} selected — click to add/remove`}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
          {upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع عدة صور' : 'Upload images'}
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) upload.mutate(files);
          e.target.value = '';
        }}
      />

      {value.length ? (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-xl border border-[var(--color-border)]">
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => toggle(url)}
                className="absolute end-1.5 top-1.5 rounded-md bg-[#e5485d] px-2 py-1 text-[10px] font-bold text-white opacity-90 transition group-hover:opacity-100"
              >
                {isAr ? 'إزالة' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-3 grid h-28 w-full place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink-muted)] transition hover:border-[#1fb6d1] hover:text-[#1fb6d1]"
        >
          {isAr ? 'ارفع صور الألبوم الداخلية' : 'Upload album interior images'}
        </button>
      )}

      {isLoading ? <p className="text-xs text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}

      {library.length ? (
        <>
          <p className="mb-2 text-[11px] font-bold text-[var(--color-ink-muted)]">
            {isAr ? 'من المكتبة' : 'From library'}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {library.map((img) => {
              const active = value.includes(img.url);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => toggle(img.url)}
                  className={cn(
                    'relative overflow-hidden rounded-lg border-2 transition',
                    active ? 'border-[#1fb6d1] ring-2 ring-[#1fb6d1]/25' : 'border-transparent hover:border-[var(--color-border)]',
                  )}
                  title={img.name}
                >
                  <img src={img.url} alt={img.name} className="aspect-square w-full object-cover" />
                  {active ? (
                    <span className="absolute inset-x-0 bottom-0 bg-[#101c38]/75 py-0.5 text-center text-[10px] font-bold text-white">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
