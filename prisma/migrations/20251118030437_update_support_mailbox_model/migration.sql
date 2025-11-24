/*
  Warnings:

  - You are about to drop the column `errorText` on the `SupportMailbox` table. All the data in the column will be lost.
  - Added the required column `title` to the `SupportMailbox` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "SupportMailbox" DROP COLUMN "errorText",
ADD COLUMN     "adminReply" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedBy" INTEGER,
ADD COLUMN     "shopRepliedAt" TIMESTAMP(3),
ADD COLUMN     "shopReply" TEXT,
ADD COLUMN     "status" "SupportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "SupportMailbox_status_idx" ON "SupportMailbox"("status");

-- CreateIndex
CREATE INDEX "SupportMailbox_createdAt_idx" ON "SupportMailbox"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportMailbox" ADD CONSTRAINT "SupportMailbox_repliedBy_fkey" FOREIGN KEY ("repliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
