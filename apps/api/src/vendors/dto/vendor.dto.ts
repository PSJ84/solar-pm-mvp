// apps/api/src/vendors/dto/vendor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ description: '업체명' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: '사업자등록번호' })
  @IsOptional()
  @IsString()
  bizNo?: string;

  @ApiPropertyOptional({ description: '계좌 정보' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ description: '업체명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: '사업자등록번호' })
  @IsOptional()
  @IsString()
  bizNo?: string;

  @ApiPropertyOptional({ description: '계좌 정보' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
