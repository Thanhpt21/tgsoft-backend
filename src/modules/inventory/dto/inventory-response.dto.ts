// src/modules/inventory/dto/inventory-response.dto.ts
export class InventoryResponseDto {
  id: number;
  productVariantId: number;
  warehouseId: number;
  qty: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<InventoryResponseDto>) {
    Object.assign(this, partial);
  }
}
