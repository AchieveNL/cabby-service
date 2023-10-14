/*
  Warnings:

  - Added the required column `userId` to the `damageReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "damageReport" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "damageReport" ADD CONSTRAINT "damageReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
