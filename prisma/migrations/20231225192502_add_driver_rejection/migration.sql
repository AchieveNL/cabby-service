-- CreateTable
CREATE TABLE "driverRejection" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driverRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driverRejection_userProfileId_key" ON "driverRejection"("userProfileId");

-- AddForeignKey
ALTER TABLE "driverRejection" ADD CONSTRAINT "driverRejection_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
