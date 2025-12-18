// apps/web/components/gantt/GanttLegend.tsx
'use client';

import { GANTT_COLORS } from '@/lib/utils/ganttColors';

const LEGEND_ITEMS = [
  { key: 'pending', label: '대기' },
  { key: 'in_progress', label: '진행중' },
  { key: 'waiting', label: '대기중' },
  { key: 'completed', label: '완료' },
  { key: 'delayed', label: '지연' },
] as const;

export function GanttLegend() {
  return (
    <div className="flex gap-4 items-center mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-sm font-semibold text-gray-700">범례:</span>
      {LEGEND_ITEMS.map(item => (
        <div key={item.key} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${GANTT_COLORS[item.key]}`} />
          <span className="text-sm text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
