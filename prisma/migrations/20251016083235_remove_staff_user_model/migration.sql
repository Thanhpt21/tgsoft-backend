/*
  Warnings:

  - You are about to drop the column `staffId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `staffUserId` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `staffUserId` on the `FinancialTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `staffUserId` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the `StaffUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Commission" DROP CONSTRAINT "Commission_staffUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FinancialTransaction" DROP CONSTRAINT "FinancialTransaction_staffUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payout" DROP CONSTRAINT "Payout_staffUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StaffUser" DROP CONSTRAINT "StaffUser_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StaffUser" DROP CONSTRAINT "StaffUser_tenantId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "staffId";

-- AlterTable
ALTER TABLE "Commission" DROP COLUMN "staffUserId";

-- AlterTable
ALTER TABLE "FinancialTransaction" DROP COLUMN "staffUserId";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "staffUserId";

-- DropTable
DROP TABLE "public"."StaffUser";

-- DropEnum
DROP TYPE "public"."StaffRole";
