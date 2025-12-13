// apps/web/lib/api/tasks.ts
import { api } from './client';
import type { MyTaskItem } from '@/types';

export const getMyTasks = (bucket: string = 'all') =>
  api.get<MyTaskItem[]>('/tasks/my', {
    params: bucket && bucket !== 'all' ? { bucket } : {},
  });
