// apps/web/components/gantt/GanttChart.tsx
'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { GanttData } from '@/types';
import { GanttTimeline } from './GanttTimeline';
import { GanttBar } from './GanttBar';
import { GanttStageBar } from './GanttStageBar';
import { GanttLegend } from './GanttLegend';
import { getDaysBetween, addDaysLocal } from '@/lib/utils/ganttCalculations';

interface GanttChartProps {
  data: GanttData;
  dayWidth?: number;
}

export function GanttChart({ data, dayWidth = 40 }: GanttChartProps) {
  // 오늘 날짜를 클라이언트 시간대 기준으로 고정 (SSR 시점 영향 제거)
  const [today, setToday] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  useEffect(() => {
    const now = new Date();
    setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  // Early return with null check
  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        간트 차트를 표시할 데이터가 없습니다.
      </div>
    );
  }

  const { stages, dateRange } = data;

  // 날짜 범위에 여유 추가 - useState로 변경하여 네비게이션 가능하게
  // 로컬 타임존으로 날짜 생성 (UTC 파싱 방지)
  const [viewportStart, setViewportStart] = useState(() => {
    const minDate = new Date(dateRange.min);
    // 로컬 자정으로 정규화 (타임존 문제 방지)
    const date = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return addDaysLocal(date, -7); // 시작일 7일 전부터
  });

  const [viewportEnd, setViewportEnd] = useState(() => {
    const maxDate = new Date(dateRange.max);
    // 로컬 자정으로 정규화 (타임존 문제 방지)
    const date = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    return addDaysLocal(date, 14); // 종료일 14일 후까지
  });

  // 날짜 네비게이션 함수들
  // date-fns 제거: 수동으로 날짜 계산 (타임존 문제 방지)
  const shiftDays = (days: number) => {
    setViewportStart(prev => addDaysLocal(prev, days));
    setViewportEnd(prev => addDaysLocal(prev, days));
  };

  const goToToday = () => {
    const range = getDaysBetween(viewportStart, viewportEnd);
    const offsetBefore = Math.floor(range / 3);
    const offsetAfter = range - offsetBefore;

    setViewportStart(addDaysLocal(today, -offsetBefore));
    setViewportEnd(addDaysLocal(today, offsetAfter));
  };

  const totalDays = getDaysBetween(viewportStart, viewportEnd) + 1;
  const totalWidth = totalDays * dayWidth;

  // 날짜 있는 Task와 없는 Task 분리
  const tasksWithDates = stages.flatMap(stage =>
    stage.tasks.filter(task => task.startDate && task.dueDate)
  );

  const tasksWithoutDates = stages.flatMap(stage =>
    stage.tasks.filter(task => !task.startDate || !task.dueDate)
  );

  if (tasksWithDates.length === 0 && tasksWithoutDates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        표시할 작업이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 날짜 네비게이션 컨트롤 */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDays(-7)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {'< 1주'}
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            오늘
          </button>
          <button
            onClick={() => shiftDays(7)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
          >
            {'1주 >'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {format(viewportStart, 'yyyy년 M월 d일')} ~ {format(viewportEnd, 'yyyy년 M월 d일')}
        </div>
      </div>

      <GanttLegend />

      {/* 날짜 있는 Task들 - 간트 차트 */}
      {tasksWithDates.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* 헤더: 프로젝트 이름과 타임라인 */}
          <div className="flex bg-white border-b border-gray-200 sticky top-0 z-20">
            {/* 왼쪽: Task 이름 영역 */}
            <div className="w-80 flex-shrink-0 bg-slate-100 border-r border-gray-300">
              <div className="h-16 flex items-center justify-center font-bold text-gray-700 border-b-2 border-gray-300">
                작업
              </div>
              <div className="h-8 border-b border-gray-300" />
            </div>
            {/* 오른쪽: 타임라인 */}
            <div className="flex-1 overflow-x-auto">
              <GanttTimeline
                startDate={viewportStart}
                endDate={viewportEnd}
                dayWidth={dayWidth}
                today={today}
              />
            </div>
          </div>

          {/* 본문: Stage별 Task 목록 */}
          <div className="flex">
            {/* 왼쪽: Task 이름 영역 */}
            <div className="w-80 flex-shrink-0 bg-white border-r border-gray-300">
              {stages.map(stage => {
                const stageTasks = stage.tasks.filter(
                  task => task.startDate && task.dueDate
                );
                if (stageTasks.length === 0) return null;

                return (
                  <div key={stage.id}>
                    {/* Stage 헤더 */}
                    <div className="bg-slate-100 border-b border-gray-300 font-semibold py-2 px-4 text-sm">
                      {stage.name}
                    </div>
                    {/* Stage Bar 행 */}
                    <div className="bg-slate-50 border-b border-gray-200 py-1.5 px-4 text-xs text-gray-600 italic">
                      단계 일정
                    </div>
                    {/* Task 목록 */}
                    {stageTasks.map(task => (
                      <div
                        key={task.id}
                        className="py-2 px-4 border-b border-gray-200 hover:bg-slate-50 text-sm truncate"
                        title={task.title}
                      >
                        {task.title}
                        {task.assignee && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({task.assignee.name})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* 오른쪽: 간트 바 영역 */}
            <div className="flex-1 overflow-x-auto">
              <div className="relative" style={{ width: `${totalWidth}px` }}>
                {/* 배경 그리드 */}
                <div className="absolute inset-0 flex">
                  {Array.from({ length: totalDays }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border-r border-gray-100"
                      style={{ width: `${dayWidth}px` }}
                    />
                  ))}
                </div>

                {/* Stage별 간트 바 */}
                {stages.map(stage => {
                  const stageTasks = stage.tasks.filter(
                    task => task.startDate && task.dueDate
                  );
                  if (stageTasks.length === 0) return null;

                  return (
                    <div key={stage.id}>
                      {/* Stage 헤더 높이 */}
                      <div className="h-8 border-b border-gray-300" />
                      {/* Stage Bar 행 */}
                      <div className="h-6 border-b border-gray-200 relative flex items-center px-2">
                        <GanttStageBar
                          stage={stage}
                          viewportStart={viewportStart}
                          dayWidth={dayWidth}
                        />
                      </div>
                      {/* Task 바들 */}
                      {stageTasks.map(task => (
                        <div
                          key={task.id}
                          className="h-10 border-b border-gray-200 relative"
                        >
                          <GanttBar
                            task={task}
                            viewportStart={viewportStart}
                            dayWidth={dayWidth}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 없는 Task들 */}
      {tasksWithoutDates.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-3">
            날짜 미정 작업 ({tasksWithoutDates.length})
          </h3>
          <div className="space-y-2">
            {stages.map(stage => {
              const stageTasks = stage.tasks.filter(
                task => !task.startDate || !task.dueDate
              );
              if (stageTasks.length === 0) return null;

              return (
                <div key={stage.id}>
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {stage.name}
                  </div>
                  <div className="ml-4 space-y-1">
                    {stageTasks.map(task => (
                      <div
                        key={task.id}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {task.title}
                        {task.assignee && (
                          <span className="text-xs text-gray-500">
                            ({task.assignee.name})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
