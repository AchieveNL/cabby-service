/*
  Warnings:

  - You are about to drop the column `maxPrice` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `minPrice` on the `vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "maxPrice",
DROP COLUMN "minPrice",
ADD COLUMN     "pricePerDay" DECIMAL(6,2);
