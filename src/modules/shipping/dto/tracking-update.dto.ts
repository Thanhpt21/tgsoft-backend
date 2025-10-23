// dto/tracking-update.dto.ts
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class TrackingUpdateDto {
  @IsString()
  trackingNo: string

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  timestamp: string;
}

