CREATE TYPE "Locale" AS ENUM ('ar', 'en');

ALTER TABLE "KnowledgeEntry" ADD COLUMN "locale" "Locale" NOT NULL DEFAULT 'ar';
ALTER TABLE "KnowledgeDocument" ADD COLUMN "locale" "Locale" NOT NULL DEFAULT 'ar';

CREATE TABLE "CourseTranslation" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "overview" TEXT NOT NULL,
  "objectives" TEXT[],
  "requirements" TEXT[],
  "duration" TEXT NOT NULL,
  "certificate" TEXT,
  CONSTRAINT "CourseTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InstructorTranslation" (
  "id" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "biography" TEXT NOT NULL,
  "experience" TEXT NOT NULL,
  "certificates" TEXT[],
  CONSTRAINT "InstructorTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaqTranslation" (
  "id" TEXT NOT NULL,
  "faqId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  CONSTRAINT "FaqTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestimonialTranslation" (
  "id" TEXT NOT NULL,
  "testimonialId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "name" TEXT NOT NULL,
  "profession" TEXT NOT NULL,
  "review" TEXT NOT NULL,
  CONSTRAINT "TestimonialTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GalleryAlbumTranslation" (
  "id" TEXT NOT NULL,
  "albumId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "GalleryAlbumTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GraduateTranslation" (
  "id" TEXT NOT NULL,
  "graduateId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "fullName" TEXT NOT NULL,
  "courseTitle" TEXT,
  "description" TEXT,
  CONSTRAINT "GraduateTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteContentTranslation" (
  "id" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "locale" "Locale" NOT NULL,
  "title" TEXT,
  "body" TEXT,
  "data" JSONB,
  CONSTRAINT "SiteContentTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseTranslation_courseId_locale_key" ON "CourseTranslation"("courseId", "locale");
CREATE UNIQUE INDEX "InstructorTranslation_instructorId_locale_key" ON "InstructorTranslation"("instructorId", "locale");
CREATE UNIQUE INDEX "FaqTranslation_faqId_locale_key" ON "FaqTranslation"("faqId", "locale");
CREATE UNIQUE INDEX "TestimonialTranslation_testimonialId_locale_key" ON "TestimonialTranslation"("testimonialId", "locale");
CREATE UNIQUE INDEX "GalleryAlbumTranslation_albumId_locale_key" ON "GalleryAlbumTranslation"("albumId", "locale");
CREATE UNIQUE INDEX "GraduateTranslation_graduateId_locale_key" ON "GraduateTranslation"("graduateId", "locale");
CREATE UNIQUE INDEX "SiteContentTranslation_contentId_locale_key" ON "SiteContentTranslation"("contentId", "locale");

ALTER TABLE "CourseTranslation" ADD CONSTRAINT "CourseTranslation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstructorTranslation" ADD CONSTRAINT "InstructorTranslation_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FaqTranslation" ADD CONSTRAINT "FaqTranslation_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestimonialTranslation" ADD CONSTRAINT "TestimonialTranslation_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryAlbumTranslation" ADD CONSTRAINT "GalleryAlbumTranslation_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraduateTranslation" ADD CONSTRAINT "GraduateTranslation_graduateId_fkey" FOREIGN KEY ("graduateId") REFERENCES "Graduate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteContentTranslation" ADD CONSTRAINT "SiteContentTranslation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CourseTranslation" ("id", "courseId", "locale", "title", "description", "overview", "objectives", "requirements", "duration", "certificate")
SELECT 'ar-' || "id", "id", 'ar', "title", "description", "overview", "objectives", "requirements", "duration", "certificate" FROM "Course";

INSERT INTO "InstructorTranslation" ("id", "instructorId", "locale", "name", "title", "biography", "experience", "certificates")
SELECT 'ar-' || "id", "id", 'ar', "name", "title", "biography", "experience", "certificates" FROM "Instructor";

INSERT INTO "FaqTranslation" ("id", "faqId", "locale", "question", "answer", "category")
SELECT 'ar-' || "id", "id", 'ar', "question", "answer", "category" FROM "Faq";

INSERT INTO "TestimonialTranslation" ("id", "testimonialId", "locale", "name", "profession", "review")
SELECT 'ar-' || "id", "id", 'ar', "name", "profession", "review" FROM "Testimonial";

INSERT INTO "GalleryAlbumTranslation" ("id", "albumId", "locale", "title", "description")
SELECT 'ar-' || "id", "id", 'ar', "title", "description" FROM "GalleryAlbum";

INSERT INTO "GraduateTranslation" ("id", "graduateId", "locale", "fullName", "courseTitle", "description")
SELECT 'ar-' || "id", "id", 'ar', "fullName", "courseTitle", "description" FROM "Graduate";

INSERT INTO "SiteContentTranslation" ("id", "contentId", "locale", "title", "body", "data")
SELECT 'ar-' || "id", "id", 'ar', "title", "body", "data" FROM "SiteContent";
