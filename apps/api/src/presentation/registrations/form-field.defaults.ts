import { FormFieldType } from '@prisma/client';

export type DefaultFormField = {
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string;
  placeholderEn?: string;
  type: FormFieldType;
  required: boolean;
  sortOrder: number;
  width: 'half' | 'full';
  options?: Array<{ ar: string; en: string; value: string }>;
};

export const DEFAULT_COURSE_FORM_FIELDS: DefaultFormField[] = [
  {
    key: 'fullName',
    labelAr: 'الاسم الكامل',
    labelEn: 'Full name',
    placeholderAr: 'الاسم الكامل',
    placeholderEn: 'Full name',
    type: FormFieldType.TEXT,
    required: true,
    sortOrder: 0,
    width: 'half',
  },
  {
    key: 'phone',
    labelAr: 'رقم الهاتف',
    labelEn: 'Phone number',
    placeholderAr: '07xxxxxxxxx',
    placeholderEn: '07xxxxxxxxx',
    type: FormFieldType.PHONE,
    required: true,
    sortOrder: 1,
    width: 'half',
  },
  {
    key: 'email',
    labelAr: 'البريد الإلكتروني',
    labelEn: 'Email address',
    placeholderAr: 'name@email.com',
    placeholderEn: 'name@email.com',
    type: FormFieldType.EMAIL,
    required: true,
    sortOrder: 2,
    width: 'half',
  },
  {
    key: 'city',
    labelAr: 'المدينة',
    labelEn: 'City',
    placeholderAr: 'المدينة',
    placeholderEn: 'City',
    type: FormFieldType.TEXT,
    required: true,
    sortOrder: 3,
    width: 'half',
  },
  {
    key: 'occupation',
    labelAr: 'المهنة',
    labelEn: 'Occupation',
    placeholderAr: 'المهنة',
    placeholderEn: 'Occupation',
    type: FormFieldType.TEXT,
    required: true,
    sortOrder: 4,
    width: 'half',
  },
  {
    key: 'experience',
    labelAr: 'سنوات الخبرة',
    labelEn: 'Years of experience',
    placeholderAr: 'مثلاً 3 سنوات',
    placeholderEn: 'e.g. 3 years',
    type: FormFieldType.TEXT,
    required: true,
    sortOrder: 5,
    width: 'half',
  },
  {
    key: 'notes',
    labelAr: 'ملاحظات إضافية',
    labelEn: 'Additional notes',
    placeholderAr: 'اختياري',
    placeholderEn: 'Optional',
    type: FormFieldType.TEXTAREA,
    required: false,
    sortOrder: 6,
    width: 'full',
  },
];

export function slugifyFieldKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\u0600-\u06FF]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || `field_${Date.now()}`;
}
