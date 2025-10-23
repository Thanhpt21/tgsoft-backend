-- CreateTable
CREATE TABLE "GHTKConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "pickName" TEXT,
    "pickPhone" TEXT,
    "pickAddress" TEXT,
    "pickProvince" TEXT,
    "pickDistrict" TEXT,
    "pickWard" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GHTKConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHTKShipment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "partnerCode" TEXT,
    "status" TEXT,
    "statusText" TEXT,
    "trackingUrl" TEXT,
    "estimatedPickTime" TEXT,
    "estimatedDeliverTime" TEXT,
    "fee" INTEGER,
    "insuranceFee" INTEGER,
    "pickMoney" INTEGER,
    "actualTransferAmount" INTEGER,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "receiverProvince" TEXT NOT NULL,
    "receiverDistrict" TEXT NOT NULL,
    "receiverWard" TEXT,
    "receiverEmail" TEXT,
    "pickName" TEXT,
    "pickPhone" TEXT,
    "pickAddress" TEXT,
    "pickProvince" TEXT,
    "pickDistrict" TEXT,
    "pickWard" TEXT,
    "transport" TEXT,
    "deliverOption" TEXT,
    "note" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GHTKShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHTKShipmentProduct" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "productCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GHTKShipmentProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHTKTrackingHistory" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "statusText" TEXT,
    "location" TEXT,
    "time" TIMESTAMP(3),
    "reason" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GHTKTrackingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GHTKConfig_tenantId_key" ON "GHTKConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GHTKShipment_orderId_key" ON "GHTKShipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "GHTKShipment_label_key" ON "GHTKShipment"("label");

-- AddForeignKey
ALTER TABLE "GHTKConfig" ADD CONSTRAINT "GHTKConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHTKShipment" ADD CONSTRAINT "GHTKShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHTKShipmentProduct" ADD CONSTRAINT "GHTKShipmentProduct_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "GHTKShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHTKTrackingHistory" ADD CONSTRAINT "GHTKTrackingHistory_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "GHTKShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
