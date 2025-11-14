/*
  Warnings:

  - You are about to drop the column `aiSystemPrompt` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "aiSystemPrompt",
ADD COLUMN     "aiSystemPromptId" INTEGER;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_aiSystemPromptId_fkey" FOREIGN KEY ("aiSystemPromptId") REFERENCES "PromptAI"("id") ON DELETE SET NULL ON UPDATE CASCADE;
