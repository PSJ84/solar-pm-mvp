// apps/api/src/projects/dto/project-vendor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertProjectVendorDto {
  @ApiProperty({ enum: VendorRole })
  @IsEnum(VendorRole)
  role: VendorRole;

  @ApiProperty({ description: '업체 ID' })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiPropertyOptional({ description: '담당자 이름' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: '담당자 연락처' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  memo?: string;
}
