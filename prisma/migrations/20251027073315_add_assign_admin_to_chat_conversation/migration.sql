-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN     "assignedAdminId" INTEGER;

-- CreateIndex
CREATE INDEX "ChatConversation_assignedAdminId_idx" ON "ChatConversation"("assignedAdminId");
