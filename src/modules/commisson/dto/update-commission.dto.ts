// src/modules/commission/dto/update-commission.dto.ts
import { IsOptional, IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class UpdateCommissionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount?: number;  

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  rate?: number;    

  @IsOptional()
  @IsInt()
  orderId?: number;  

  @IsOptional()
  @IsInt()
  receiverId?: number;  

  @IsOptional()
  @IsString()
  reference?: string;  

  @IsOptional()
  @IsString()
  description?: string;  
}
