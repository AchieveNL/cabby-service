/*
  Warnings:

  - The `batteryCapacity` column on the `vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "batteryCapacity",
ADD COLUMN     "batteryCapacity" INTEGER;
