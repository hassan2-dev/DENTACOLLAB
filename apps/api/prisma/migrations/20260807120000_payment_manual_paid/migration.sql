-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "paidManually" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN "receivedByName" TEXT;
