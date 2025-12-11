import type {
  ChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistStatus,
  ChecklistResponse,
} from '@/types/checklist';
import { api } from './client';

// -----------------------------
// 기존 체크리스트(태스크별) API
// -----------------------------

// 태스크의 체크리스트 전체 조회
export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  const response = await api.get(`/tasks/${taskId}/checklist`);
  return response.data;
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string; status?: ChecklistStatus },
): Promise<ChecklistItem> {
  const response = await api.post(`/tasks/${taskId}/checklist`, data);
  return response.data;
}

// 체크리스트 항목 수정
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

// 체크리스트 항목 삭제
export async function deleteChecklistItem(id: string): Promise<void> {
  await api.delete(`/checklist/${id}`);
}

// 체크리스트 항목 순서 변경
export async function reorderChecklist(taskId: string, itemIds: string[]): Promise<ChecklistResponse> {
  const response = await api.patch(`/tasks/${taskId}/checklist/reorder`, { itemIds });
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

// 템플릿 수정 (이름 / 설명)
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

// 템플릿에 체크리스트 항목 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; order?: number; hasExpiry?: boolean },
): Promise<ChecklistTemplateItem> {
  // ❗ 백엔드 DTO는 title / hasExpiry 만 허용하므로 나머지 필드는 제거해서 전송
  const payload: any = { title: data.title };
  if (data.hasExpiry !== undefined) {
    payload.hasExpiry = data.hasExpiry;
  }

  const response = await api.post(`/checklist-templates/${templateId}/items`, payload);
  return response.data;
}

// 템플릿 항목 수정
export async function updateChecklistTemplateItem(
  itemId: string,
  data: { title?: string; hasExpiry?: boolean; order?: number },
): Promise<ChecklistTemplateItem> {
  // ❗ order 는 서버 DTO에 없으므로 전달하지 않음
  const payload: any = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.hasExpiry !== undefined) payload.hasExpiry = data.hasExpiry;

  const response = await api.patch(`/checklist-templates/items/${itemId}`, payload);
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
): Promise<void> {
  // ❗ 서버 DTO 형식 { items: [{ id, order }, ...] } 에 맞게 변환
  const items = itemIds.map((id, index) => ({ id, order: index + 1 }));
  await api.patch(`/checklist-templates/${templateId}/items/reorder`, { items });
}
