-- DropForeignKey
ALTER TABLE "CustomerSupportRepresentative" DROP CONSTRAINT "CustomerSupportRepresentative_userId_fkey";

-- DropForeignKey
ALTER TABLE "Refunds" DROP CONSTRAINT "Refunds_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "damageReport" DROP CONSTRAINT "damageReport_userId_fkey";

-- DropForeignKey
ALTER TABLE "driverLicense" DROP CONSTRAINT "driverLicense_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "driverRejection" DROP CONSTRAINT "driverRejection_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_userId_fkey";

-- DropForeignKey
ALTER TABLE "passwordResetToken" DROP CONSTRAINT "passwordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "permitDetails" DROP CONSTRAINT "permitDetails_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "registrationOrder" DROP CONSTRAINT "registrationOrder_userId_fkey";

-- DropForeignKey
ALTER TABLE "userProfile" DROP CONSTRAINT "userProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "userTokens" DROP CONSTRAINT "userTokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "userVerification" DROP CONSTRAINT "userVerification_userProfileId_fkey";

-- AddForeignKey
ALTER TABLE "passwordResetToken" ADD CONSTRAINT "passwordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userProfile" ADD CONSTRAINT "userProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driverLicense" ADD CONSTRAINT "driverLicense_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permitDetails" ADD CONSTRAINT "permitDetails_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userVerification" ADD CONSTRAINT "userVerification_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driverRejection" ADD CONSTRAINT "driverRejection_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrationOrder" ADD CONSTRAINT "registrationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damageReport" ADD CONSTRAINT "damageReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSupportRepresentative" ADD CONSTRAINT "CustomerSupportRepresentative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userTokens" ADD CONSTRAINT "userTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refunds" ADD CONSTRAINT "Refunds_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
