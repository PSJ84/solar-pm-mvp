// apps/api/src/stages/dto/update-stage-dates.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateStageDatesDto {
  @ApiPropertyOptional({ description: '단계 시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ description: '단계 접수일' })
  @IsOptional()
  @IsDateString()
  receivedDate?: string | null;

  @ApiPropertyOptional({ description: '단계 완료일' })
  @IsOptional()
  @IsDateString()
  completedDate?: string | null;
}
