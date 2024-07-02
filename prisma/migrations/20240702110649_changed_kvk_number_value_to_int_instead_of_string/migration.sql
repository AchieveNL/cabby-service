/*
  Warnings:

  - The `kvkNumber` column on the `permitDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "permitDetails" DROP COLUMN "kvkNumber",
ADD COLUMN     "kvkNumber" INTEGER;
