-- DropForeignKey
ALTER TABLE "public"."ShipmentItem" DROP CONSTRAINT "ShipmentItem_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TrackingEvent" DROP CONSTRAINT "TrackingEvent_shipmentId_fkey";

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
