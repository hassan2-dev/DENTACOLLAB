import { z } from 'zod';

export const CourseLevelSchema = z.enum(['STUDENTS', 'BASIC', 'ADVANCED']);
export type CourseLevel = z.infer<typeof CourseLevelSchema>;

export const PublishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']);
export type PublishStatus = z.infer<typeof PublishStatusSchema>;

export const RegistrationStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CONFIRMED',
  'REJECTED',
  'COMPLETED',
]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentProviderSchema = z.enum([
  'STRIPE',
  'PAYPAL',
  'APPLE_PAY',
  'GOOGLE_PAY',
]);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const CreateCheckoutSessionSchema = z.object({
  courseIdOrSlug: z.string().min(1),
  answers: z.record(z.string()).optional(),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(30).optional(),
  email: z.string().email().optional(),
  locale: z.enum(['ar', 'en']).optional(),
});
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const MediaTypeSchema = z.enum([
  'IMAGE',
  'VIDEO',
  'PDF',
  'WORD',
  'EXCEL',
  'OTHER',
]);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const CourseRegistrationSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email(),
  city: z.string().min(2).max(80),
  occupation: z.string().min(2).max(120),
  experience: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
});
export type CourseRegistrationInput = z.infer<typeof CourseRegistrationSchema>;

export const ContactMessageSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(30).optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(5000),
});
export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  locale: z.enum(['ar', 'en']).optional(),
  sessionId: z.string().uuid().optional(),
});
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const ChatBotQaSchema = z.object({
  questionAr: z.string().min(2).max(500),
  answerAr: z.string().min(2).max(5000),
  questionEn: z.string().min(2).max(500),
  answerEn: z.string().min(2).max(5000),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type ChatBotQaInput = z.infer<typeof ChatBotQaSchema>;

export const ChatBotSettingsSchema = z.object({
  welcomeAr: z.string().min(1).max(1000),
  welcomeEn: z.string().min(1).max(1000),
  goodbyeAr: z.string().min(1).max(1000),
  goodbyeEn: z.string().min(1).max(1000),
  outOfScopeAr: z.string().min(1).max(1000),
  outOfScopeEn: z.string().min(1).max(1000),
});
export type ChatBotSettingsInput = z.infer<typeof ChatBotSettingsSchema>;

export const API_PREFIX = '/api/v1';
