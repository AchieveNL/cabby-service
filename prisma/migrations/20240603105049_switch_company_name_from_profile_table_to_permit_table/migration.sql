/*
  Warnings:

  - You are about to drop the column `companyName` on the `userProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "permitDetails" ADD COLUMN     "companyName" TEXT;

-- AlterTable
ALTER TABLE "userProfile" DROP COLUMN "companyName";
