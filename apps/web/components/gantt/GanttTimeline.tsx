// apps/web/components/gantt/GanttTimeline.tsx
'use client';

import { generateMonthHeaders, getDaysBetween, getTodayPosition } from '@/lib/utils/ganttCalculations';

interface GanttTimelineProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  today: Date;
}

export function GanttTimeline({ startDate, endDate, dayWidth, today }: GanttTimelineProps) {
  const monthHeaders = generateMonthHeaders(startDate, endDate);
  const showTodayLine = today >= startDate && today <= endDate;
  const todayPosition = showTodayLine
    ? getTodayPosition(startDate, today, dayWidth)
    : 0;

  // Debug logging
  console.log('[GanttTimeline] Today line:', {
    today_date: today.toISOString().split('T')[0],
    today_local: today.toLocaleString('ko-KR'),
    startDate_date: startDate.toISOString().split('T')[0],
    startDate_local: startDate.toLocaleString('ko-KR'),
    endDate_date: endDate.toISOString().split('T')[0],
    showTodayLine,
    todayPosition: `${todayPosition}px`
  });

  return (
    <div className="relative">
      {/* 월 헤더 */}
      <div className="flex border-b-2 border-gray-300 bg-slate-50">
        {monthHeaders.map((header, idx) => (
          <div
            key={idx}
            className="border-r border-gray-300 text-center py-2 font-semibold text-sm"
            style={{ width: `${header.dayCount * dayWidth}px` }}
          >
            {header.year} {header.month}
          </div>
        ))}
      </div>

      {/* 일 헤더 */}
      <div className="flex border-b border-gray-300 bg-gray-50">
        {Array.from({
          length: getDaysBetween(startDate, endDate) + 1,
        }).map((_, idx) => {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + idx);
          const day = currentDate.getDate();
          const isWeekend = [0, 6].includes(currentDate.getDay());

          return (
            <div
              key={idx}
              className={`border-r border-gray-200 text-center text-xs py-1 ${
                isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-600'
              }`}
              style={{ width: `${dayWidth}px` }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 오늘 날짜 세로선 */}
      {showTodayLine && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
          style={{ left: `${todayPosition}px` }}
        >
          <div className="absolute -top-1 -left-2 bg-red-500 text-white text-xs px-1 rounded">
            오늘
          </div>
        </div>
      )}
    </div>
  );
}
