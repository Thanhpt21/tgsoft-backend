// dto/get-rates.dto.ts
import { IsInt } from 'class-validator';

export class GetRatesDto {
  @IsInt()
  orderId: number;
}
