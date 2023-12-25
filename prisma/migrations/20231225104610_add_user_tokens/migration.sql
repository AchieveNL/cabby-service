-- CreateTable
CREATE TABLE "userTokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "userTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userTokens_userId_key" ON "userTokens"("userId");

-- AddForeignKey
ALTER TABLE "userTokens" ADD CONSTRAINT "userTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
