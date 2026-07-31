-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "presenterAr" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "presenterEn" TEXT;
