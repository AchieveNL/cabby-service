-- AlterTable
ALTER TABLE "userVerification" ADD COLUMN     "existingBsnNumber" TEXT,
ADD COLUMN     "existingDateOfBirth" TEXT,
ADD COLUMN     "existingExpiryDate" TEXT,
ADD COLUMN     "existingFirstName" TEXT,
ADD COLUMN     "existingLastName" TEXT,
ADD COLUMN     "extractedBsnNumber" TEXT,
ADD COLUMN     "extractedDateOfBirth" TEXT,
ADD COLUMN     "extractedExpiryDate" TEXT,
ADD COLUMN     "extractedFirstName" TEXT,
ADD COLUMN     "extractedLastName" TEXT;
