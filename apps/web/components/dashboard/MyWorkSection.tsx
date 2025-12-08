'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { MyWorkTab, MyWorkTaskDto, TaskStatus } from '@/types/dashboard';

const TABS: { key: MyWorkTab; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'in_progress', label: '진행중' },
  { key: 'waiting', label: '대기중' },
  { key: 'overdue', label: '기한초과' },
];

const EMPTY_MESSAGES: Record<MyWorkTab, string> = {
  today: '오늘 처리할 작업이 없습니다.',
  in_progress: '진행중인 작업이 없습니다.',
  waiting: '대기중인 작업이 없습니다.',
  overdue: '기한초과된 작업이 없습니다.',
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
  const map: Record<TaskStatus, { label: string; className: string }> = {
    pending: { label: '대기', className: 'bg-slate-100 text-slate-700' },
    in_progress: {
      label: '진행중',
      className: 'bg-blue-50 text-blue-700 border border-blue-100',
    },
    waiting: {
      label: '대기중',
      className: 'bg-amber-50 text-amber-700 border border-amber-100',
    },
    completed: {
      label: '완료',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    },
  };

  const { label, className } = map[status] ?? map.pending;

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', className)}>
      {label}
    </span>
  );
};

function formatDDay(dDay: number | null | undefined): string | null {
  if (dDay == null) return null;
  if (dDay === 0) return 'D-Day';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
}

export function MyWorkSection() {
  const [tab, setTab] = useState<MyWorkTab>('today');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<MyWorkTaskDto[]>({
    queryKey: ['dashboard', 'my-work', tab],
    queryFn: async () => {
      const res = await dashboardApi.getMyWork(tab);
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const tasks = data || [];

  const renderContent = () => {
    if (isLoading || isRefetching) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/60 animate-pulse"
            >
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
                <div className="h-6 w-12 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">My Work를 불러오는 중 오류가 발생했습니다.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
          {EMPTY_MESSAGES[tab]}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => {
          const dDayLabel = formatDDay(task.dDay);
          const dueDateLabel = task.dueDate ? formatDate(task.dueDate, 'yyyy.MM.dd') : null;

          return (
            <div
              key={task.taskId}
              className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/60"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{task.taskTitle}</span>
                  <StatusBadge status={task.status} />
                  {dDayLabel && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 text-white">
                      {dDayLabel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600">
                  {task.projectName} · {task.stageName}
                </div>
                {task.waitingFor && tab === 'waiting' && (
                  <div className="text-xs text-slate-700">대기 사유: {task.waitingFor}</div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {dueDateLabel ? <span>마감 {dueDateLabel}</span> : <span>마감일 없음</span>}
                {dDayLabel && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {dDayLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">My Work</h2>
          <p className="text-sm text-slate-500">오늘 해야 할 일과 진행중/대기중/기한초과 작업을 모아봅니다.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                tab === item.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </section>
  );
}
