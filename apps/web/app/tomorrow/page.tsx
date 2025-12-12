// apps/web/app/tomorrow/page.tsx
'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarDays, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useTomorrowDashboard } from '@/hooks/useTomorrowDashboard';
import { cn, formatDate, getDueDateLabel } from '@/lib/utils';
import type { TaskSummary } from '@/types/dashboard';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: '대기', className: 'bg-slate-100 text-slate-700' },
    in_progress: { label: '진행중', className: 'bg-blue-50 text-blue-700 border border-blue-100' },
    waiting: { label: '대기중', className: 'bg-amber-50 text-amber-700 border border-amber-100' },
    completed: { label: '완료', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    delayed: { label: '지연', className: 'bg-red-50 text-red-700 border border-red-100' },
  };

  const fallback = { label: status, className: 'bg-slate-100 text-slate-700' };
  const { label, className } = map[status] ?? fallback;

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', className)}>
      {label}
    </span>
  );
}

function TaskCard({ task }: { task: TaskSummary }) {
  const dueLabel = task.dueDate ? getDueDateLabel(task.dueDate) : null;
  const dueDateText = task.dueDate ? formatDate(task.dueDate, 'M월 d일 (EEE)') : '마감일 없음';

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{task.title}</span>
            <StatusBadge status={task.status} />
          </div>
          {(task.project || task.stage) && (
            <div className="text-sm text-slate-600">
              {task.project?.name && <span>{task.project.name}</span>}
              {task.project?.name && task.stage?.name && <span className="mx-1 text-slate-400">·</span>}
              {task.stage?.name && <span>{task.stage.name}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-600">
          {dueLabel ? (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', dueLabel.color)}>
              <CalendarDays className="h-3.5 w-3.5" />
              {dueLabel.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              <CalendarDays className="h-3.5 w-3.5" />
              마감일 없음
            </span>
          )}
          {task.dueDate && <span className="text-[11px] text-slate-500">{dueDateText}</span>}
        </div>
      </div>
    </div>
  );
}

function TaskListSection({
  title,
  tasks,
  emptyText,
}: {
  title: string;
  tasks: TaskSummary[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{tasks.length}개</span>
      </div>

      {tasks.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>{emptyText}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function TomorrowPlannerPage() {
  const { data, isLoading, isError, refetch, isFetching } = useTomorrowDashboard();
  const displayDate = data?.date
    ? formatDate(`${data.date}T00:00:00+09:00`, 'yyyy년 M월 d일 (EEE)')
    : null;

  const big3 = data?.big3 ?? [];
  const overdue = data?.overdue ?? [];
  const dueToday = data?.dueToday ?? [];
  const dueTomorrow = data?.dueTomorrow ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-solar-600">내일 플래너</p>
            <h1 className="text-2xl font-bold text-slate-900">내일 뭐 하지?</h1>
            <p className="text-slate-600">
              {displayDate ? `${displayDate} · 자동으로 선정된 Big3` : '내일 해야 할 일을 한눈에 모았어요.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← 대시보드로 돌아가기
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg bg-solar-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-solar-600"
              disabled={isFetching}
            >
              새로고침
            </button>
          </div>
        </div>

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm animate-pulse"
              >
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 md:p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-solar-500" />
                <h2 className="text-lg font-semibold text-slate-900">내일 해야 할 3개 (Big3)</h2>
              </div>
              {big3.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>내일 Big3 없음 🎉 여유로운 하루가 될 것 같아요.</span>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {big3.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="xl:col-span-1">
                <TaskListSection title="지연 (Overdue)" tasks={overdue} emptyText="지연된 태스크가 없습니다." />
              </div>
              <div className="xl:col-span-1">
                <TaskListSection title="오늘 마감 (D-day)" tasks={dueToday} emptyText="오늘 마감 태스크 없음" />
              </div>
              <div className="xl:col-span-1">
                <TaskListSection title="내일 마감 (D-1)" tasks={dueTomorrow} emptyText="내일 마감 태스크 없음" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
