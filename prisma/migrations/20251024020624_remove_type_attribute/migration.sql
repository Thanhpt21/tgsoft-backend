/*
  Warnings:

  - You are about to drop the column `type` on the `Attribute` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attribute" DROP COLUMN "type";

-- DropEnum
DROP TYPE "public"."AttributeType";
