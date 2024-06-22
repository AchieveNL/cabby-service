-- CreateTable
CREATE TABLE "Logs" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "query" JSONB NOT NULL,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "data" JSONB NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Logs" ADD CONSTRAINT "Logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
