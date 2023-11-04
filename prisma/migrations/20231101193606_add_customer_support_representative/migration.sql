-- CreateTable
CREATE TABLE "CustomerSupportRepresentative" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomerSupportRepresentative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSupportRepresentative_userId_key" ON "CustomerSupportRepresentative"("userId");

-- AddForeignKey
ALTER TABLE "CustomerSupportRepresentative" ADD CONSTRAINT "CustomerSupportRepresentative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
