// apps/web/lib/api/checklist.ts

import {
  ChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistResponse,
} from '@/types/checklist';
import { api } from '../api';

// -----------------------------
// 기존 체크리스트(태스크별) API
// -----------------------------

// 태스크별 체크리스트 조회
export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  const res = await api.get(`/tasks/${taskId}/checklist`);
  return res.data;
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string; hasExpiry?: boolean; dueDate?: string | null },
): Promise<ChecklistItem> {
  const res = await api.post(`/tasks/${taskId}/checklist/items`, data);
  return res.data;
}

// 체크리스트 항목 수정
export async function updateChecklistItem(
  taskId: string,
  itemId: string,
  data: Partial<ChecklistItem>,
): Promise<ChecklistItem> {
  const res = await api.patch(`/tasks/${taskId}/checklist/items/${itemId}`, data);
  return res.data;
}

// 체크리스트 항목 삭제
export async function deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/checklist/items/${itemId}`);
}

// 체크리스트 항목 순서 변경
export async function reorderChecklist(
  taskId: string,
  data: { itemIds: string[] },
): Promise<void> {
  await api.post(`/tasks/${taskId}/checklist/reorder`, data);
}

// -----------------------------
// 체크리스트 템플릿 관련 API
// -----------------------------

// 템플릿 목록 조회
export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const res = await api.get('/checklist-templates');
  return res.data;
}

// 템플릿 생성
export async function createChecklistTemplate(
  data: { name: string; description?: string | null },
): Promise<ChecklistTemplate> {
  const res = await api.post('/checklist-templates', data);
  return res.data;
}

// 템플릿 삭제
export async function deleteChecklistTemplate(templateId: string): Promise<void> {
  await api.delete(`/checklist-templates/${templateId}`);
}

// 특정 템플릿 상세 조회
export async function getChecklistTemplate(
  templateId: string,
): Promise<ChecklistTemplate & { items: ChecklistTemplateItem[] }> {
  const res = await api.get(`/checklist-templates/${templateId}`);
  return res.data;
}

// 템플릿 기본 정보 수정
export async function updateChecklistTemplate(
  templateId: string,
  data: Partial<ChecklistTemplate>,
): Promise<ChecklistTemplate> {
  const res = await api.patch(`/checklist-templates/${templateId}`, data);
  return res.data;
}

// 템플릿에 항목 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  const res = await api.post(`/checklist-templates/${templateId}/items`, data);
  return res.data;
}

// 템플릿 항목 수정
export async function updateChecklistTemplateItem(
  templateId: string,
  itemId: string,
  data: Partial<ChecklistTemplateItem>,
): Promise<ChecklistTemplateItem> {
  const res = await api.patch(`/checklist-templates/${templateId}/items/${itemId}`, data);
  return res.data;
}

// 템플릿 항목 삭제
export async function deleteChecklistTemplateItem(
  templateId: string,
  itemId: string,
): Promise<void> {
  await api.delete(`/checklist-templates/${templateId}/items/${itemId}`);
}

// 템플릿 항목 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  data: { itemIds: string[] },
): Promise<void> {
  await api.post(`/checklist-templates/${templateId}/items/reorder`, data);
}

// -----------------------------
// 템플릿 → 태스크 적용 API
// -----------------------------

// 특정 템플릿을 태스크에 적용
export async function applyTemplateToTask(taskId: string, templateId: string): Promise<void> {
  await api.post(`/tasks/${taskId}/checklist/apply-template`, { templateId });
}
