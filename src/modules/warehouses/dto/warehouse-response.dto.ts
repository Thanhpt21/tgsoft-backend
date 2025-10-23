export class WarehouseResponseDto {
  id: number;
  name: string;
  code?: string;
  location?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(warehouse: any) {
    this.id = warehouse.id;
    this.name = warehouse.name;
    this.code = warehouse.code;
    this.location = warehouse.location;
    this.createdAt = warehouse.createdAt;
    this.updatedAt = warehouse.updatedAt;
  }
}
