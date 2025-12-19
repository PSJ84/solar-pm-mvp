// apps/web/lib/utils/ganttCalculations.ts

const DAY_MS = 24 * 60 * 60 * 1000;

// 로컬 날짜(년/월/일)를 UTC 기준 "하루 번호"로 변환
// 이렇게 하면 타임존에 관계없이 안정적인 날짜 비교 가능
export function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

// 두 날짜 사이의 일수 (정수, round 불필요)
export function getDaysBetween(start: Date, end: Date): number {
  return dayNumber(end) - dayNumber(start);
}

// 로컬 날짜에 일수 더하기 (타임존 안전)
export function addDaysLocal(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

// 날짜가 범위 안에 있는지 확인 (달력 날짜 기준)
export function isBetweenDays(target: Date, start: Date, end: Date): boolean {
  const t = dayNumber(target);
  return t >= dayNumber(start) && t <= dayNumber(end);
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

// 오늘 위치 계산 (픽셀)
export function getTodayPosition(
  viewportStart: Date,
  today: Date,
  dayWidth: number
): number {
  return getDaysBetween(viewportStart, today) * dayWidth;
}

// 월 헤더 생성
export function generateMonthHeaders(
  start: Date,
  end: Date
): Array<{ year: number; month: string; dayCount: number }> {
  const headers: Array<{ year: number; month: string; dayCount: number }> = [];

  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (current <= endNorm) {
    const year = current.getFullYear();
    const month = current.getMonth();

    // 이번 달의 마지막 날
    const monthEnd = new Date(year, month + 1, 0);
    const displayEnd = monthEnd > endNorm ? endNorm : monthEnd;

    // 이번 달에 표시할 일수
    const dayCount = getDaysBetween(current, displayEnd) + 1;

    headers.push({
      year,
      month: `${month + 1}월`,
      dayCount,
    });

    // 다음 달 1일로 이동
    current = new Date(year, month + 1, 1);
  }

  return headers;
}
