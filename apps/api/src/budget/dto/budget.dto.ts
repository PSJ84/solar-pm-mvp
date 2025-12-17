// apps/api/src/budget/dto/budget.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { VendorRole } from '@prisma/client';

export class CreateBudgetCategoryDto {
  @ApiProperty({ description: '카테고리명' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: VendorRole, description: '연결된 협력업체 역할' })
  @IsOptional()
  @IsEnum(VendorRole)
  vendorRole?: VendorRole;

  @ApiPropertyOptional({ description: '기본 카테고리 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateBudgetItemDto {
  @ApiProperty({ description: '카테고리 ID' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ description: '도급 계약 금액', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractAmount?: number;

  @ApiPropertyOptional({ description: '실행 예정 금액', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedAmount?: number;

  @ApiPropertyOptional({ description: '실제 지출 금액', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;
}

export class UpdateBudgetItemDto {
  @ApiPropertyOptional({ description: '도급 계약 금액' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractAmount?: number;

  @ApiPropertyOptional({ description: '실행 예정 금액' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  plannedAmount?: number;

  @ApiPropertyOptional({ description: '실제 지출 금액' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;
}
