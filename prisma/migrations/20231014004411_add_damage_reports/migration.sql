-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('UNDERPAID', 'REPAIRED');

-- CreateTable
CREATE TABLE "damageReport" (
    "id" SERIAL NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'UNDERPAID',
    "amount" DOUBLE PRECISION NOT NULL,
    "repairedAt" TIMESTAMP(3),
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "damageReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "damageReport" ADD CONSTRAINT "damageReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
