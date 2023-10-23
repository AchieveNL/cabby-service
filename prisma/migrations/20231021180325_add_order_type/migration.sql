-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('REGISTRATION', 'VEHICLE_RENTAL');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'VEHICLE_RENTAL';