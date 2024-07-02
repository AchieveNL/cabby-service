/*
  Warnings:

  - The `engineType` column on the `vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "VehicleEngineType" AS ENUM ('BENZINE', 'HYBRIDE_BENZINE', 'DIESEL', 'HYBRIDE_DIESEL', 'ELEKTRISCH');

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "engineType",
ADD COLUMN     "engineType" "VehicleEngineType";
