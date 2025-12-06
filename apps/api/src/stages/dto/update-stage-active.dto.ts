// apps/api/src/stages/dto/update-stage-active.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStageActiveDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;
}
