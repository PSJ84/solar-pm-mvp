// apps/api/src/projects/dto/project.dto.ts
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export class CreateProjectDto {
  @ApiProperty({ example: '충남 서산 태양광 발전소' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '충청남도 서산시 운산면' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 998.5, description: '발전용량 (kW)' })
  @IsOptional()
  @IsNumber()
  capacityKw?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  // [v1.1] 새로 추가된 필드들
  @ApiPropertyOptional({ description: '발전사업허가 번호' })
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiPropertyOptional({ description: '사용전검사 예정일' })
  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @ApiPropertyOptional({ description: '착공일' })
  @IsOptional()
  @IsDateString()
  constructionStartAt?: string;

  @ApiPropertyOptional({ description: '외부 시스템 ID' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ type: [String], description: '태그 (예: ["영농형", "임대"])' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacityKw?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  // [v1.1] 새로 추가된 필드들
  @ApiPropertyOptional({ description: '발전사업허가 번호' })
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiPropertyOptional({ description: '사용전검사 예정일' })
  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @ApiPropertyOptional({ description: '착공일' })
  @IsOptional()
  @IsDateString()
  constructionStartAt?: string;

  @ApiPropertyOptional({ description: '외부 시스템 ID' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ type: [String], description: '태그' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * [v1.1] 프로젝트 복제 DTO
 */
export class CloneProjectDto {
  @ApiPropertyOptional({ example: '복제된 프로젝트 이름 (선택)', description: '새 프로젝트 이름. 미입력시 "원본이름 (복사본)" 형태로 생성' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '담당자도 복제할지 여부 (기본: true)' })
  @IsOptional()
  copyAssignees?: boolean;
}

export class CloneProjectResponseDto {
  @ApiProperty({ description: '새로 생성된 프로젝트 ID' })
  id: string;

  @ApiProperty({ description: '새 프로젝트 이름' })
  name: string;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  capacityKw?: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  progress: number; // 계산된 진행률

  @ApiPropertyOptional()
  permitNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
