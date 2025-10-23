import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsObject, IsString, Min, ValidateNested } from "class-validator";

export class PackageInfoDto {
  @IsInt()
  @Min(1)
  weight: number;

  @IsInt()
  @Min(1)
  length: number;

  @IsInt()
  @Min(1)
  width: number;

  @IsInt()
  @Min(1)
  height: number;
}

export class CreateShipmentDto {

    @IsInt()
  @IsNotEmpty()
  orderId: number;

  
  @IsString()
  @IsNotEmpty()
  service: string;

  @IsInt()
  @IsNotEmpty()
  fee: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PackageInfoDto)
  packageInfo: PackageInfoDto;
}