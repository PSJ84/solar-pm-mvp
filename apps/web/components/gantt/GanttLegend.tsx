// apps/web/components/gantt/GanttLegend.tsx
'use client';

import { GANTT_COLORS, GANTT_STAGE_COLORS, GANTT_MILESTONE_COLORS } from '@/lib/utils/ganttColors';

const LEGEND_ITEMS = [
  { key: 'pending', label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'waiting', label: '대기중' },
  { key: 'completed', label: '완료' },
  { key: 'delayed', label: '지연' },
] as const;

export function GanttLegend() {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-sm font-semibold text-gray-700">범례:</span>

      {/* Task status legend items */}
      {LEGEND_ITEMS.map(item => (
        <div key={item.key} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${GANTT_COLORS[item.key]}`} />
          <span className="text-sm text-gray-700">{item.label}</span>
        </div>
      ))}

      {/* Divider */}
      <div className="h-4 w-px bg-gray-300" />

      {/* Stage bar legend */}
      <div className="flex items-center gap-2">
        <div className={`w-6 h-2 rounded border ${GANTT_STAGE_COLORS.bar}`} />
        <span className="text-sm text-gray-700">단계 일정</span>
      </div>

      {/* Received date milestone legend */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rotate-45 border ${GANTT_MILESTONE_COLORS.receivedDate}`} />
        <span className="text-sm text-gray-700">접수일</span>
      </div>
    </div>
  );
}
