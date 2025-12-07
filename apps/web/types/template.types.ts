// apps/web/types/template.types.ts

// 템플릿 상세 조회 DTO
export interface TemplateDetailDto {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  stageCount: number;
  taskCount: number;
  updatedAt: string; // ISO 문자열
  stages: StageTemplateStageDto[];
}

// 프로젝트에 붙이는 템플릿 구조 저장용 DTO
export interface ProjectStageTemplateDto {
  id?: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  stages: StageTemplateStageDto[];
}

// 단계 DTO
export interface StageTemplateStageDto {
  id?: string; // 새 단계일 수도 있으니 optional
  name: string;
  description?: string | null;
  isDefaultActive: boolean;
  defaultDueDays?: number | null;
  order: number;
  tasks: StageTemplateTaskDto[];
}

// 태스크 DTO
export interface StageTemplateTaskDto {
  // 🔥 여기 핵심 : id는 선택(optional)
  id?: string;

  name: string;
  description?: string | null;
  isMandatory: boolean;
  isDefaultActive: boolean;
  defaultDueDays?: number | null;
  order: number;
}
