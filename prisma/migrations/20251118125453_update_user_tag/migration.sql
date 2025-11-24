/*
  Warnings:

  - You are about to drop the column `tags` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "tags",
ADD COLUMN     "tag" "UserTag";
