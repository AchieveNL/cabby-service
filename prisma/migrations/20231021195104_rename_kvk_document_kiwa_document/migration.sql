/*
  Warnings:

  - You are about to drop the column `kiwaTaxiVergunningId` on the `permitDetails` table. All the data in the column will be lost.
  - You are about to drop the column `kvkDocumentId` on the `permitDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "permitDetails" DROP COLUMN "kiwaTaxiVergunningId",
DROP COLUMN "kvkDocumentId",
ADD COLUMN     "kiwaTaxiVergunning" TEXT,
ADD COLUMN     "kvkDocument" TEXT;
