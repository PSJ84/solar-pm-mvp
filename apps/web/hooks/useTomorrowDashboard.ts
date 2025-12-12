// apps/web/hooks/useTomorrowDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getTomorrowDashboard } from '@/lib/api';
import type { TomorrowDashboardResponse } from '@/types/dashboard';

export function useTomorrowDashboard() {
  return useQuery<TomorrowDashboardResponse>({
    queryKey: ['dashboard', 'tomorrow'],
    queryFn: async () => {
      const res = await getTomorrowDashboard();
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
