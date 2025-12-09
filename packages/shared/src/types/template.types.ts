// packages/shared/src/types/template.types.ts
export interface StageTemplateTaskDto {
  id?: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  isDefaultActive?: boolean;
  ownerCategory?: string;
  automationCategory?: string;
  order: number;
  defaultDueDays?: number;
  checklistTemplateId?: string | null;
  checklistTemplateName?: string | null;
}

export interface StageTemplateStageDto {
  id?: string;
  name: string;
  description?: string;
  isRequired: boolean;
  isDefaultActive?: boolean;
  order: number;
  tasks: StageTemplateTaskDto[];
}

export interface ProjectStageTemplateDto {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  stages: StageTemplateStageDto[];
}

export interface TemplateListItemDto {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  stageCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDetailDto extends ProjectStageTemplateDto {
  stageCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}
