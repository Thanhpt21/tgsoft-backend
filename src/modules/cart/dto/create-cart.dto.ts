import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
