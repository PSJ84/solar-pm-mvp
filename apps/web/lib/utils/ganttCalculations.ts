// apps/web/lib/utils/ganttCalculations.ts

const DAY_MS = 24 * 60 * 60 * 1000;

// 핵심! 로컬 날짜를 UTC 기준 "달력 날짜 번호"로 변환
// 타임존에 관계없이 안정적인 날짜 비교 가능
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

// 오늘 날짜 가져오기 (로컬 자정, date-fns 대체)
export function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 오늘 위치 계산 (픽셀)
export function getTodayPosition(
  viewportStart: Date,
  today: Date,
  dayWidth: number
): number {
  return getDaysBetween(viewportStart, today) * dayWidth;
}

// Task 바 위치 계산 (픽셀)
export function calculateBarPosition(
  taskStart: Date,
  viewportStart: Date,
  dayWidth: number
): number {
  return getDaysBetween(viewportStart, taskStart) * dayWidth;
}

// Task 바 너비 계산 (픽셀)
export function calculateBarWidth(
  taskStart: Date,
  taskEnd: Date,
  dayWidth: number
): number {
  const duration = getDaysBetween(taskStart, taskEnd);
  return Math.max(duration * dayWidth, 20);
}

// 월 헤더 생성
export function generateMonthHeaders(
  startDate: Date,
  endDate: Date
): Array<{ month: string; year: string; dayCount: number }> {
  const headers: Array<{ month: string; year: string; dayCount: number }> = [];
  
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (current <= endNorm) {
    const year = current.getFullYear();
    const month = current.getMonth();

    const monthEnd = new Date(year, month + 1, 0);
    const displayEnd = monthEnd > endNorm ? endNorm : monthEnd;
    const dayCount = getDaysBetween(current, displayEnd) + 1;

    headers.push({
      year: `${year}`,
      month: `${month + 1}월`,
      dayCount,
    });

    current = new Date(year, month + 1, 1);
  }

  return headers;
}
