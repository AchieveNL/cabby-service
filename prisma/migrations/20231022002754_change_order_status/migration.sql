/*
  Warnings:

  - The values [CONFIRMED,REJECTED,COMPLETED,CANCELED] on the enum `RegistrationOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `kiwaTaxiVergunning` on the `permitDetails` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationOrderStatus_new" AS ENUM ('PAID', 'REFUNDED', 'PENDING', 'FAILED');
ALTER TABLE "registrationOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "registrationOrder" ALTER COLUMN "status" TYPE "RegistrationOrderStatus_new" USING ("status"::text::"RegistrationOrderStatus_new");
ALTER TYPE "RegistrationOrderStatus" RENAME TO "RegistrationOrderStatus_old";
ALTER TYPE "RegistrationOrderStatus_new" RENAME TO "RegistrationOrderStatus";
DROP TYPE "RegistrationOrderStatus_old";
ALTER TABLE "registrationOrder" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "permitDetails" DROP COLUMN "kiwaTaxiVergunning",
ADD COLUMN     "kiwaDocument" TEXT;
