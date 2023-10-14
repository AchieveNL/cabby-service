-- CreateEnum
CREATE TYPE "UserProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "userProfile" ADD COLUMN     "status" "UserProfileStatus" NOT NULL DEFAULT 'PENDING';
