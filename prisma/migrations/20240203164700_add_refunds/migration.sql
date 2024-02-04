-- CreateTable
CREATE TABLE "Refunds" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(6,2) NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "Refunds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Refunds" ADD CONSTRAINT "Refunds_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "userProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
