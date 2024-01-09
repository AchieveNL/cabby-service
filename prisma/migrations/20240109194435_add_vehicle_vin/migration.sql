-- AlterTable
ALTER TABLE "TeslaToken" ALTER COLUMN "refreshToken" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "vin" TEXT;
