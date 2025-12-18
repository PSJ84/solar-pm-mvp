// apps/web/components/gantt/GanttStageBar.tsx
'use client';

import { useState } from 'react';
import type { GanttStage } from '@/types';
import { GANTT_STAGE_COLORS, GANTT_MILESTONE_COLORS } from '@/lib/utils/ganttColors';
import { calculateBarPosition, calculateBarWidth } from '@/lib/utils/ganttCalculations';
import { formatDate } from '@/lib/utils';

interface GanttStageBarProps {
  stage: GanttStage;
  viewportStart: Date;
  dayWidth: number;
}

export function GanttStageBar({ stage, viewportStart, dayWidth }: GanttStageBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Only render if stage has both startDate and completedDate
  if (!stage.startDate || !stage.completedDate) return null;

  const stageStart = new Date(stage.startDate);
  const stageEnd = new Date(stage.completedDate);

  const left = calculateBarPosition(stageStart, viewportStart, dayWidth);
  const width = calculateBarWidth(stageStart, stageEnd, dayWidth);

  // Calculate received date marker position if it exists
  let receivedDatePosition: number | null = null;
  if (stage.receivedDate) {
    const receivedDate = new Date(stage.receivedDate);
    receivedDatePosition = calculateBarPosition(receivedDate, viewportStart, dayWidth) - left;
  }

  return (
    <div
      className="relative"
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-2 rounded border shadow-sm transition-all ${
          isHovered ? GANTT_STAGE_COLORS.barHover : GANTT_STAGE_COLORS.bar
        } opacity-90`}
      >
        {/* Received date milestone marker */}
        {receivedDatePosition !== null && receivedDatePosition >= 0 && receivedDatePosition <= width && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${receivedDatePosition}px` }}
          >
            {/* Diamond shape (rotated square) */}
            <div
              className={`w-2.5 h-2.5 rotate-45 border ${GANTT_MILESTONE_COLORS.receivedDate} shadow-sm`}
            />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute z-50 bottom-full mb-2 left-0 bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap">
          <div className="font-semibold mb-1">{stage.name}</div>
          <div>시작: {formatDate(stage.startDate, 'yyyy-MM-dd')}</div>
          {stage.receivedDate && (
            <div>접수: {formatDate(stage.receivedDate, 'yyyy-MM-dd')}</div>
          )}
          <div>완료: {formatDate(stage.completedDate, 'yyyy-MM-dd')}</div>
          {/* Arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
