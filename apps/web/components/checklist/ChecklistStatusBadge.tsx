'use client';

import { CHECKLIST_STATUS, type ChecklistStatus } from '@/types/checklist';

interface Props {
  status: ChecklistStatus;
  onChange?: (status: ChecklistStatus) => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  requested: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  received: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
  reviewing: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  needs_revision: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  completed: 'bg-green-100 text-green-700 hover:bg-green-200',
};

export function ChecklistStatusBadge({ status, onChange, disabled }: Props) {
  const config = CHECKLIST_STATUS[status];

  if (!onChange) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${STATUS_COLORS[status]}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className="relative group">
      <button
        type="button"
        disabled={disabled}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${STATUS_COLORS[status]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span className="ml-1 text-xs">▼</span>
      </button>

      {!disabled && (
        <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[140px]">
          {Object.entries(CHECKLIST_STATUS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key as ChecklistStatus)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${key === status ? 'bg-gray-50' : ''}`}
            >
              <span>{value.icon}</span>
              <span>{value.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
