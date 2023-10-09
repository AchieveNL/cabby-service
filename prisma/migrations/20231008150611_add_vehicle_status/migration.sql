-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED');

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING';
