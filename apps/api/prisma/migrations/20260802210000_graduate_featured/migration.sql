-- Featured graduates selected by admin for homepage success stories
ALTER TABLE "Graduate" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
