-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'APPROVED', 'REJECTED', 'REQUIRE_REGISTRATION_FEE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PaymentProduct" AS ENUM ('RENT', 'REGISTRATION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'REFUNDED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "RegistrationOrderStatus" AS ENUM ('PAID', 'REFUNDED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('UNPAID', 'PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('UNDERPAID', 'REPAIRED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "revokeTokensBefore" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus",
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passwordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "signature" TEXT,
    "zip" TEXT,
    "status" "UserProfileStatus" NOT NULL DEFAULT 'REQUIRE_REGISTRATION_FEE',

    CONSTRAINT "userProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driverLicense" (
    "id" TEXT NOT NULL,
    "driverLicenseBack" TEXT,
    "driverLicenseExpiry" TEXT,
    "driverLicenseFront" TEXT,
    "bsnNumber" TEXT,
    "driverLicense" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "driverLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permitDetails" (
    "id" TEXT NOT NULL,
    "kiwaDocument" TEXT,
    "kvkDocument" TEXT,
    "taxiPermitId" TEXT,
    "taxiPermitExpiry" TEXT,
    "taxiPermitPicture" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "permitDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "companyName" TEXT,
    "model" TEXT,
    "rentalDuration" TEXT,
    "licensePlate" TEXT,
    "category" TEXT,
    "manufactureYear" TEXT,
    "engineType" TEXT,
    "seatingCapacity" TEXT,
    "batteryCapacity" TEXT,
    "uniqueFeature" TEXT,
    "images" TEXT[],
    "availability" TEXT,
    "unavailabilityReason" TEXT,
    "currency" TEXT DEFAULT 'EUR',
    "pricePerDay" DECIMAL(6,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(6,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "registrationOrderId" TEXT,
    "product" "PaymentProduct" NOT NULL DEFAULT 'RENT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "invoiceUrl" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrationOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(6,2) NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "registrationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "totalAmount" DECIMAL(6,2) NOT NULL,
    "rentalStartDate" TIMESTAMP(3) NOT NULL,
    "rentalEndDate" TIMESTAMP(3) NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orderRejection" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orderRejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicleRejection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicleRejection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damageReport" (
    "id" SERIAL NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'UNDERPAID',
    "amount" DOUBLE PRECISION,
    "repairedAt" TIMESTAMP(3),
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "damageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "passwordResetToken_token_key" ON "passwordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "userProfile_userId_key" ON "userProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "driverLicense_userProfileId_key" ON "driverLicense"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "permitDetails_userProfileId_key" ON "permitDetails"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_licensePlate_key" ON "vehicle"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orderId_key" ON "payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_registrationOrderId_key" ON "payment"("registrationOrderId");

-- CreateIndex
CREATE INDEX "idx_registrationOrderId" ON "payment"("registrationOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_userId_paymentDate_key" ON "payment"("userId", "paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "registrationOrder_userId_key" ON "registrationOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "registrationOrder_paymentId_key" ON "registrationOrder"("paymentId");

-- CreateIndex
CREATE INDEX "idx_registrationOrder_userId" ON "registrationOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "order_paymentId_key" ON "order"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "order_vehicleId_rentalStartDate_rentalEndDate_key" ON "order"("vehicleId", "rentalStartDate", "rentalEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "orderRejection_orderId_key" ON "orderRejection"("orderId");

-- CreateIndex
CREATE INDEX "idx_orderId" ON "orderRejection"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicleRejection_vehicleId_key" ON "vehicleRejection"("vehicleId");

-- CreateIndex
CREATE INDEX "idx_vehicleId" ON "vehicleRejection"("vehicleId");

-- AddForeignKey
ALTER TABLE "passwordResetToken" ADD CONSTRAINT "passwordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userProfile" ADD CONSTRAINT "userProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driverLicense" ADD CONSTRAINT "driverLicense_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permitDetails" ADD CONSTRAINT "permitDetails_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_registrationOrderId_fkey" FOREIGN KEY ("registrationOrderId") REFERENCES "registrationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrationOrder" ADD CONSTRAINT "registrationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orderRejection" ADD CONSTRAINT "orderRejection_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicleRejection" ADD CONSTRAINT "vehicleRejection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damageReport" ADD CONSTRAINT "damageReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damageReport" ADD CONSTRAINT "damageReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
