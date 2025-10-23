/*
  Warnings:

  - You are about to drop the column `createdAt` on the `GHTKConfig` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `GHTKConfig` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `GHTKConfig` table. All the data in the column will be lost.
  - Made the column `pickName` on table `GHTKConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pickPhone` on table `GHTKConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pickAddress` on table `GHTKConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."GHTKConfig" DROP CONSTRAINT "GHTKConfig_tenantId_fkey";

-- AlterTable
ALTER TABLE "GHTKConfig" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ALTER COLUMN "pickName" SET NOT NULL,
ALTER COLUMN "pickPhone" SET NOT NULL,
ALTER COLUMN "pickAddress" SET NOT NULL;

-- CreateIndex
CREATE INDEX "GHTKConfig_tenantId_idx" ON "GHTKConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "GHTKConfig" ADD CONSTRAINT "GHTKConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
