// apps/web/lib/utils/ganttCalculations.ts

// 로컬 자정으로 정규화 (타임존 문제 방지)
function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// 두 날짜 사이의 일수 (정규화 후 계산)
// 모든 날짜 계산의 기준이 되는 함수!
export function getDaysBetween(start: Date, end: Date): number {
  const startNorm = normalizeDate(start);
  const endNorm = normalizeDate(end);
  const diffTime = endNorm.getTime() - startNorm.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
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

// 오늘 위치 계산 - getDaysBetween과 동일한 방식 사용!
export function getTodayPosition(
  viewportStart: Date,
  today: Date,
  dayWidth: number
): number {
  const daysDiff = getDaysBetween(viewportStart, today);
  return daysDiff * dayWidth;
}

// 타임라인 월 헤더 생성
export function generateMonthHeaders(
  startDate: Date,
  endDate: Date
): Array<{ month: string; year: string; dayCount: number }> {
  const headers: Array<{ month: string; year: string; dayCount: number }> = [];
  const startNorm = normalizeDate(startDate);
  const endNorm = normalizeDate(endDate);

  let current = new Date(startNorm);

  while (current <= endNorm) {
    const year = current.getFullYear();
    const month = current.getMonth();

    // 이번 달의 마지막 날
    const monthEnd = new Date(year, month + 1, 0);
    const displayEnd = monthEnd > endNorm ? endNorm : monthEnd;

    // 이번 달에 표시할 일수
    const dayCount = getDaysBetween(current, displayEnd) + 1;

    headers.push({
      year: `${year}`,
      month: `${month + 1}월`,
      dayCount,
    });

    // 다음 달 1일로 이동
    current = new Date(year, month + 1, 1);
  }

  return headers;
}
