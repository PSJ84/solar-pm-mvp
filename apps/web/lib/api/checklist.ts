// apps/web/lib/api/checklist.ts
import type {
  ChecklistItem,
  ChecklistStatus,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistResponse,
} from '@/types/checklist';
import { api } from '../api';

// -----------------------------
// 기존 체크리스트(태스크별) API
// -----------------------------

// 특정 태스크의 체크리스트 조회
export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  const response = await api.get(`/tasks/${taskId}/checklist`);
  return response.data;
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string; dueDate?: string | null },
): Promise<ChecklistItem> {
  const response = await api.post(`/tasks/${taskId}/checklist`, data);
  return response.data;
}

// 체크리스트 항목 수정
export async function updateChecklistItem(
  itemId: string,
  data: Partial<Pick<ChecklistItem, 'title' | 'dueDate' | 'status'>>,
): Promise<ChecklistItem> {
  const response = await api.patch(`/checklist/${itemId}`, data);
  return response.data;
}

// 체크리스트 항목 삭제
export async function deleteChecklistItem(itemId: string): Promise<void> {
  await api.delete(`/checklist/${itemId}`);
}

// 체크리스트 순서 변경
export async function reorderChecklist(
  taskId: string,
  itemIds: string[],
): Promise<ChecklistResponse> {
  const response = await api.patch(`/tasks/${taskId}/checklist/reorder`, {
    itemIds,
  });
  return response.data;
}

// 체크리스트 상태 일괄 변경(예: 전체 완료로 표시)
export async function updateChecklistStatus(
  taskId: string,
  status: ChecklistStatus,
): Promise<ChecklistResponse> {
  const response = await api.patch(`/tasks/${taskId}/checklist/status`, { status });
  return response.data;
}

// -----------------------------
// 체크리스트 템플릿 관련 API
// -----------------------------

// 템플릿 목록 조회
export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const response = await api.get('/checklist-templates');
  return response.data;
}

// 템플릿 단일 조회
export async function getChecklistTemplate(id: string): Promise<ChecklistTemplate> {
  const response = await api.get(`/checklist-templates/${id}`);
  return response.data;
}

// 템플릿 생성
export async function createChecklistTemplate(
  data: Pick<ChecklistTemplate, 'name' | 'description'>,
): Promise<ChecklistTemplate> {
  const response = await api.post('/checklist-templates', data);
  return response.data;
}

// 템플릿 수정
export async function updateChecklistTemplate(
  id: string,
  data: Partial<Pick<ChecklistTemplate, 'name' | 'description'>>,
): Promise<ChecklistTemplate> {
  const response = await api.patch(`/checklist-templates/${id}`, data);
  return response.data;
}

// 템플릿 삭제
export async function deleteChecklistTemplate(id: string): Promise<void> {
  await api.delete(`/checklist-templates/${id}`);
}

// 템플릿을 특정 태스크에 적용
export async function applyTemplateToTask(
  templateId: string,
  taskId: string,
): Promise<ChecklistResponse> {
  const response = await api.post(`/checklist-templates/${templateId}/apply/${taskId}`);
  return response.data;
}

// -----------------------------
// 템플릿 내 항목(item) 관련 API
// -----------------------------

// 템플릿에 항목 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  const response = await api.post(`/checklist-templates/${templateId}/items`, data);
  return response.data;
}

// 템플릿 항목 수정
export async function updateChecklistTemplateItem(
  itemId: string,
  data: Partial<Pick<ChecklistTemplateItem, 'title' | 'hasExpiry' | 'validDays'>>,
): Promise<ChecklistTemplateItem> {
  const response = await api.patch(`/checklist-templates/items/${itemId}`, data);
  return response.data;
}

// 템플릿 항목 삭제
export async function deleteChecklistTemplateItem(itemId: string): Promise<void> {
  await api.delete(`/checklist-templates/items/${itemId}`);
}

// 템플릿 항목 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  itemIds: string[],
): Promise<ChecklistTemplateItem[]> {
  const response = await api.patch(`/checklist-templates/${templateId}/items/reorder`, {
    itemIds,
  });
  return response.data;
}
