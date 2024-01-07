-- CreateTable
CREATE TABLE "TeslaToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeslaToken_pkey" PRIMARY KEY ("id")
);
