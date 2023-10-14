-- CreateTable
CREATE TABLE "vehicleRejection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicleRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicleRejection_vehicleId_key" ON "vehicleRejection"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_vehicleId" ON "vehicleRejection"("vehicleId");

-- AddForeignKey
ALTER TABLE "vehicleRejection" ADD CONSTRAINT "vehicleRejection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
