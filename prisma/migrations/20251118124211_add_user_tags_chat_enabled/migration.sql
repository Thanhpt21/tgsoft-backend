-- CreateEnum
CREATE TYPE "UserTag" AS ENUM ('POTENTIAL', 'VIP', 'SPAM', 'NEW_CUSTOMER', 'NEED_CARE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" "UserTag"[];
