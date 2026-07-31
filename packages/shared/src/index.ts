import { z } from 'zod';

export const CourseLevelSchema = z.enum(['STUDENTS', 'BASIC', 'ADVANCED']);
export type CourseLevel = z.infer<typeof CourseLevelSchema>;

export const PublishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type PublishStatus = z.infer<typeof PublishStatusSchema>;

export const RegistrationStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'CONFIRMED',
  'REJECTED',
  'COMPLETED',
]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

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
  sessionId: z.string().uuid().optional(),
});
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const API_PREFIX = '/api/v1';
