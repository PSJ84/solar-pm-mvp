// apps/web/app/tasks/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { tasksApi } from '@/lib/api';
import { cn, formatDate, STATUS_LABELS } from '@/lib/utils';
import type { MyTaskItem } from '@/types';

const BUCKETS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'today', label: '오늘' },
  { key: 'tomorrow', label: '내일' },
  { key: 'overdue', label: '지연' },
];

function getDDay(dueDate?: string | null, fallback?: number | null): number | null {
  if (fallback !== undefined && fallback !== null) return fallback;
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDDayLabel(dDay: number | null): string | null {
  if (dDay === null) return null;
  if (dDay === 0) return 'D-Day';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
}

export default function TasksPage() {
  const [bucket, setBucket] = useState<string>('all');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<MyTaskItem[]>({
    queryKey: ['myTasks', bucket],
    queryFn: async () => {
      const res = await tasksApi.getMyTasks(bucket);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const tasks = useMemo(() => data || [], [data]);

  const renderContent = () => {
    if (isLoading || isRefetching) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-3"
            >
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/4 bg-slate-100 rounded" />
              <div className="h-3 w-2/5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-2">
          <p className="font-medium">내 태스크를 불러오는 중 오류가 발생했습니다.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (!tasks.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          선택한 기간에 해당하는 태스크가 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => {
          const statusConfig = STATUS_LABELS[task.status];
          const dDay = getDDay(task.dueDate, task.dDay ?? null);
          const dDayLabel = formatDDayLabel(dDay);
          const dueLabel = task.dueDate ? formatDate(task.dueDate, 'yyyy.MM.dd') : '마감일 없음';

          return (
            <div
              key={task.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-slate-900">{task.title}</span>
                {statusConfig && (
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                )}
                {dDayLabel && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 text-white">
                    {dDayLabel}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{task.project?.name || '프로젝트 미지정'}</span>
                <span className="text-slate-400">·</span>
                <span>{task.stage?.name || '단계 미지정'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">마감 {dueLabel}</span>
                {dDayLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{dDayLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">내 태스크</h1>
            <p className="text-slate-600 mt-1">프로젝트와 상관없이 내 작업을 한 곳에서 확인하세요.</p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {BUCKETS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setBucket(item.key)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
                bucket === item.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
    </AppShell>
  );
}
