-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "titleEn" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "locationEn" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CalendarEvent"
SET "slug" = CONCAT('workshop-', "id")
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "CalendarEvent" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "CalendarEvent_slug_key" ON "CalendarEvent"("slug");
CREATE INDEX IF NOT EXISTS "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_isPublished_isFeatured_idx" ON "CalendarEvent"("isPublished", "isFeatured");
CREATE INDEX IF NOT EXISTS "CalendarEvent_endsAt_idx" ON "CalendarEvent"("endsAt");
