/*
  Warnings:

  - You are about to drop the column `orderType` on the `order` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'UNPAID';

-- AlterTable
ALTER TABLE "order" DROP COLUMN "orderType",
ALTER COLUMN "status" SET DEFAULT 'UNPAID';

-- DropEnum
DROP TYPE "OrderType";
