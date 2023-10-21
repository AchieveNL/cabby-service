/*
  Warnings:

  - A unique constraint covering the columns `[registrationOrderId]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RegistrationOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "registrationOrderId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "registrationOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(6,2) NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "registrationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registrationOrder_userId_key" ON "registrationOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "registrationOrder_paymentId_key" ON "registrationOrder"("paymentId");

-- CreateIndex
CREATE INDEX "idx_registrationOrder_userId" ON "registrationOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_registrationOrderId_key" ON "payment"("registrationOrderId");

-- CreateIndex
CREATE INDEX "idx_registrationOrderId" ON "payment"("registrationOrderId");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_registrationOrderId_fkey" FOREIGN KEY ("registrationOrderId") REFERENCES "registrationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrationOrder" ADD CONSTRAINT "registrationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
