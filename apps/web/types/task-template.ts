// apps/web/types/task-template.ts
export interface AvailableTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  isMandatory: boolean;
  defaultDueDays: number | null;
  alreadyAdded: boolean;
  checklistTemplate: {
    id: string;
    name: string;
    itemCount: number;
  } | null;
}

export interface AvailableTemplatesResponse {
  stageId: string;
  stageName: string;
  templates: AvailableTaskTemplate[];
}
