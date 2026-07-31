-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'SELECT');

-- CreateTable
CREATE TABLE "CourseFormField" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "placeholderAr" TEXT,
    "placeholderEn" TEXT,
    "type" "FormFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "width" TEXT NOT NULL DEFAULT 'half',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseFormField_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CourseRegistration" ADD COLUMN IF NOT EXISTS "answers" JSONB;
ALTER TABLE "CourseRegistration" ALTER COLUMN "city" SET DEFAULT '';
ALTER TABLE "CourseRegistration" ALTER COLUMN "occupation" SET DEFAULT '';
ALTER TABLE "CourseRegistration" ALTER COLUMN "experience" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "CourseFormField_courseId_sortOrder_idx" ON "CourseFormField"("courseId", "sortOrder");
CREATE UNIQUE INDEX "CourseFormField_courseId_key_key" ON "CourseFormField"("courseId", "key");

-- AddForeignKey
ALTER TABLE "CourseFormField" ADD CONSTRAINT "CourseFormField_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default registration fields for existing courses
INSERT INTO "CourseFormField" ("id", "courseId", "key", "labelAr", "labelEn", "placeholderAr", "placeholderEn", "type", "required", "options", "sortOrder", "width", "createdAt", "updatedAt")
SELECT
  md5(c.id || f.key),
  c.id,
  f.key,
  f."labelAr",
  f."labelEn",
  f."placeholderAr",
  f."placeholderEn",
  f.type::"FormFieldType",
  f.required,
  '[]'::jsonb,
  f."sortOrder",
  f.width,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Course" c
CROSS JOIN (
  VALUES
    ('fullName', 'الاسم الكامل', 'Full name', 'الاسم الكامل', 'Full name', 'TEXT', true, 0, 'half'),
    ('phone', 'رقم الهاتف', 'Phone number', '07xxxxxxxxx', '07xxxxxxxxx', 'PHONE', true, 1, 'half'),
    ('email', 'البريد الإلكتروني', 'Email address', 'name@email.com', 'name@email.com', 'EMAIL', true, 2, 'half'),
    ('city', 'المدينة', 'City', 'المدينة', 'City', 'TEXT', true, 3, 'half'),
    ('occupation', 'المهنة', 'Occupation', 'المهنة', 'Occupation', 'TEXT', true, 4, 'half'),
    ('experience', 'سنوات الخبرة', 'Years of experience', 'مثلاً 3 سنوات', 'e.g. 3 years', 'TEXT', true, 5, 'half'),
    ('notes', 'ملاحظات إضافية', 'Additional notes', 'اختياري', 'Optional', 'TEXTAREA', false, 6, 'full')
) AS f(key, "labelAr", "labelEn", "placeholderAr", "placeholderEn", type, required, "sortOrder", width)
ON CONFLICT ("courseId", "key") DO NOTHING;
