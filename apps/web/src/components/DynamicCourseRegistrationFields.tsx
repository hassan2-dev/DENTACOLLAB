import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { API_URL, api } from '../lib/api';

export type CourseFormField = {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  type: 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'SELECT' | 'IMAGE';
  required: boolean;
  options: Array<{ ar: string; en: string; value: string }> | unknown;
  width: string;
};

const fieldClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1fb6d1] focus:ring-4 focus:ring-[#1fb6d1]/15 dark:border-[#1f3658] dark:bg-[#071426] dark:text-white dark:placeholder:text-slate-500';

export function useCourseFormFields(courseIdOrSlug?: string) {
  return useQuery({
    queryKey: ['course-form-fields', courseIdOrSlug],
    queryFn: () => api<CourseFormField[]>(`/courses/${courseIdOrSlug}/form-fields`),
    enabled: Boolean(courseIdOrSlug),
  });
}

async function uploadRegistrationImage(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const locale = localStorage.getItem('dentacollab-locale') === 'en' ? 'en' : 'ar';
  const res = await fetch(`${API_URL}/registrations/upload-image?locale=${locale}`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json() as Promise<{ url: string }>;
}

function ImageFieldInput({
  label,
  required,
  value,
  isAr,
  onChange,
  className,
}: {
  label: string;
  required: boolean;
  value: string;
  isAr: boolean;
  onChange: (url: string) => void;
  className: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: uploadRegistrationImage,
    onSuccess: (data) => {
      setError(null);
      onChange(data.url);
    },
    onError: (err: Error) => {
      setError(err.message || (isAr ? 'فشل رفع الصورة' : 'Image upload failed'));
    },
  });

  return (
    <div className="block sm:col-span-2">
      <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        required={required && !value}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setError(isAr ? 'الحد الأقصى للصورة 5MB' : 'Max image size is 5MB');
            return;
          }
          upload.mutate(file);
        }}
      />
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-[#1f3658] dark:bg-[#071426]">
          <img src={value} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${className} !w-auto px-4 py-2`}
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
            >
              {isAr ? 'تغيير الصورة' : 'Change image'}
            </button>
            <button
              type="button"
              className={`${className} !w-auto px-4 py-2`}
              onClick={() => onChange('')}
              disabled={upload.isPending}
            >
              {isAr ? 'إزالة' : 'Remove'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`${className} text-left`}
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending
            ? isAr
              ? 'جاري الرفع...'
              : 'Uploading...'
            : isAr
              ? 'اضغط لرفع صورة'
              : 'Click to upload an image'}
        </button>
      )}
      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

export function DynamicCourseRegistrationFields({
  courseIdOrSlug,
  isAr,
  values,
  onChange,
  className = fieldClass,
}: {
  courseIdOrSlug?: string;
  isAr: boolean;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  className?: string;
}) {
  const fields = useCourseFormFields(courseIdOrSlug);
  const list = fields.data || [];

  if (!courseIdOrSlug) return null;
  if (fields.isLoading) {
    return (
      <p className="sm:col-span-2 text-center text-sm text-slate-500">
        {isAr ? 'جاري تحميل حقول النموذج...' : 'Loading form fields...'}
      </p>
    );
  }

  return (
    <>
      {list.map((field) => {
        const label = isAr ? field.labelAr : field.labelEn;
        const placeholder = (isAr ? field.placeholderAr : field.placeholderEn) || label;
        const span = field.width === 'full' || field.type === 'TEXTAREA' || field.type === 'IMAGE' ? 'sm:col-span-2' : '';
        const value = values[field.key] || '';
        const setValue = (next: string) => onChange({ ...values, [field.key]: next });
        const options = Array.isArray(field.options) ? field.options : [];

        if (field.type === 'IMAGE') {
          return (
            <ImageFieldInput
              key={field.id}
              label={label}
              required={field.required}
              value={value}
              isAr={isAr}
              onChange={setValue}
              className={className}
            />
          );
        }

        if (field.type === 'TEXTAREA') {
          return (
            <label key={field.id} className={`block ${span}`}>
              <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                {label}
                {field.required ? ' *' : ''}
              </span>
              <textarea
                className={className}
                rows={3}
                required={field.required}
                placeholder={placeholder || undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
          );
        }

        if (field.type === 'SELECT') {
          return (
            <label key={field.id} className={`block ${span}`}>
              <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                {label}
                {field.required ? ' *' : ''}
              </span>
              <select
                className={className}
                required={field.required}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                {options.map((opt: any) => (
                  <option key={opt.value || opt.en || opt.ar} value={opt.value || opt.en || opt.ar}>
                    {isAr ? opt.ar || opt.en : opt.en || opt.ar}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        const inputType =
          field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : field.type === 'NUMBER' ? 'number' : 'text';

        return (
          <label key={field.id} className={`block ${span}`}>
            <span className="mb-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
              {label}
              {field.required ? ' *' : ''}
            </span>
            <input
              className={className}
              type={inputType}
              required={field.required}
              placeholder={placeholder || undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
        );
      })}
    </>
  );
}
