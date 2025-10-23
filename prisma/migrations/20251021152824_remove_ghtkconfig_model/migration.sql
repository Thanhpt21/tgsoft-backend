/*
  Warnings:

  - You are about to drop the `GHTKConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GHTKConfig" DROP CONSTRAINT "GHTKConfig_tenantId_fkey";

-- DropTable
DROP TABLE "public"."GHTKConfig";
