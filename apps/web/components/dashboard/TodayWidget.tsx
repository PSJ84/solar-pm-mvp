// apps/web/components/dashboard/TodayWidget.tsx
'use client';

import Link from 'next/link';
import { CalendarClock, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { cn, STATUS_LABELS } from '@/lib/utils';
import type { TaskSummaryItem } from '@/lib/api';

interface TodayWidgetProps {
  tasks: TaskSummaryItem[];
  upcoming7Days?: TaskSummaryItem[];
}

export function TodayWidget({ tasks, upcoming7Days = [] }: TodayWidgetProps) {
  const todayCount = tasks.length;
  const upcomingCount = upcoming7Days.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <CalendarClock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">오늘 마감</h3>
            <p className="text-sm text-slate-500">
              {todayCount}건 
              {upcomingCount > 0 && (
                <span className="text-blue-500 ml-2">
                  · 이번 주 {upcomingCount}건
                </span>
              )}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/today"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          전체 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 태스크 리스트 */}
      <div className="divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500">
            🎉 오늘 마감 예정인 태스크가 없습니다.
          </div>
        ) : (
          tasks.slice(0, 5).map((task) => {
            const statusConfig = STATUS_LABELS[task.status] || STATUS_LABELS.pending;
            
            return (
              <Link
                key={task.id}
                href={`/projects/${task.projectId}?task=${task.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                {/* 필수 표시 */}
                {task.isMandatory && (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                
                {/* 태스크 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {task.title}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {task.projectName} · {task.stageName}
                  </p>
                </div>

                {/* 상태 배지 */}
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full flex-shrink-0',
                    statusConfig.color
                  )}
                >
                  {statusConfig.label}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* 이번 주 마감 미리보기 (오늘 마감이 적을 때) */}
      {tasks.length < 3 && upcoming7Days.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-5 py-2 bg-blue-50 text-xs text-blue-700 font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            이번 주 마감 예정
          </div>
          {upcoming7Days.slice(0, 3).map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}?task=${task.id}`}
              className="flex items-center gap-4 px-5 py-2 hover:bg-slate-50 transition-colors text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 truncate">{task.title}</p>
                <p className="text-xs text-slate-400">
                  {task.projectName} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 더보기 (5개 초과시) */}
      {tasks.length > 5 && (
        <div className="px-5 py-3 bg-slate-50 text-center">
          <Link
            href="/dashboard/today"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            +{tasks.length - 5}건 더 보기
          </Link>
        </div>
      )}
    </div>
  );
}
