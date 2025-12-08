import { IsDateString, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export const CHECKLIST_STATUS = [
  'pending',
  'requested',
  'received',
  'reviewing',
  'needs_revision',
  'completed',
] as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUS)[number];

export class CreateChecklistItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsIn(CHECKLIST_STATUS)
  status?: ChecklistStatus;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(CHECKLIST_STATUS)
  status?: ChecklistStatus;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class ReorderChecklistDto {
  @IsString({ each: true })
  itemIds: string[];
}
