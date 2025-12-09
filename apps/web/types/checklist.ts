export const CHECKLIST_STATUS = {
  pending: { label: '대기', color: 'gray', icon: '☐' },
  requested: { label: '요청함', color: 'blue', icon: '📤' },
  received: { label: '수령완료', color: 'cyan', icon: '📥' },
  reviewing: { label: '검토중', color: 'yellow', icon: '🔍' },
  needs_revision: { label: '보완필요', color: 'orange', icon: '⚠️' },
  completed: { label: '완료', color: 'green', icon: '✅' },
} as const;

export type ChecklistStatus = keyof typeof CHECKLIST_STATUS;

export interface ChecklistItem {
  id: string;
  title: string;
  status: ChecklistStatus;
  memo: string | null;
  order: number;
  issuedAt: string | null;
  expiresAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSummary {
  total: number;
  completed: number;
  progress: number;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  summary: ChecklistSummary;
}

export interface ChecklistTemplateItem {
  id: string;
  title: string;
  order: number;
  hasExpiry: boolean;
  templateId: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  items: ChecklistTemplateItem[];
  _count?: {
    items: number;
  };
  createdAt: string;
  updatedAt: string;
}
