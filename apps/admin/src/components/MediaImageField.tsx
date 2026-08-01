import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState } from 'react';
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

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 16V6M8 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Single cover / image picker — simple for non-tech admins */
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
  const [libraryOpen, setLibraryOpen] = useState(false);

  const upload = useMutation({
    mutationFn: uploadFile,
    onSuccess: (asset) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      onChange(asset.url);
      notify.success(isAr ? 'تم رفع الصورة' : 'Image uploaded');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الرفع' : 'Upload failed')),
  });

  const library = images.filter((img) => img.url !== value);

  return (
    <div className={cn('media-field', className)}>
      <div className="media-field-head">
        <label htmlFor={fieldId}>{label}</label>
        <span>{isAr ? 'اختياري — صورة واضحة أفضل' : 'Optional — a clear photo works best'}</span>
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
        <div className="media-preview">
          <img src={value} alt="" />
          <div className="media-preview-actions">
            <Button type="button" size="sm" variant="secondary" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
              {upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'تغيير الصورة' : 'Change image'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onChange('')}>
              {isAr ? 'إزالة' : 'Remove'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="media-dropzone"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <span className="media-dropzone-icon">
            <UploadIcon />
          </span>
          <strong>{upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع صورة الغلاف' : 'Upload cover image'}</strong>
          <span>{isAr ? 'اضغط هنا واختَر صورة من جهازك' : 'Click here and pick an image from your device'}</span>
        </button>
      )}

      <div className="media-library-toggle">
        <button type="button" onClick={() => setLibraryOpen((v) => !v)}>
          {libraryOpen
            ? isAr
              ? 'إخفاء المكتبة'
              : 'Hide library'
            : isAr
              ? 'أو اختر صورة من المكتبة'
              : 'Or pick from the library'}
        </button>
      </div>

      {libraryOpen ? (
        <div className="media-library">
          {isLoading ? <p className="media-library-empty">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}
          {!isLoading && !library.length ? (
            <p className="media-library-empty">{isAr ? 'لا صور محفوظة بعد.' : 'No saved images yet.'}</p>
          ) : null}
          {library.length ? (
            <div className="media-library-grid">
              {library.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  title={img.name}
                  className="media-library-item"
                  onClick={() => {
                    onChange(img.url);
                    setLibraryOpen(false);
                  }}
                >
                  <img src={img.url} alt={img.name} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
  const [libraryOpen, setLibraryOpen] = useState(false);

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

  return (
    <div className={cn('media-field', className)}>
      <div className="media-field-head">
        <p>{label}</p>
        <span>
          {isAr
            ? `${value.length} صورة مختارة — ارفع أو اختر من المكتبة`
            : `${value.length} selected — upload or pick from library`}
        </span>
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
        <div className="media-multi-selected">
          {value.map((url) => (
            <div key={url} className="media-multi-item">
              <img src={url} alt="" />
              <button type="button" onClick={() => toggle(url)}>
                {isAr ? 'إزالة' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className="media-dropzone media-dropzone-sm"
        disabled={upload.isPending}
        onClick={() => fileRef.current?.click()}
      >
        <span className="media-dropzone-icon">
          <UploadIcon />
        </span>
        <strong>{upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع صور' : 'Upload images'}</strong>
        <span>{isAr ? 'يمكنك اختيار أكثر من صورة مرة واحدة' : 'You can select multiple images at once'}</span>
      </button>

      <div className="media-library-toggle">
        <button type="button" onClick={() => setLibraryOpen((v) => !v)}>
          {libraryOpen
            ? isAr
              ? 'إخفاء المكتبة'
              : 'Hide library'
            : isAr
              ? 'أو اختر من المكتبة'
              : 'Or pick from the library'}
        </button>
      </div>

      {libraryOpen ? (
        <div className="media-library">
          {isLoading ? <p className="media-library-empty">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}
          {!isLoading && !images.length ? (
            <p className="media-library-empty">{isAr ? 'لا صور محفوظة بعد.' : 'No saved images yet.'}</p>
          ) : null}
          {images.length ? (
            <div className="media-library-grid">
              {images.map((img) => {
                const active = value.includes(img.url);
                return (
                  <button
                    key={img.id}
                    type="button"
                    title={img.name}
                    className={cn('media-library-item', active && 'is-active')}
                    onClick={() => toggle(img.url)}
                  >
                    <img src={img.url} alt={img.name} />
                    {active ? <span className="media-check">✓</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
