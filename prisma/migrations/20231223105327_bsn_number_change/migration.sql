/*
  Warnings:

  - You are about to drop the column `bsnNumber` on the `userProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "driverLicense" ADD COLUMN     "bsnNumber" TEXT;

-- AlterTable
ALTER TABLE "userProfile" DROP COLUMN "bsnNumber";
