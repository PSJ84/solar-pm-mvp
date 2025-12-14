
// apps/api/src/tasks/dto/task.dto.ts
import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  COMPLETED = 'completed',
}

export class CreateTaskDto {
  @ApiProperty({ example: '발전사업허가 신청서 작성' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ description: '태스크 메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  // NOTE: alias for backward compatibility
  @ApiPropertyOptional({ description: '태스크 메모 (deprecated: memo 권장)' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '태스크 시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ description: '태스크 완료일' })
  @IsOptional()
  @IsDateString()
  completedDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '프로젝트 단계 ID' })
  @IsString()
  projectStageId: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '태스크 메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  // NOTE: alias for backward compatibility
  @ApiPropertyOptional({ description: '태스크 메모' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '태스크 시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ description: '태스크 완료일' })
  @IsOptional()
  @IsDateString()
  completedDate?: string | null;
}

export class UpdateTaskActiveDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({ description: '상태 변경 메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '대기 중인 대상/내용' })
  @IsOptional()
  @IsString()
  waitingFor?: string;

  @ApiPropertyOptional({ description: '마감일 (ISO 문자열)', type: String })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}
