import { api } from '../api';
import type {
  ChecklistItem,
  ChecklistResponse,
  ChecklistStatus,
  ChecklistTemplate,
  ChecklistTemplateItem,
} from '@/types/checklist';

export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  const response = await api.get(`/tasks/${taskId}/checklist`);
  return response.data;
}

export async function createChecklistItem(
  taskId: string,
  data: { title: string; status?: ChecklistStatus },
): Promise<ChecklistItem> {
  const response = await api.post(`/tasks/${taskId}/checklist`, data);
  return response.data;
}

export async function updateChecklistItem(
  id: string,
  data: Partial<{
    title: string;
    status: ChecklistStatus;
    memo: string;
    issuedAt: string;
    expiresAt: string;
  }>,
): Promise<ChecklistItem> {
  const response = await api.patch(`/checklist/${id}`, data);
  return response.data;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await api.delete(`/checklist/${id}`);
}

export async function reorderChecklist(taskId: string, itemIds: string[]): Promise<ChecklistResponse> {
  const response = await api.patch(`/tasks/${taskId}/checklist/reorder`, { itemIds });
  return response.data;
}

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const response = await api.get('/checklist-templates');
  return response.data;
}

export async function applyTemplateToTask(
  templateId: string,
  taskId: string,
): Promise<{ applied: number; total: number; items: ChecklistItem[] }> {
  const response = await api.post(`/checklist-templates/${templateId}/apply/${taskId}`);
  return response.data;
}

// 템플릿 상세 조회
export async function getChecklistTemplate(id: string): Promise<ChecklistTemplate> {
  const response = await api.get(`/checklist-templates/${id}`);
  return response.data;
}

// 템플릿 생성
export async function createChecklistTemplate(data: {
  name: string;
  description?: string;
}): Promise<ChecklistTemplate> {
  const response = await api.post('/checklist-templates', data);
  return response.data;
}

// 템플릿 수정
export async function updateChecklistTemplate(
  id: string,
  data: { name?: string; description?: string },
): Promise<ChecklistTemplate> {
  const response = await api.patch(`/checklist-templates/${id}`, data);
  return response.data;
}

// 템플릿 삭제
export async function deleteChecklistTemplate(id: string): Promise<void> {
  await api.delete(`/checklist-templates/${id}`);
}

// 템플릿에 아이템 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  const response = await api.post(`/checklist-templates/${templateId}/items`, data);
  return response.data;
}

// 템플릿 아이템 수정
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  // 백엔드 DTO에 맞는 필드만 보낸다
  const payload = {
    title: data.title,
    hasExpiry: data.hasExpiry ?? false,
  };

  const response = await api.post(`/checklist-templates/${templateId}/items`, payload);
  return response.data;
}

// 템플릿 아이템 삭제
export async function deleteChecklistTemplateItem(itemId: string): Promise<void> {
  await api.delete(`/checklist-templates/items/${itemId}`);
}

// 템플릿 아이템 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  itemIds: string[],
): Promise<void> {
  await api.patch(`/checklist-templates/${templateId}/items/reorder`, { itemIds });
}
