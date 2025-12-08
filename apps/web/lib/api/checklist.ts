import { api } from '../api';
import type { ChecklistItem, ChecklistResponse, ChecklistStatus } from '@/types/checklist';

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
