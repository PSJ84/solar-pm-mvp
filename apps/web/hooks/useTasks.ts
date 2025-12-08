// apps/web/hooks/useTasks.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import type { AvailableTemplatesResponse } from '@/types/task-template';
import type { Task } from '@/types';

export function useAvailableTaskTemplates(stageId?: string) {
  return useQuery({
    queryKey: ['available-task-templates', stageId],
    queryFn: async () => {
      const res = await tasksApi.getAvailableTaskTemplates(stageId as string);
      return res.data as AvailableTemplatesResponse;
    },
    enabled: Boolean(stageId),
  });
}

export function useCreateTaskFromTemplate(stageId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await tasksApi.createFromTemplate(stageId, templateId);
      return res.data as Task;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['available-task-templates', stageId] });
    },
  });
}

export function useCreateTask(stageId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string }) => {
      const res = await tasksApi.create({ ...payload, projectStageId: stageId });
      return res.data as Task;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['available-task-templates', stageId] });
    },
  });
}
