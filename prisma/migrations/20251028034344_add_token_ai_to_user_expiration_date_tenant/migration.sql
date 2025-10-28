-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "expirationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenAI" INTEGER NOT NULL DEFAULT 0;
