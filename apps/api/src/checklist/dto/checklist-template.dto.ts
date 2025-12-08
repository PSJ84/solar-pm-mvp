import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistTemplateItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  hasExpiry?: boolean;
}

export class CreateChecklistTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistTemplateItemDto)
  items?: ChecklistTemplateItemDto[];
}

export class UpdateChecklistTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddTemplateItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  hasExpiry?: boolean;
}

export class ReorderTemplateItemsDto {
  @IsArray()
  @IsString({ each: true })
  itemIds: string[];
}
