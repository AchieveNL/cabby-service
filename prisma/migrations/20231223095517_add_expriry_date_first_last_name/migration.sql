/*
  Warnings:

  - You are about to drop the column `isNameMatch` on the `userVerification` table. All the data in the column will be lost.
  - Added the required column `isExpiryDateMatch` to the `userVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isFirstNameMatch` to the `userVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isLastNameMatch` to the `userVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userVerification" DROP COLUMN "isNameMatch",
ADD COLUMN     "isExpiryDateMatch" BOOLEAN NOT NULL,
ADD COLUMN     "isFirstNameMatch" BOOLEAN NOT NULL,
ADD COLUMN     "isLastNameMatch" BOOLEAN NOT NULL;
