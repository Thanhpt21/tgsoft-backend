/*
  Warnings:

  - You are about to drop the column `role` on the `StaffUser` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `StaffUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StaffUser" DROP COLUMN "role",
ADD COLUMN     "roleId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
