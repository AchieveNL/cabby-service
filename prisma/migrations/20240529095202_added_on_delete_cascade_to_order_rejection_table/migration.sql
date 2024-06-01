-- DropForeignKey
ALTER TABLE "orderRejection" DROP CONSTRAINT "orderRejection_orderId_fkey";

-- AddForeignKey
ALTER TABLE "orderRejection" ADD CONSTRAINT "orderRejection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
