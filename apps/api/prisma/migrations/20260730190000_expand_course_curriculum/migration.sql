-- AlterTable
ALTER TABLE "CurriculumModule"
ADD COLUMN "description" TEXT,
ADD COLUMN "outcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CurriculumLesson"
ADD COLUMN "description" TEXT,
ADD COLUMN "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "format" TEXT;
