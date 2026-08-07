-- Course prices are USD-only
ALTER TABLE "Course" ALTER COLUMN "currency" SET DEFAULT 'USD';
UPDATE "Course" SET "currency" = 'USD' WHERE "currency" IS DISTINCT FROM 'USD';

-- Allow IMAGE type on registration form fields
DO $$ BEGIN
  ALTER TYPE "FormFieldType" ADD VALUE 'IMAGE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
