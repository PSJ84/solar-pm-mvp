// apps/web/lib/utils/ganttCalculations.ts

// 두 날짜 사이의 일수
export function getDaysBetween(start: Date, end: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

// Task 바 위치 계산 (픽셀)
export function calculateBarPosition(
  taskStart: Date,
  viewportStart: Date,
  dayWidth: number
): number {
  const daysFromStart = getDaysBetween(viewportStart, taskStart);
  return daysFromStart * dayWidth;
}

// Task 바 너비 계산 (픽셀)
export function calculateBarWidth(
  taskStart: Date,
  taskEnd: Date,
  dayWidth: number
): number {
  const duration = getDaysBetween(taskStart, taskEnd);
  return Math.max(duration * dayWidth, 20); // 최소 20px
}

// 오늘 날짜의 정확한 위치 계산 (픽셀)
// 타임존 문제를 피하기 위해 수동으로 로컬 자정 설정 및 일수 계산
export function getTodayPosition(
  viewportStart: Date,
  today: Date,
  dayWidth: number
): number {
  // 로컬 타임존 자정으로 정규화 (타임존 변환 없이)
  const normalizeToMidnight = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const viewStart = normalizeToMidnight(viewportStart);
  const todayNormalized = normalizeToMidnight(today);

  // 밀리초 차이를 일수로 변환 (타임존 안전)
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffMs = todayNormalized.getTime() - viewStart.getTime();
  const daysDiff = Math.round(diffMs / MS_PER_DAY);

  // 로컬 날짜 포맷 함수
  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  console.log('[getTodayPosition]', {
    viewportStart: formatLocalDate(viewStart),
    today: formatLocalDate(todayNormalized),
    diffMs,
    daysDiff,
    position: `${daysDiff * dayWidth}px`
  });

  return daysDiff * dayWidth;
}

// 타임라인 월 헤더 생성
export function generateMonthHeaders(
  startDate: Date,
  endDate: Date
): Array<{ month: string; year: string; dayCount: number }> {
  const months = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthEnd = lastDay > endDate ? endDate : lastDay;

    months.push({
      month: `${current.getMonth() + 1}월`,
      year: `${current.getFullYear()}`,
      dayCount: getDaysBetween(current, monthEnd) + 1,
    });

    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return months;
}
