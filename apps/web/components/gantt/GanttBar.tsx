// apps/web/components/gantt/GanttBar.tsx
'use client';

import { useState } from 'react';
import type { GanttTask } from '@/types';
import { GANTT_COLORS, GANTT_TEXT_COLORS } from '@/lib/utils/ganttColors';
import { calculateBarPosition, calculateBarWidth } from '@/lib/utils/ganttCalculations';
import { formatDate } from '@/lib/utils';

interface GanttBarProps {
  task: GanttTask;
  viewportStart: Date;
  dayWidth: number;
}

export function GanttBar({ task, viewportStart, dayWidth }: GanttBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!task.startDate || !task.dueDate) return null;

  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.dueDate);

  const left = calculateBarPosition(taskStart, viewportStart, dayWidth);
  const width = calculateBarWidth(taskStart, taskEnd, dayWidth);

  // 상태별 색상 결정
  const isDelayed =
    task.status !== 'completed' && new Date(task.dueDate) < new Date();
  const colorKey = isDelayed ? 'delayed' : task.status;
  const bgColor = GANTT_COLORS[colorKey];
  const textColor = GANTT_TEXT_COLORS[colorKey];

  return (
    <div
      className="relative"
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-6 rounded border shadow-sm ${bgColor} flex items-center justify-center px-2 cursor-pointer transition-shadow hover:shadow-md`}
      >
        <span className={`text-xs font-medium truncate ${textColor}`}>
          {task.progress}%
        </span>
      </div>

      {/* 툴팁 */}
      {isHovered && (
        <div className="absolute z-50 bottom-full mb-2 left-0 bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap">
          <div className="font-semibold mb-1">{task.title}</div>
          <div>시작: {formatDate(task.startDate, 'yyyy-MM-dd')}</div>
          <div>종료: {formatDate(task.dueDate, 'yyyy-MM-dd')}</div>
          {task.assignee && <div>담당: {task.assignee.name}</div>}
          <div>진행률: {task.progress}%</div>
          {/* 화살표 */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
