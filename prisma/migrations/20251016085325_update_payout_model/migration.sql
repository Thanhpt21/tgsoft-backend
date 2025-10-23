/*
  Warnings:

  - You are about to drop the column `userId` on the `Payout` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Payout" DROP CONSTRAINT "Payout_userId_fkey";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "userId",
ADD COLUMN     "receiverId" INTEGER;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
