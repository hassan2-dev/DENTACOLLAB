import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { memoryStorage } from 'multer';
import { UserRole, PublishStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

export type ChatBotSettingsValue = {
  welcomeAr: string;
  welcomeEn: string;
  goodbyeAr: string;
  goodbyeEn: string;
  outOfScopeAr: string;
  outOfScopeEn: string;
};

export const DEFAULT_CHATBOT_SETTINGS: ChatBotSettingsValue = {
  welcomeAr: 'مرحباً بك في DentaCollab. اسألني عن الدورات، الورش، التسجيل، الدفع، أو الفواتير.',
  welcomeEn: 'Welcome to DentaCollab. Ask me about courses, workshops, registration, payments, or invoices.',
  goodbyeAr: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
  goodbyeEn: 'Thanks for chatting with us. Have a great day!',
  outOfScopeAr:
    'عذراً، ما عندي جواب جاهز لهذا السؤال. لأمور الدفع أو الفواتير أو أي استفسار آخر، تواصل مع الدعم عبر واتساب وسنساعدك.',
  outOfScopeEn:
    'Sorry, I do not have a ready answer for that. For payments, invoices, or anything else, reach support on WhatsApp and we will help.',
};

const MATCH_THRESHOLD = 0.42;
const ENTITY_MATCH_THRESHOLD = 0.34;
const COURSE_MATCH_THRESHOLD = ENTITY_MATCH_THRESHOLD;

const LEVEL_LABEL: Record<string, { ar: string; en: string }> = {
  STUDENTS: { ar: 'طلاب', en: 'Students' },
  BASIC: { ar: 'أساسي', en: 'Basic' },
  ADVANCED: { ar: 'متقدم', en: 'Advanced' },
};

function formatPrice(price: number | null | undefined, currency: string | null | undefined, locale: 'ar' | 'en') {
  if (price == null) return null;
  const amount = price.toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US');
  if ((currency || 'IQD') === 'USD') return locale === 'ar' ? `${amount} $` : `$${amount}`;
  return locale === 'ar' ? `${amount} د.ع` : `${amount} IQD`;
}

function isCoursesListIntent(message: string) {
  const q = normalizeText(message);
  return /^(شنو|ما هي|ماهي|ايش|what|which|list|show)?\s*(ال)?(دورات|دوره|كورسات|كورس|courses|programs)\b/.test(q)
    || /\b(دوراتكم|الدورات|الكورسات|كورساتكم|available courses|your courses)\b/.test(q)
    || q === 'دورات'
    || q === 'دوره'
    || q === 'كورسات'
    || q === 'كورس'
    || q === 'courses';
}

function isWorkshopsListIntent(message: string) {
  const q = normalizeText(message);
  return /^(شنو|ما هي|ماهي|ايش|what|which|list|show)?\s*(ال)?(ورش|ورشه|workshops)\b/.test(q)
    || /\b(ورشكم|الورش|available workshops|your workshops|upcoming workshops)\b/.test(q)
    || q === 'ورش'
    || q === 'ورشه'
    || q === 'workshops'
    || q === 'workshop';
}

function isInstructorsListIntent(message: string) {
  const q = normalizeText(message);
  return /^(شنو|من|ما هي|ماهي|ايش|who|what|which|list|show)?\s*(ال)?(مدربين|مدربيين|مدرب|محاضرين|اساتذه|اساتذ|استاذ|instructors|trainers|teachers|professors|faculty)\b/.test(q)
    || /\b(مدربينكم|المدربين|الاساتذه|اساتذتكم|فريق التدريب|available instructors|your instructors|your trainers|your teachers)\b/.test(q)
    || q === 'مدربين'
    || q === 'مدرب'
    || q === 'اساتذه'
    || q === 'الاساتذه'
    || q === 'استاذ'
    || q === 'instructors'
    || q === 'trainers'
    || q === 'teachers';
}

function isCourseQuestion(message: string) {
  const q = normalizeText(message);
  return /\b(دورة|دوره|كورس|كورسات|منهج|منهجها|محتوى|محتواها|سعر|مدة|تفاصيل|course|courses|curriculum|syllabus|program|exoplan|اكسوبلان|اكسو)\b/.test(
    q,
  );
}

function isWorkshopQuestion(message: string) {
  const q = normalizeText(message);
  return /\b(ورشه|ورشة|ورش|موعد|مكان|موقع|محاضر|workshop|event|when|where|presenter)\b/.test(q);
}

function isInstructorQuestion(message: string) {
  const q = normalizeText(message);
  return /\b(مدرب|مدربه|محاضر|استاذ|اساتذ|اساتذه|دكتور|خبرة|سيرة|biography|instructor|trainer|teacher|professor|doctor)\b/.test(q);
}

function formatDateTime(value: Date | string, locale: 'ar' | 'en') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

type CourseForChat = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  overview: string;
  overviewEn: string;
  objectives: string[];
  objectivesEn: string[];
  requirements: string[];
  duration: string;
  durationEn: string;
  certificate: string | null;
  certificateEn: string | null;
  level: string;
  price: number | null;
  currency: string | null;
  curriculum: Array<{ title: string; lessons: Array<{ title: string }> }>;
};

function scoreCourse(message: string, course: CourseForChat) {
  const slugAsWords = course.slug.replace(/-/g, ' ');
  let score = Math.max(
    scoreMatch(message, course.title),
    scoreMatch(message, course.titleEn),
    scoreMatch(message, slugAsWords) * 0.95,
  );

  const msg = normalizeText(message);
  const titleTokens = new Set([...tokenize(course.title), ...tokenize(course.titleEn), ...tokenize(slugAsWords)]);
  let hits = 0;
  for (const token of titleTokens) {
    if (token.length < 3) continue;
    if (msg.includes(token)) hits += 1;
  }
  if (hits >= 2) score = Math.max(score, 0.55 + Math.min(hits, 4) * 0.08);
  if (hits === 1 && isCourseQuestion(message)) score = Math.max(score, 0.4);

  if (/\b(exoplan|اكسوبلان|اكسو بلان|اكسو)\b/.test(msg) && /exoplan|اكسو/.test(normalizeText(`${course.title} ${course.titleEn} ${course.slug}`))) {
    score = Math.max(score, 0.45);
  }

  return score;
}

function pickLocalizedCourse(course: CourseForChat, locale: 'ar' | 'en'): CourseForChat {
  if (locale === 'ar') return course;
  return {
    ...course,
    title: course.titleEn || course.title,
    description: course.descriptionEn || course.description,
    overview: course.overviewEn || course.overview,
    objectives: course.objectivesEn.length ? course.objectivesEn : course.objectives,
    duration: course.durationEn || course.duration,
    certificate: course.certificateEn || course.certificate,
  };
}

function formatCourseAnswer(course: CourseForChat, locale: 'ar' | 'en') {
  const c = pickLocalizedCourse(course, locale);
  const level = LEVEL_LABEL[c.level]?.[locale] || c.level;
  const price = formatPrice(c.price, c.currency, locale);
  const modules = c.curriculum.slice(0, 8);
  const objectives = (c.objectives || []).slice(0, 6);
  const link = {
    to: `/courses/${c.slug}`,
    label: locale === 'en' ? 'Open course & register' : 'فتح الدورة والتسجيل',
  };

  if (locale === 'en') {
    const lines = [
      c.title,
      '',
      `Duration: ${c.duration}`,
      `Level: ${level}`,
      price ? `Price: ${price}` : null,
      c.certificate ? `Certificate: ${c.certificate}` : null,
      '',
      'Overview:',
      c.overview || c.description,
    ].filter((line) => line != null) as string[];

    if (objectives.length) {
      lines.push('', 'What you will learn:');
      for (const item of objectives) lines.push(`- ${item}`);
    }
    if (modules.length) {
      lines.push('', 'Curriculum:');
      modules.forEach((mod, index) => {
        lines.push(`${index + 1}. ${mod.title}`);
        for (const lesson of (mod.lessons || []).slice(0, 4)) {
          lines.push(`   • ${lesson.title}`);
        }
      });
    }
    return { text: lines.join('\n'), link };
  }

  const lines = [
    c.title,
    '',
    `المدة: ${c.duration}`,
    `المستوى: ${level}`,
    price ? `السعر: ${price}` : null,
    c.certificate ? `الشهادة: ${c.certificate}` : null,
    '',
    'نظرة عامة:',
    c.overview || c.description,
  ].filter((line) => line != null) as string[];

  if (objectives.length) {
    lines.push('', 'ماذا ستتعلم:');
    for (const item of objectives) lines.push(`- ${item}`);
  }
  if (modules.length) {
    lines.push('', 'المنهج:');
    modules.forEach((mod, index) => {
      lines.push(`${index + 1}. ${mod.title}`);
      for (const lesson of (mod.lessons || []).slice(0, 4)) {
        lines.push(`   • ${lesson.title}`);
      }
    });
  }
  return { text: lines.join('\n'), link };
}

function formatCoursesList(courses: CourseForChat[], locale: 'ar' | 'en') {
  if (!courses.length) {
    return locale === 'en'
      ? 'There are no published courses right now.'
      : 'لا توجد دورات منشورة حالياً.';
  }
  if (locale === 'en') {
    const lines = ['Our published courses:', ''];
    courses.forEach((c, i) => {
      const price = formatPrice(c.price, c.currency, 'en');
      lines.push(`${i + 1}. ${c.titleEn || c.title} — ${c.durationEn || c.duration}${price ? ` — ${price}` : ''}`);
    });
    lines.push('', 'Ask about any course by name to see its curriculum and details.');
    return lines.join('\n');
  }
  const lines = ['دوراتنا المنشورة حالياً:', ''];
  courses.forEach((c, i) => {
    const price = formatPrice(c.price, c.currency, 'ar');
    lines.push(`${i + 1}. ${c.title} — ${c.duration}${price ? ` — ${price}` : ''}`);
  });
  lines.push('', 'اكتب اسم أي دورة لأعطيك منهجها وتفاصيلها.');
  return lines.join('\n');
}

type WorkshopForChat = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  location: string;
  locationEn: string;
  presenter: string;
  presenterEn: string;
  startsAt: Date;
  endsAt: Date;
  isFeatured: boolean;
};

type InstructorForChat = {
  id: string;
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  biography: string;
  biographyEn: string;
  experience: string;
  experienceEn: string;
  certificates: string[];
  courseTitles: string[];
  courseTitlesEn: string[];
};

function scoreWorkshop(message: string, workshop: WorkshopForChat) {
  const slugAsWords = workshop.slug.replace(/-/g, ' ');
  let score = Math.max(
    scoreMatch(message, workshop.title),
    scoreMatch(message, workshop.titleEn),
    scoreMatch(message, slugAsWords) * 0.95,
    scoreMatch(message, workshop.presenter) * 0.85,
    scoreMatch(message, workshop.presenterEn) * 0.85,
  );

  const msg = normalizeText(message);
  const titleTokens = new Set([
    ...tokenize(workshop.title),
    ...tokenize(workshop.titleEn),
    ...tokenize(slugAsWords),
  ]);
  let hits = 0;
  for (const token of titleTokens) {
    if (token.length < 3) continue;
    if (msg.includes(token)) hits += 1;
  }
  if (hits >= 2) score = Math.max(score, 0.55 + Math.min(hits, 4) * 0.08);
  if (hits === 1 && isWorkshopQuestion(message)) score = Math.max(score, 0.4);
  return score;
}

function scoreInstructor(message: string, instructor: InstructorForChat) {
  let score = Math.max(
    scoreMatch(message, instructor.name),
    scoreMatch(message, instructor.nameEn),
    scoreMatch(message, instructor.title) * 0.7,
    scoreMatch(message, instructor.titleEn) * 0.7,
  );

  const msg = normalizeText(message);
  const nameTokens = new Set([...tokenize(instructor.name), ...tokenize(instructor.nameEn)]);
  let hits = 0;
  for (const token of nameTokens) {
    if (token.length < 2) continue;
    if (msg.includes(token)) hits += 1;
  }
  if (hits >= 2) score = Math.max(score, 0.6 + Math.min(hits, 3) * 0.1);
  if (hits === 1 && isInstructorQuestion(message)) score = Math.max(score, 0.42);
  // boost "د." / doctor + last name patterns already covered by token hits
  return score;
}

function formatWorkshopAnswer(workshop: WorkshopForChat, locale: 'ar' | 'en') {
  const title = locale === 'en' ? workshop.titleEn || workshop.title : workshop.title;
  const description =
    locale === 'en' ? workshop.descriptionEn || workshop.description : workshop.description;
  const location = locale === 'en' ? workshop.locationEn || workshop.location : workshop.location;
  const presenter =
    locale === 'en' ? workshop.presenterEn || workshop.presenter : workshop.presenter;
  const link = {
    to: `/workshops/${workshop.slug}`,
    label: locale === 'en' ? 'Open workshop' : 'فتح صفحة الورشة',
  };

  if (locale === 'en') {
    const lines = [
      title,
      '',
      `Starts: ${formatDateTime(workshop.startsAt, 'en')}`,
      `Ends: ${formatDateTime(workshop.endsAt, 'en')}`,
      location ? `Location: ${location}` : null,
      presenter ? `Presenter: ${presenter}` : null,
      workshop.isFeatured ? 'Featured workshop' : null,
      description ? ['', description].join('\n') : null,
    ].filter((line) => line != null) as string[];
    return { text: lines.join('\n'), link };
  }

  const lines = [
    title,
    '',
    `تبدأ: ${formatDateTime(workshop.startsAt, 'ar')}`,
    `تنتهي: ${formatDateTime(workshop.endsAt, 'ar')}`,
    location ? `المكان: ${location}` : null,
    presenter ? `المحاضر: ${presenter}` : null,
    workshop.isFeatured ? 'ورشة مميزة' : null,
    description ? ['', description].join('\n') : null,
  ].filter((line) => line != null) as string[];
  return { text: lines.join('\n'), link };
}

function formatWorkshopsList(workshops: WorkshopForChat[], locale: 'ar' | 'en') {
  if (!workshops.length) {
    return locale === 'en'
      ? 'There are no upcoming workshops right now.'
      : 'لا توجد ورش قادمة حالياً.';
  }
  if (locale === 'en') {
    const lines = ['Upcoming workshops:', ''];
    workshops.forEach((w, i) => {
      lines.push(
        `${i + 1}. ${w.titleEn || w.title} — ${formatDateTime(w.startsAt, 'en')}${
          w.locationEn || w.location ? ` — ${w.locationEn || w.location}` : ''
        }`,
      );
    });
    lines.push('', 'Ask about any workshop by name for full details.');
    return lines.join('\n');
  }
  const lines = ['الورش القادمة حالياً:', ''];
  workshops.forEach((w, i) => {
    lines.push(
      `${i + 1}. ${w.title} — ${formatDateTime(w.startsAt, 'ar')}${
        w.location ? ` — ${w.location}` : ''
      }`,
    );
  });
  lines.push('', 'اكتب اسم أي ورشة لأعطيك تفاصيلها.');
  return lines.join('\n');
}

function formatInstructorAnswer(instructor: InstructorForChat, locale: 'ar' | 'en') {
  const name = locale === 'en' ? instructor.nameEn || instructor.name : instructor.name;
  const title = locale === 'en' ? instructor.titleEn || instructor.title : instructor.title;
  const biography =
    locale === 'en' ? instructor.biographyEn || instructor.biography : instructor.biography;
  const experience =
    locale === 'en' ? instructor.experienceEn || instructor.experience : instructor.experience;
  const courses =
    locale === 'en' && instructor.courseTitlesEn.length
      ? instructor.courseTitlesEn
      : instructor.courseTitles;
  const bioShort = biography.length > 420 ? `${biography.slice(0, 420).trim()}…` : biography;
  const link = {
    to: `/instructors/${instructor.id}`,
    label: locale === 'en' ? 'Open instructor profile' : 'فتح ملف المدرب',
  };

  if (locale === 'en') {
    const lines = [name, title, '', bioShort || null, experience ? `Experience: ${experience}` : null];
    if (instructor.certificates.length) {
      lines.push('', 'Certificates:');
      for (const cert of instructor.certificates.slice(0, 6)) lines.push(`- ${cert}`);
    }
    if (courses.length) {
      lines.push('', 'Teaches:');
      for (const course of courses.slice(0, 6)) lines.push(`- ${course}`);
    }
    return { text: (lines.filter((line) => line != null) as string[]).join('\n'), link };
  }

  const lines = [name, title, '', bioShort || null, experience ? `الخبرة: ${experience}` : null];
  if (instructor.certificates.length) {
    lines.push('', 'الشهادات:');
    for (const cert of instructor.certificates.slice(0, 6)) lines.push(`- ${cert}`);
  }
  if (courses.length) {
    lines.push('', 'يدرّس:');
    for (const course of courses.slice(0, 6)) lines.push(`- ${course}`);
  }
  return { text: (lines.filter((line) => line != null) as string[]).join('\n'), link };
}

function formatInstructorsList(instructors: InstructorForChat[], locale: 'ar' | 'en') {
  if (!instructors.length) {
    return locale === 'en'
      ? 'There are no published instructors right now.'
      : 'لا يوجد مدربون منشورون حالياً.';
  }
  if (locale === 'en') {
    const lines = ['Our instructors:', ''];
    instructors.forEach((ins, i) => {
      lines.push(`${i + 1}. ${ins.nameEn || ins.name} — ${ins.titleEn || ins.title}`);
    });
    lines.push('', 'Ask about any instructor by name to see their profile.');
    return lines.join('\n');
  }
  const lines = ['مدربونا:', ''];
  instructors.forEach((ins, i) => {
    lines.push(`${i + 1}. ${ins.name} — ${ins.title}`);
  });
  lines.push('', 'اكتب اسم أي مدرب لأعطيك نبذة عنه.');
  return lines.join('\n');
}

class UpsertQaDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  questionAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  answerAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  questionEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  answerEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ChatBotSettingsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  welcomeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  welcomeEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  goodbyeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  goodbyeEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  outOfScopeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  outOfScopeEn!: string;
}

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input: string) {
  return normalizeText(input)
    .split(' ')
    .filter((t) => t.length > 1);
}

function scoreMatch(query: string, candidate: string) {
  const q = normalizeText(query);
  const c = normalizeText(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.92;

  const qTokens = new Set(tokenize(q));
  const cTokens = tokenize(c);
  if (!qTokens.size || !cTokens.length) return 0;

  let overlap = 0;
  for (const token of cTokens) {
    if (qTokens.has(token)) overlap += 1;
  }
  const union = new Set([...qTokens, ...cTokens]).size;
  const jaccard = overlap / union;
  const coverage = overlap / qTokens.size;
  return Math.max(jaccard, coverage * 0.85);
}

/** Boost FAQ matching for payment / invoice wording users often use. */
function paymentTopicBoost(message: string, question: string) {
  const msg = normalizeText(message);
  const q = normalizeText(question);
  const paymentHints = [
    'دفع',
    'دفعت',
    'فاتوره',
    'فاتورة',
    'invoice',
    'payment',
    'stripe',
    'ايميل',
    'إيميل',
    'email',
    'qr',
    'كيو ار',
    'تحميل',
    'download',
    'مسجلتش',
    'انسجلت',
    'تسجيل',
  ];
  const msgHits = paymentHints.filter((h) => msg.includes(normalizeText(h))).length;
  const qHits = paymentHints.filter((h) => q.includes(normalizeText(h))).length;
  if (msgHits === 0 || qHits === 0) return 0;
  return Math.min(0.28, 0.1 + msgHits * 0.04 + qHits * 0.03);
}

const GREETING_EXACT = new Set([
  'hi',
  'hello',
  'hey',
  'hola',
  'yo',
  'sup',
  'greetings',
  'good morning',
  'good afternoon',
  'good evening',
  'مرحبا',
  'مرحبه',
  'اهلا',
  'اهلا وسهلا',
  'اهلاً وسهلاً',
  'هلا',
  'هلا والله',
  'هاي',
  'السلام عليكم',
  'سلام عليكم',
  'السلام',
  'سلام',
  'صباح الخير',
  'مساء الخير',
  'يسعد صباحكم',
  'يسعد مساكم',
]);

const GREETING_PREFIX =
  /^(السلام عليكم|سلام عليكم|مرحبا|مرحبه|اهلا|هلا|هاي|صباح الخير|مساء الخير|hi+|hello|hey|good morning|good afternoon|good evening)\b/;

const GOODBYE_EXACT = new Set([
  'bye',
  'goodbye',
  'good bye',
  'see you',
  'thanks',
  'thank you',
  'thx',
  'باي',
  'وداعا',
  'مع السلامه',
  'مع السلامة',
  'الى اللقاء',
  'الي اللقاء',
  'شكرا',
  'شكرا لك',
  'شكراً',
  'مشكور',
  'تسلم',
]);

const GOODBYE_PREFIX =
  /^(bye|goodbye|see you|thanks|thank you|باي|وداعا|مع السلامه|مع السلامة|الى اللقاء|الي اللقاء|شكرا|مشكور)\b/;

function isGreeting(message: string) {
  const q = normalizeText(message);
  if (!q) return false;
  if (GREETING_EXACT.has(q)) return true;
  // short chat openers only — avoid matching long questions that start with hi
  if (q.length <= 40 && GREETING_PREFIX.test(q)) return true;
  return false;
}

function isGoodbye(message: string) {
  const q = normalizeText(message);
  if (!q) return false;
  if (GOODBYE_EXACT.has(q)) return true;
  if (q.length <= 40 && GOODBYE_PREFIX.test(q)) return true;
  return false;
}

function cell(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const found = Object.entries(row).find(([k]) => k.trim().toLowerCase() === key.toLowerCase());
    if (found && found[1] != null && String(found[1]).trim()) return String(found[1]).trim();
  }
  return '';
}

@Injectable()
export class ChatBotService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<ChatBotSettingsValue> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'chatbot' } });
    if (!row?.value || typeof row.value !== 'object') return { ...DEFAULT_CHATBOT_SETTINGS };
    return { ...DEFAULT_CHATBOT_SETTINGS, ...(row.value as Partial<ChatBotSettingsValue>) };
  }

  async updateSettings(dto: ChatBotSettingsDto) {
    const value = {
      welcomeAr: dto.welcomeAr,
      welcomeEn: dto.welcomeEn,
      goodbyeAr: dto.goodbyeAr,
      goodbyeEn: dto.goodbyeEn,
      outOfScopeAr: dto.outOfScopeAr,
      outOfScopeEn: dto.outOfScopeEn,
    };
    await this.prisma.setting.upsert({
      where: { key: 'chatbot' },
      create: { key: 'chatbot', value },
      update: { value },
    });
    return this.getSettings();
  }

  async bootstrap(locale: 'ar' | 'en' = 'ar') {
    const settings = await this.getSettings();
    const items = await this.prisma.chatBotQa.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 3,
      select: { questionAr: true, questionEn: true },
    });
    const shortLabel = (value: string, max = 36) => {
      const text = value.trim();
      if (text.length <= max) return text;
      return `${text.slice(0, max - 1).trim()}…`;
    };
    const courses = await this.loadPublishedCourses();
    const workshops = await this.loadPublishedWorkshops();
    const instructors = await this.loadPublishedInstructors();
    const coursePrompts = courses.slice(0, 2).map((c) =>
      locale === 'en'
        ? `About ${shortLabel(c.titleEn || c.title, 28)}`
        : `دورة ${shortLabel(c.title, 28)}`,
    );
    const workshopPrompts = workshops.slice(0, 1).map((w) =>
      locale === 'en'
        ? `Workshop: ${shortLabel(w.titleEn || w.title, 28)}`
        : `ورشة ${shortLabel(w.title, 28)}`,
    );
    const instructorPrompts = instructors.slice(0, 1).map((ins) =>
      locale === 'en'
        ? `Instructor: ${shortLabel(ins.nameEn || ins.name, 24)}`
        : `المدرب ${shortLabel(ins.name, 24)}`,
    );
    const listPrompts =
      locale === 'en'
        ? ['Our workshops', 'Our instructors']
        : ['الورش القادمة', 'المدربين'];
    const faqPrompts = items.map((i) => (locale === 'en' ? i.questionEn : i.questionAr));
    return {
      welcome: locale === 'en' ? settings.welcomeEn : settings.welcomeAr,
      goodbye: locale === 'en' ? settings.goodbyeEn : settings.goodbyeAr,
      outOfScope: locale === 'en' ? settings.outOfScopeEn : settings.outOfScopeAr,
      quickPrompts: [...listPrompts, ...coursePrompts, ...workshopPrompts, ...instructorPrompts, ...faqPrompts].slice(
        0,
        6,
      ),
    };
  }

  async listQa() {
    return this.prisma.chatBotQa.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createQa(dto: UpsertQaDto) {
    return this.prisma.chatBotQa.create({
      data: {
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateQa(id: string, dto: Partial<UpsertQaDto>) {
    const existing = await this.prisma.chatBotQa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('QA not found');
    return this.prisma.chatBotQa.update({
      where: { id },
      data: {
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeQa(id: string) {
    const existing = await this.prisma.chatBotQa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('QA not found');
    await this.prisma.chatBotQa.delete({ where: { id } });
    return { ok: true };
  }

  async importExcel(file: Express.Multer.File) {
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const created: string[] = [];
    let skipped = 0;

    for (const row of rows) {
      const questionAr = cell(row, 'question_ar', 'questionAr', 'سؤال', 'السؤال');
      const answerAr = cell(row, 'answer_ar', 'answerAr', 'جواب', 'الإجابة', 'اجابة');
      const questionEn = cell(row, 'question_en', 'questionEn', 'question');
      const answerEn = cell(row, 'answer_en', 'answerEn', 'answer');
      if (!questionAr || !answerAr || !questionEn || !answerEn) {
        skipped += 1;
        continue;
      }
      const item = await this.prisma.chatBotQa.create({
        data: { questionAr, answerAr, questionEn, answerEn },
      });
      created.push(item.id);
    }

    return { imported: created.length, skipped, ids: created };
  }

  private async whatsappUrl(userMessage: string, locale: 'ar' | 'en') {
    const general = await this.prisma.setting.findUnique({ where: { key: 'general' } });
    const value = (general?.value ?? {}) as { whatsapp?: string };
    const digits = (value.whatsapp || '').replace(/[^\d]/g, '');
    if (!digits) return null;
    const prefix =
      locale === 'en'
        ? 'Hello DentaCollab support, I have a question:\n'
        : 'مرحباً دعم DentaCollab، لدي سؤال:\n';
    return `https://wa.me/${digits}?text=${encodeURIComponent(prefix + userMessage)}`;
  }

  private async loadPublishedCourses(): Promise<CourseForChat[]> {
    const rows = await this.prisma.course.findMany({
      where: { status: PublishStatus.PUBLISHED },
      include: {
        translations: true,
        curriculum: {
          orderBy: { sortOrder: 'asc' },
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => {
      const ar = row.translations.find((t) => t.locale === 'ar');
      const en = row.translations.find((t) => t.locale === 'en');
      return {
        id: row.id,
        slug: row.slug,
        title: ar?.title || row.title,
        titleEn: en?.title || row.title,
        description: ar?.description || row.description,
        descriptionEn: en?.description || row.description,
        overview: ar?.overview || row.overview,
        overviewEn: en?.overview || row.overview,
        objectives: ar?.objectives?.length ? ar.objectives : row.objectives,
        objectivesEn: en?.objectives?.length ? en.objectives : row.objectives,
        requirements: ar?.requirements?.length ? ar.requirements : row.requirements,
        duration: ar?.duration || row.duration,
        durationEn: en?.duration || row.duration,
        certificate: (ar?.certificate || row.certificate) ?? null,
        certificateEn: (en?.certificate || row.certificate) ?? null,
        level: row.level,
        price: row.price != null ? Number(row.price) : null,
        currency: row.currency,
        curriculum: row.curriculum.map((mod) => ({
          title: mod.title,
          lessons: mod.lessons.map((lesson) => ({ title: lesson.title })),
        })),
      };
    });
  }

  private async loadPublishedWorkshops(): Promise<WorkshopForChat[]> {
    const rows = await this.prisma.calendarEvent.findMany({
      where: {
        isPublished: true,
        endsAt: { gte: new Date() },
      },
      orderBy: { startsAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      titleEn: row.titleEn || row.title,
      description: row.description || '',
      descriptionEn: row.descriptionEn || row.description || '',
      location: row.location || '',
      locationEn: row.locationEn || row.location || '',
      presenter: row.presenterAr || '',
      presenterEn: row.presenterEn || row.presenterAr || '',
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      isFeatured: row.isFeatured,
    }));
  }

  private async loadPublishedInstructors(): Promise<InstructorForChat[]> {
    const rows = await this.prisma.instructor.findMany({
      where: { isPublished: true },
      include: {
        translations: true,
        courses: {
          include: {
            course: { include: { translations: true } },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => {
      const ar = row.translations.find((t) => t.locale === 'ar');
      const en = row.translations.find((t) => t.locale === 'en');
      const publishedCourses = row.courses
        .map((link) => link.course)
        .filter((course) => course.status === PublishStatus.PUBLISHED);
      return {
        id: row.id,
        name: ar?.name || row.name,
        nameEn: en?.name || row.name,
        title: ar?.title || row.title,
        titleEn: en?.title || row.title,
        biography: ar?.biography || row.biography,
        biographyEn: en?.biography || row.biography,
        experience: ar?.experience || row.experience,
        experienceEn: en?.experience || row.experience,
        certificates: (ar?.certificates?.length ? ar.certificates : row.certificates) || [],
        courseTitles: publishedCourses.map((course) => {
          const courseAr = course.translations.find((t) => t.locale === 'ar');
          return courseAr?.title || course.title;
        }),
        courseTitlesEn: publishedCourses.map((course) => {
          const courseEn = course.translations.find((t) => t.locale === 'en');
          return courseEn?.title || course.title;
        }),
      };
    });
  }

  async ask(message: string, locale: 'ar' | 'en' = 'ar') {
    const settings = await this.getSettings();

    if (isGreeting(message)) {
      return {
        matched: true as const,
        answer: locale === 'en' ? settings.welcomeEn : settings.welcomeAr,
        mode: 'greeting' as const,
      };
    }

    if (isGoodbye(message)) {
      return {
        matched: true as const,
        answer: locale === 'en' ? settings.goodbyeEn : settings.goodbyeAr,
        mode: 'goodbye' as const,
      };
    }

    const [courses, workshops, instructors] = await Promise.all([
      this.loadPublishedCourses(),
      this.loadPublishedWorkshops(),
      this.loadPublishedInstructors(),
    ]);

    if (isCoursesListIntent(message)) {
      return {
        matched: true as const,
        answer: formatCoursesList(courses, locale),
        link: {
          to: '/courses',
          label: locale === 'en' ? 'Browse all courses' : 'تصفّح كل الدورات',
        },
        mode: 'course' as const,
      };
    }

    if (isWorkshopsListIntent(message)) {
      return {
        matched: true as const,
        answer: formatWorkshopsList(workshops, locale),
        link: {
          to: '/workshops',
          label: locale === 'en' ? 'Browse workshops' : 'تصفّح الورش',
        },
        mode: 'workshop' as const,
      };
    }

    if (isInstructorsListIntent(message)) {
      return {
        matched: true as const,
        answer: formatInstructorsList(instructors, locale),
        link: {
          to: '/instructors',
          label: locale === 'en' ? 'Meet the instructors' : 'تعرّف على المدربين',
        },
        mode: 'instructor' as const,
      };
    }

    let bestCourse: { score: number; course: CourseForChat } | null = null;
    for (const course of courses) {
      const score = scoreCourse(message, course);
      if (!bestCourse || score > bestCourse.score) bestCourse = { score, course };
    }

    let bestWorkshop: { score: number; workshop: WorkshopForChat } | null = null;
    for (const workshop of workshops) {
      const score = scoreWorkshop(message, workshop);
      if (!bestWorkshop || score > bestWorkshop.score) bestWorkshop = { score, workshop };
    }

    let bestInstructor: { score: number; instructor: InstructorForChat } | null = null;
    for (const instructor of instructors) {
      const score = scoreInstructor(message, instructor);
      if (!bestInstructor || score > bestInstructor.score) bestInstructor = { score, instructor };
    }

    const entityCandidates = [
      bestCourse
        ? { kind: 'course' as const, score: bestCourse.score, payload: bestCourse.course }
        : null,
      bestWorkshop
        ? { kind: 'workshop' as const, score: bestWorkshop.score, payload: bestWorkshop.workshop }
        : null,
      bestInstructor
        ? {
            kind: 'instructor' as const,
            score: bestInstructor.score,
            payload: bestInstructor.instructor,
          }
        : null,
    ].filter(Boolean) as Array<
      | { kind: 'course'; score: number; payload: CourseForChat }
      | { kind: 'workshop'; score: number; payload: WorkshopForChat }
      | { kind: 'instructor'; score: number; payload: InstructorForChat }
    >;

    entityCandidates.sort((a, b) => b.score - a.score);
    const bestEntity = entityCandidates[0] || null;

    if (bestEntity && bestEntity.score >= ENTITY_MATCH_THRESHOLD) {
      if (bestEntity.kind === 'course') {
        const formatted = formatCourseAnswer(bestEntity.payload, locale);
        return {
          matched: true as const,
          answer: formatted.text,
          link: formatted.link,
          mode: 'course' as const,
        };
      }
      if (bestEntity.kind === 'workshop') {
        const formatted = formatWorkshopAnswer(bestEntity.payload, locale);
        return {
          matched: true as const,
          answer: formatted.text,
          link: formatted.link,
          mode: 'workshop' as const,
        };
      }
      const formatted = formatInstructorAnswer(bestEntity.payload, locale);
      return {
        matched: true as const,
        answer: formatted.text,
        link: formatted.link,
        mode: 'instructor' as const,
      };
    }

    const items = await this.prisma.chatBotQa.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    let best: { score: number; answer: string } | null = null;
    for (const item of items) {
      const primaryQ = locale === 'en' ? item.questionEn : item.questionAr;
      const fallbackQ = locale === 'en' ? item.questionAr : item.questionEn;
      const primaryA = locale === 'en' ? item.answerEn : item.answerAr;
      const score =
        Math.max(scoreMatch(message, primaryQ), scoreMatch(message, fallbackQ) * 0.9) +
        paymentTopicBoost(message, `${item.questionAr} ${item.questionEn} ${item.answerAr}`);
      if (!best || score > best.score) best = { score, answer: primaryA };
    }

    if (best && best.score >= MATCH_THRESHOLD) {
      return { matched: true as const, answer: best.answer, mode: 'faq' as const };
    }

    if (bestCourse && bestCourse.score >= 0.28 && isCourseQuestion(message)) {
      const formatted = formatCourseAnswer(bestCourse.course, locale);
      return {
        matched: true as const,
        answer: formatted.text,
        link: formatted.link,
        mode: 'course' as const,
      };
    }

    if (bestWorkshop && bestWorkshop.score >= 0.28 && isWorkshopQuestion(message)) {
      const formatted = formatWorkshopAnswer(bestWorkshop.workshop, locale);
      return {
        matched: true as const,
        answer: formatted.text,
        link: formatted.link,
        mode: 'workshop' as const,
      };
    }

    if (bestInstructor && bestInstructor.score >= 0.28 && isInstructorQuestion(message)) {
      const formatted = formatInstructorAnswer(bestInstructor.instructor, locale);
      return {
        matched: true as const,
        answer: formatted.text,
        link: formatted.link,
        mode: 'instructor' as const,
      };
    }

    const outOfScope = locale === 'en' ? settings.outOfScopeEn : settings.outOfScopeAr;
    const whatsappUrl = await this.whatsappUrl(message, locale);
    return {
      matched: false as const,
      answer: outOfScope,
      whatsappUrl,
      mode: 'whatsapp' as const,
    };
  }
}

@ApiTags('chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatBotController {
  constructor(private readonly service: ChatBotService) {}

  @Public()
  @Get('bootstrap')
  bootstrap(@Query('locale') locale?: string) {
    const lang = locale === 'en' ? 'en' : 'ar';
    return this.service.bootstrap(lang);
  }

  @Public()
  @Get('settings')
  getSettings() {
    return this.service.getSettings();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put('settings')
  updateSettings(@Body() dto: ChatBotSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('qa')
  listQa() {
    return this.service.listQa();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('qa')
  createQa(@Body() dto: UpsertQaDto) {
    return this.service.createQa(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('qa/:id')
  updateQa(@Param('id') id: string, @Body() dto: UpsertQaDto) {
    return this.service.updateQa(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Delete('qa/:id')
  removeQa(@Param('id') id: string) {
    return this.service.removeQa(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('qa/import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Excel file required');
    return this.service.importExcel(file);
  }
}

@Module({
  controllers: [ChatBotController],
  providers: [ChatBotService],
  exports: [ChatBotService],
})
export class ChatBotModule {}
