import { PublishStatus } from '@prisma/client';

export type RegistrationWindowState = 'BEFORE_START' | 'OPEN' | 'EXPIRED' | 'MANUALLY_CLOSED' | 'COURSE_CLOSED';

export type CourseRegistrationWindow = {
  registrationStartsAt: Date | null;
  registrationEndsAt: Date | null;
  registrationClosedManually: boolean;
  status: PublishStatus;
  allowRegistration?: boolean;
};

export function getRegistrationWindowState(
  course: CourseRegistrationWindow,
  now = new Date(),
): RegistrationWindowState {
  if (course.status === PublishStatus.CLOSED || course.status === PublishStatus.ARCHIVED) {
    return 'COURSE_CLOSED';
  }
  if (course.allowRegistration === false || course.registrationClosedManually) {
    return 'MANUALLY_CLOSED';
  }
  if (course.registrationStartsAt && now < course.registrationStartsAt) return 'BEFORE_START';
  if (course.registrationEndsAt && now > course.registrationEndsAt) return 'EXPIRED';
  return 'OPEN';
}

export function isRegistrationOpen(course: CourseRegistrationWindow, now = new Date()) {
  return getRegistrationWindowState(course, now) === 'OPEN' && course.status === PublishStatus.PUBLISHED;
}

export function registrationWindowLabels(state: RegistrationWindowState, isAr: boolean) {
  const map: Record<RegistrationWindowState, { ar: string; en: string; ctaAr: string; ctaEn: string }> = {
    BEFORE_START: {
      ar: 'التسجيل يفتح قريباً',
      en: 'Registration opens soon',
      ctaAr: 'التسجيل يفتح قريباً',
      ctaEn: 'Opens soon',
    },
    OPEN: {
      ar: 'التسجيل مفتوح',
      en: 'Registration open',
      ctaAr: 'سجّل الآن',
      ctaEn: 'Register Now',
    },
    EXPIRED: {
      ar: 'انتهى التسجيل',
      en: 'Registration closed',
      ctaAr: 'التسجيل مغلق',
      ctaEn: 'Registration Closed',
    },
    MANUALLY_CLOSED: {
      ar: 'التسجيل مغلق',
      en: 'Registration closed',
      ctaAr: 'التسجيل مغلق',
      ctaEn: 'Registration Closed',
    },
    COURSE_CLOSED: {
      ar: 'الدورة مغلقة',
      en: 'Course closed',
      ctaAr: 'التسجيل مغلق',
      ctaEn: 'Registration Closed',
    },
  };
  const item = map[state];
  return {
    label: isAr ? item.ar : item.en,
    cta: isAr ? item.ctaAr : item.ctaEn,
    state,
  };
}
