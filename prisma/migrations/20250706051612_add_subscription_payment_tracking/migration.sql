-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3);
