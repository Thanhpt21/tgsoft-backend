// src/modules/commission/dto/create-commission.dto.ts
import { IsInt, IsNotEmpty, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateCommissionDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  amount: number;  

  @IsInt()
  @IsNotEmpty()
  rate: number;    

  @IsInt()
  @IsNotEmpty()
  orderId: number;  

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
