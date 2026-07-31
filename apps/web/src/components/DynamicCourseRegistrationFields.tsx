import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type CourseFormField = {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  type: 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'SELECT';
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
        const span = field.width === 'full' || field.type === 'TEXTAREA' ? 'sm:col-span-2' : '';
        const value = values[field.key] || '';
        const setValue = (next: string) => onChange({ ...values, [field.key]: next });
        const options = Array.isArray(field.options) ? field.options : [];

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
