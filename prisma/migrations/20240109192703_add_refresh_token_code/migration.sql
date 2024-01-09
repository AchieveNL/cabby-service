/*
  Warnings:

  - Added the required column `authorizationCode` to the `TeslaToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `TeslaToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeslaToken" ADD COLUMN     "authorizationCode" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;
