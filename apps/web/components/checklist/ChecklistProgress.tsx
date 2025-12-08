'use client';

import type { ChecklistSummary } from '@/types/checklist';

interface Props {
  summary: ChecklistSummary;
}

export function ChecklistProgress({ summary }: Props) {
  const { total, completed, progress } = summary;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
}
