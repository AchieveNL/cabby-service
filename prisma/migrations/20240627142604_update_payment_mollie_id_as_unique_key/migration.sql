/*
  Warnings:

  - A unique constraint covering the columns `[mollieId]` on the table `payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_mollieId_key" ON "payment"("mollieId");
