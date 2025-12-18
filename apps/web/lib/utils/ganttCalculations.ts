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
export function getTodayPosition(viewportStart: Date, dayWidth: number): number {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const msSinceStart = now.getTime() - viewportStart.getTime();
  const daysSinceStart = msSinceStart / msPerDay; // Keep decimals for accuracy
  return daysSinceStart * dayWidth;
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
