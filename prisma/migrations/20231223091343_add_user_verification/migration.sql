-- AlterTable
ALTER TABLE "userProfile" ADD COLUMN     "bsnNumber" TEXT;

-- CreateTable
CREATE TABLE "userVerification" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "isNameMatch" BOOLEAN NOT NULL,
    "isBsnNumberMatch" BOOLEAN NOT NULL,
    "isDateOfBirthMatch" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userVerification_userProfileId_key" ON "userVerification"("userProfileId");

-- AddForeignKey
ALTER TABLE "userVerification" ADD CONSTRAINT "userVerification_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
