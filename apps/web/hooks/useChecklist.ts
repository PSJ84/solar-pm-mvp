import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklist,
  getChecklistTemplates,
  applyTemplateToTask,
} from '@/lib/api/checklist';
import type { ChecklistStatus } from '@/types/checklist';

export function useChecklist(taskId: string) {
  return useQuery({
    queryKey: ['checklist', taskId],
    queryFn: () => getChecklist(taskId),
    enabled: Boolean(taskId),
  });
}

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ['checklist-templates'],
    queryFn: getChecklistTemplates,
  });
}

export function useApplyTemplate(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => applyTemplateToTask(templateId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', taskId] });
    },
  });
}

export function useCreateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; status?: ChecklistStatus }) => createChecklistItem(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', taskId] });
    },
  });
}

export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; status: ChecklistStatus; memo: string }> }) =>
      updateChecklistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', taskId] });
    },
  });
}

export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteChecklistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', taskId] });
    },
  });
}

export function useReorderChecklist(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemIds: string[]) => reorderChecklist(taskId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', taskId] });
    },
  });
}