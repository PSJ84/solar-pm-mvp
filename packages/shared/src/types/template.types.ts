export interface StageTemplateTaskDto {
  id?: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  ownerCategory?: string;
  automationCategory?: string;
  order: number;
}

export interface StageTemplateStageDto {
  id?: string;
  name: string;
  description?: string;
  isRequired: boolean;
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
