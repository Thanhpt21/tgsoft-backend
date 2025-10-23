-- CreateTable
CREATE TABLE "GHTKConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "pickName" TEXT NOT NULL,
    "pickPhone" TEXT NOT NULL,
    "pickAddress" TEXT NOT NULL,
    "pickProvince" TEXT,
    "pickDistrict" TEXT,
    "pickWard" TEXT,

    CONSTRAINT "GHTKConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingFee" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "service" "ShippingService" NOT NULL,
    "ghtkConfigId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GHTKConfig_tenantId_key" ON "GHTKConfig"("tenantId");

-- CreateIndex
CREATE INDEX "GHTKConfig_tenantId_idx" ON "GHTKConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "GHTKConfig" ADD CONSTRAINT "GHTKConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingFee" ADD CONSTRAINT "ShippingFee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingFee" ADD CONSTRAINT "ShippingFee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingFee" ADD CONSTRAINT "ShippingFee_ghtkConfigId_fkey" FOREIGN KEY ("ghtkConfigId") REFERENCES "GHTKConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
