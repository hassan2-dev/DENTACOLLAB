-- CreateTable
CREATE TABLE "ChatBotQa" (
    "id" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "answerEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatBotQa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatBotQa_isActive_sortOrder_idx" ON "ChatBotQa"("isActive", "sortOrder");
