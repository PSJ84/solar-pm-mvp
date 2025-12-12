// apps/web/lib/api/dashboard.ts
import { api } from './client';
import type { TomorrowDashboardResponse } from '@/types/dashboard';

export const getTomorrowDashboard = () =>
  api.get<TomorrowDashboardResponse>('/dashboard/tomorrow');
