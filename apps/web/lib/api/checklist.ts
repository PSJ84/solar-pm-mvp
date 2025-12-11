// apps/web/lib/api/checklist.ts
import {
  ChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistResponse,
} from '@/types/checklist';
import { api } from '..';

// -----------------------------
// 1. 기존 체크리스트 (프로젝트 태스크별)
// -----------------------------

// 태스크별 체크리스트 조회
export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  try {
    const res = await api.get(`/checklist/${taskId}`);
    return res.data;
  } catch (error: any) {
    // 서버가 "해당 태스크에 체크리스트 없음"을 404로 보내는 경우를 대비해서
    if (error?.response?.status === 404) {
      return {
        taskId,
        items: [],
      } as ChecklistResponse;
    }
    throw error;
  }
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string },
): Promise<ChecklistItem> {
  const res = await api.post(`/checklist/${taskId}/items`, data);
  return res.data;
}

// 체크리스트 항목 수정
export async function updateChecklistItem(
  itemId: string,
  data: Partial<ChecklistItem>,
): Promise<ChecklistItem> {
  const res = await api.patch(`/checklist/${itemId}`, data);
  return res.data;
}

// 체크리스트 항목 삭제
export async function deleteChecklistItem(itemId: string): Promise<void> {
  await api.delete(`/checklist/${itemId}`);
}

// 체크리스트 항목 순서 변경
export async function reorderChecklist(taskId: string, orderedIds: string[]): Promise<void> {
  await api.post(`/checklist/${taskId}/reorder`, { orderedIds });
}

// -----------------------------
// 2. 템플릿 목록 (태스크에서 선택용)
// -----------------------------

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const res = await api.get('/checklist-templates');
  return res.data;
}

// (지금은 안 써도 되는 함수. 서버에 /checklist/:taskId/apply-template 라우트가
// 있다면 나중에 쓸 수 있게 남겨둠)
export async function applyTemplateToTask(
  taskId: string,
  templateId: string,
): Promise<ChecklistResponse> {
  const res = await api.post(`/checklist/${taskId}/apply-template`, { templateId });
  return res.data;
}

// -----------------------------
// 3. 체크리스트 템플릿 관리용 API
// -----------------------------

// 템플릿 상세 조회
export async function getChecklistTemplate(
  templateId: string,
): Promise<ChecklistTemplate & { items: ChecklistTemplateItem[] }> {
  const res = await api.get(`/checklist-templates/${templateId}`);
  return res.data;
}

// 템플릿 생성
export async function createChecklistTemplate(
  data: { name: string; description?: string | null },
): Promise<ChecklistTemplate> {
  const payload = {
    name: data.name,
    description: data.description ?? null,
  };

  const res = await api.post('/checklist-templates', payload);
  return res.data;
}

// 템플릿 수정
export async function updateChecklistTemplate(
  templateId: string,
  data: { name?: string; description?: string | null },
): Promise<ChecklistTemplate> {
  const payload: { name?: string; description?: string | null } = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description ?? null;

  const res = await api.patch(`/checklist-templates/${templateId}`, payload);
  return res.data;
}

// 템플릿 삭제
export async function deleteChecklistTemplate(templateId: string): Promise<void> {
  await api.delete(`/checklist-templates/${templateId}`);
}

// 템플릿에 항목 추가
export async function addChecklistTemplateItem(
  templateId: string,
  data: { title: string; hasExpiry?: boolean; validDays?: number | null },
): Promise<ChecklistTemplateItem> {
  const res = await api.post(`/checklist-templates/${templateId}/items`, data);
  return res.data;
}

// 템플릿 항목 수정
export async function updateChecklistTemplateItem(
  itemId: string,
  data: Partial<ChecklistTemplateItem>,
): Promise<ChecklistTemplateItem> {
  const res = await api.patch(`/checklist-templates/items/${itemId}`, data);
  return res.data;
}

// 템플릿 항목 삭제
export async function deleteChecklistTemplateItem(itemId: string): Promise<void> {
  await api.delete(`/checklist-templates/items/${itemId}`);
}

// 템플릿 항목 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  orderedIds: string[],
): Promise<void> {
  await api.post(`/checklist-templates/${templateId}/reorder`, { orderedIds });
}
