/*
  Warnings:

  - You are about to drop the column `receiptUrl` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripeClientSecret` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "receiptUrl",
DROP COLUMN "refundAmount",
DROP COLUMN "refundReason",
DROP COLUMN "refundedAt",
DROP COLUMN "stripeClientSecret",
DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "xenditInvoiceUrl" TEXT,
ADD COLUMN     "xenditPaymentId" TEXT,
ADD COLUMN     "xenditPaymentMethodId" TEXT;
