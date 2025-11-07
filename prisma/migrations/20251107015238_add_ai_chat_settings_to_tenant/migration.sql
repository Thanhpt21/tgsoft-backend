-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'GEMINI', 'CLAUDE', 'CUSTOM');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "aiAutoReplyDelay" INTEGER DEFAULT 2000,
ADD COLUMN     "aiChatEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiMaxTokens" INTEGER DEFAULT 500,
ADD COLUMN     "aiModel" TEXT DEFAULT 'gpt-4o-mini',
ADD COLUMN     "aiProvider" TEXT DEFAULT 'openai',
ADD COLUMN     "aiSystemPrompt" TEXT,
ADD COLUMN     "aiTemperature" DOUBLE PRECISION DEFAULT 0.7;
