-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "FunnelEventType" AS ENUM ('VISIT', 'REGISTER_CLICK', 'CHECKOUT_STARTED', 'PAID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentProvider" ADD VALUE 'ZAIN_CASH';
ALTER TYPE "PaymentProvider" ADD VALUE 'QI_CARD';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "closeRegistrationAutomatically" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "couponsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresPayment" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "invoiceGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "stripeRefundId" TEXT;

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCoupon" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFunnelEvent" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "event" "FunnelEventType" NOT NULL,
    "sessionId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseFunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_paymentId_createdAt_idx" ON "PaymentLog"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentLog_event_idx" ON "PaymentLog"("event");

-- CreateIndex
CREATE INDEX "CourseCoupon_courseId_isActive_idx" ON "CourseCoupon"("courseId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCoupon_courseId_code_key" ON "CourseCoupon"("courseId", "code");

-- CreateIndex
CREATE INDEX "CourseFunnelEvent_courseId_event_createdAt_idx" ON "CourseFunnelEvent"("courseId", "event", "createdAt");

-- CreateIndex
CREATE INDEX "CourseFunnelEvent_createdAt_idx" ON "CourseFunnelEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_registrationNumber_key" ON "Payment"("registrationNumber");

-- CreateIndex
CREATE INDEX "Payment_registrationNumber_idx" ON "Payment"("registrationNumber");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "CourseCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCoupon" ADD CONSTRAINT "CourseCoupon_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFunnelEvent" ADD CONSTRAINT "CourseFunnelEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
