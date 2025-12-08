// apps/web/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';

// Tailwind 클래스 병합
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 날짜 포맷
export function formatDate(date: string | Date, pattern = 'yyyy-MM-dd') {
  return format(new Date(date), pattern, { locale: ko });
}

// 상대 시간
export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

// 마감일 라벨
export function getDueDateLabel(dueDate: string | Date): {
  label: string;
  color: string;
} {
  const date = new Date(dueDate);
  
  if (isPast(date) && !isToday(date)) {
    return { label: '마감 초과', color: 'text-red-600 bg-red-50' };
  }
  if (isToday(date)) {
    return { label: '오늘 마감', color: 'text-orange-600 bg-orange-50' };
  }
  if (isTomorrow(date)) {
    return { label: '내일 마감', color: 'text-yellow-600 bg-yellow-50' };
  }
  return { label: formatDate(date, 'M/d'), color: 'text-gray-600 bg-gray-50' };
}

// 상태 라벨
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: '진행중', color: 'bg-blue-100 text-blue-700' },
  waiting: { label: '대기중', color: 'bg-amber-100 text-amber-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  planning: { label: '계획중', color: 'bg-purple-100 text-purple-700' },
  on_hold: { label: '보류', color: 'bg-yellow-100 text-yellow-700' },
};

// 위험도 라벨
export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: '낮음', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: '높음', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '위험', color: 'bg-red-100 text-red-700' },
};

// 진행률 색상
export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}
