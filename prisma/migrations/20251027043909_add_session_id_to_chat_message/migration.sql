-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");
