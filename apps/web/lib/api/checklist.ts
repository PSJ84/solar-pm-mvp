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
  const response = await api.get(`/tasks/${taskId}/checklist`);
  return response.data;
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string },
): Promise<ChecklistItem> {
  const response = await api.post(`/tasks/${taskId}/checklist`, data);
  return response.data;
}

// 체크리스트 항목 수정
export async function updateChecklistItem(
  itemId: string,
  data: Partial<ChecklistItem>,
): Promise<ChecklistItem> {
  const response = await api.patch(`/checklist/${itemId}`, data);
  return response.data;
}

// 체크리스트 항목 삭제
export async function deleteChecklistItem(itemId: string): Promise<void> {
  await api.delete(`/checklist/${itemId}`);
}

// 체크리스트 항목 순서 변경
export async function reorderChecklist(
  taskId: string,
  orderedIds: string[],
): Promise<void> {
  await api.post(`/tasks/${taskId}/checklist/reorder`, {
    itemIds: orderedIds,
  });
}

// 템플릿 목록 조회 (태스크에서 템플릿 적용용)
export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const response = await api.get('/checklist-templates');
  return response.data;
}

// 템플릿을 태스크에 적용
export async function applyTemplateToTask(
  templateId: string,
  taskId: string,
): Promise<ChecklistResponse> {
  const response = await api.post(
    `/checklist-templates/${templateId}/apply/${taskId}`,
  );
  return response.data;
}

// -----------------------------
// 체크리스트 템플릿 관리용 API
// (설정 화면 /checklist-templates 에서 사용)
// -----------------------------

// 템플릿 상세 조회
export async function getChecklistTemplate(
  templateId: string,
): Promise<ChecklistTemplate> {
  const response = await api.get(`/checklist-templates/${templateId}`);
  return response.data;
}

// 템플릿 생성
export async function createChecklistTemplate(
  data: { name: string; description?: string | null },
): Promise<ChecklistTemplate> {
  const payload = {
    name: data.name,
    description: data.description ?? null,
  };

  const response = await api.post('/checklist-templates', payload);
  return response.data;
}

// 템플릿 수정
export async function updateChecklistTemplate(
  templateId: string,
  data: { name?: string; description?: string | null },
): Promise<ChecklistTemplate> {
  const payload: { name?: string; description?: string | null } = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description ?? null;

  const response = await api.patch(`/checklist-templates/${templateId}`, payload);
  return response.data;
}

// 템플릿 삭제
export async function deleteChecklistTemplate(
  templateId: string,
): Promise<void> {
  await api.delete(`/checklist-templates/${templateId}`);
}

// 템플릿에 항목 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  const response = await api.post(
    `/checklist-templates/${templateId}/items`,
    data,
  );
  return response.data;
}

// 템플릿 항목 수정
export async function updateChecklistTemplateItem(
  itemId: string,
  data: Partial<ChecklistTemplateItem>,
): Promise<ChecklistTemplateItem> {
  const response = await api.patch(`/checklist-templates/items/${itemId}`, data);
  return response.data;
}

// 🔥 템플릿 항목 삭제 (여기가 이번 에러 원인)
// 백엔드 라우트: DELETE /checklist-templates/items/:itemId
export async function deleteChecklistTemplateItem(
  itemId: string,
): Promise<void> {
  await api.delete(`/checklist-templates/items/${itemId}`);
}

// 템플릿 항목 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  orderedIds: string[],
): Promise<ChecklistTemplate> {
  const response = await api.patch(
    `/checklist-templates/${templateId}/items/reorder`,
    { itemIds: orderedIds },
  );
  return response.data;
}
