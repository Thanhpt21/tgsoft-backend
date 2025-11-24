-- CreateTable
CREATE TABLE "SupportMailbox" (
    "id" SERIAL NOT NULL,
    "images" JSONB,
    "errorText" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMailbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMailbox_tenantId_idx" ON "SupportMailbox"("tenantId");

-- CreateIndex
CREATE INDEX "SupportMailbox_createdBy_idx" ON "SupportMailbox"("createdBy");

-- AddForeignKey
ALTER TABLE "SupportMailbox" ADD CONSTRAINT "SupportMailbox_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMailbox" ADD CONSTRAINT "SupportMailbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
