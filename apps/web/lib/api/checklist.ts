// apps/web/lib/api/checklist.ts
import {
  ChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistResponse,
} from '@/types/checklist';
import { api } from './index';

// -----------------------------
// 1. 기존 체크리스트 (프로젝트 태스크별)
// -----------------------------

// 태스크별 체크리스트 조회
export async function getChecklist(taskId: string): Promise<ChecklistResponse> {
  try {
    const response = await api.get(`/checklist/${taskId}`);
    return response.data;
  } catch (error: any) {
    // ✅ 서버에서 "해당 태스크 체크리스트 없음" → 404 를 주는 경우
    if (error?.response?.status === 404) {
      const empty: ChecklistResponse = {
        taskId,
        items: [],
        summary: {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        },
      };
      return empty;
    }

    // 그 외 에러는 그대로 던져서 에러 화면 띄우기
    throw error;
  }
}

// 체크리스트 항목 생성
export async function createChecklistItem(
  taskId: string,
  data: { title: string },
): Promise<ChecklistItem> {
  const response = await api.post(`/checklist/${taskId}/items`, data);
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
  await api.post(`/checklist/${taskId}/reorder`, { orderedIds });
}

// 태스크에서 템플릿 리스트 조회 (모달에서 사용)
export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const response = await api.get('/checklist-templates');
  return response.data;
}

// 템플릿을 태스크 체크리스트로 적용
export async function applyTemplateToTask(
  taskId: string,
  templateId: string,
): Promise<ChecklistResponse> {
  const response = await api.post(`/checklist/${taskId}/apply-template`, {
    templateId,
  });
  return response.data;
}

// -----------------------------
// 2. 체크리스트 템플릿 관리 (/checklist-templates)
// -----------------------------

// 템플릿 목록 조회
export async function getChecklistTemplate(
  templateId: string,
): Promise<ChecklistTemplate & { items: ChecklistTemplateItem[] }> {
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

// 템플릿 항목 삭제
export async function deleteChecklistTemplateItem(
  itemId: string,
): Promise<void> {
  await api.delete(`/checklist-templates/items/${itemId}`);
}

// 템플릿 항목 순서 변경
export async function reorderChecklistTemplateItems(
  templateId: string,
  orderedIds: string[],
): Promise<void> {
  await api.post(`/checklist-templates/${templateId}/reorder`, {
    orderedIds,
  });
}
