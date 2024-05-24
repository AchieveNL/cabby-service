-- AlterTable
ALTER TABLE "order" ADD COLUMN     "overdueEmailSentDate" TIMESTAMP(3),
ADD COLUMN     "stopRentDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "papers" TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "streetName" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "timeframes" JSONB,
ADD COLUMN     "zipcodeCharacter" TEXT,
ADD COLUMN     "zipcodeNumber" TEXT;

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
