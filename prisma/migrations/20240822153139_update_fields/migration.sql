/*
  Warnings:

  - The values [UNDERPAID] on the enum `ReportStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `authorizationCode` on the `TeslaToken` table. All the data in the column will be lost.
  - You are about to drop the column `zipcodeCharacter` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `zipcodeNumber` on the `vehicle` table. All the data in the column will be lost.
  - Made the column `refreshToken` on table `TeslaToken` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NOTIFICATION_EVENT" AS ENUM ('NEW_CAR', 'ORDER_CONFIRMED', 'HOLIDAY', 'FREE_HOURS', 'ORDER_WILL_START', 'ORDER_WILL_END');

-- AlterEnum
BEGIN;
CREATE TYPE "ReportStatus_new" AS ENUM ('DAMAGED', 'REPAIRED');
ALTER TABLE "damageReport" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "damageReport" ALTER COLUMN "status" TYPE "ReportStatus_new" USING ("status"::text::"ReportStatus_new");
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";
ALTER TYPE "ReportStatus_new" RENAME TO "ReportStatus";
DROP TYPE "ReportStatus_old";
ALTER TABLE "damageReport" ALTER COLUMN "status" SET DEFAULT 'DAMAGED';
COMMIT;

-- AlterTable
ALTER TABLE "TeslaToken" DROP COLUMN "authorizationCode",
ALTER COLUMN "refreshToken" SET NOT NULL;

-- AlterTable
ALTER TABLE "damageReport" ALTER COLUMN "status" SET DEFAULT 'DAMAGED';

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "zipcodeCharacter",
DROP COLUMN "zipcodeNumber",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "insuranceCertificates" TEXT[],
ADD COLUMN     "registrationCertificates" TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "zipcode" TEXT,
ALTER COLUMN "batteryCapacity" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "event" "NOTIFICATION_EVENT" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "param" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
