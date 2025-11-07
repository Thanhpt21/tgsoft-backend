import { IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateTenantAIDto {
  @IsOptional()
  @IsBoolean()
  aiChatEnabled?: boolean;

  @IsOptional()
  @IsString()
  aiProvider?: string; // openai, gemini, claude,...

  @IsOptional()
  @IsString()
  aiModel?: string;

  @IsOptional()
  @IsString()
  aiSystemPrompt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  aiTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  aiMaxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  aiAutoReplyDelay?: number;

  @IsOptional()
  @IsString()
  apiKey?: string;
}
