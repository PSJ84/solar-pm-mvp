// apps/web/lib/utils/ganttColors.ts

export const GANTT_COLORS = {
  pending: 'bg-slate-200 border-slate-300',
  in_progress: 'bg-blue-400 border-blue-500',
  waiting: 'bg-yellow-400 border-yellow-500',
  completed: 'bg-green-500 border-green-600',
  delayed: 'bg-red-400 border-red-500',
} as const;

export const GANTT_TEXT_COLORS = {
  pending: 'text-slate-700',
  in_progress: 'text-white',
  waiting: 'text-slate-900',
  completed: 'text-white',
  delayed: 'text-white',
} as const;
