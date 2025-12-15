const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const toKstDate = (date: Date) => new Date(date.getTime() + KST_OFFSET_MS);

export const fromKstToUtc = (date: Date) => new Date(date.getTime() - KST_OFFSET_MS);

export const getKstNow = () => toKstDate(new Date());

export const getKstStartOfDay = (base: Date = new Date()) => {
  const kst = toKstDate(base);
  const start = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 0, 0, 0));
  return fromKstToUtc(start);
};

export const formatKst = (date: Date) => {
  const kst = toKstDate(date);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const hours = String(kst.getHours()).padStart(2, '0');
  const minutes = String(kst.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes} (KST)`;
};

export const formatKstIsoString = (date: Date) => toKstDate(date).toISOString();

export const parseDateInputToUtc = (value: string, fieldName: string) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Invalid ${fieldName} value`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map((v) => Number(v));
    const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - KST_OFFSET_MS;
    return new Date(utcMs);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName} value`);
  }

  return parsed;
};

export const getDDayDifferenceKst = (dueDate: Date, todayStartKst: Date) => {
  const dueKstStart = getKstStartOfDay(toKstDate(dueDate));
  const diffMs = dueKstStart.getTime() - todayStartKst.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};
