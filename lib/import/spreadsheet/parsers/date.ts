import { isValid, parse as parseWithFormat, parseISO } from "date-fns";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 31);
const AUTO_FORMATS = [
  "dd/MM/yyyy HH:mm:ss",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
] as const;

function parseExcelSerial(serial: number): Date {
  const wholeDays = Math.trunc(serial);
  const fractionalDay = serial - wholeDays;
  const adjustedDays = wholeDays > 59 ? wholeDays - 1 : wholeDays;
  const msFromFraction = Math.round(fractionalDay * MS_PER_DAY);

  return new Date(EXCEL_EPOCH_UTC + adjustedDays * MS_PER_DAY + msFromFraction);
}

function toIsoString(date: Date, raw: string | number): string {
  if (!isValid(date)) {
    throw new Error(`Invalid date: ${raw}`);
  }

  return date.toISOString();
}

export function parseDate(raw: string | number | Date, format?: string): string {
  if (raw instanceof Date) {
    return raw.toISOString();
  }

  if (typeof raw === "number") {
    return toIsoString(parseExcelSerial(raw), raw);
  }

  const value = raw.trim();

  if (!value) {
    throw new Error(`Invalid date: ${raw}`);
  }

  if (format && format !== "auto") {
    return toIsoString(parseWithFormat(value, format, new Date()), raw);
  }

  const isoDate = parseISO(value);

  if (isValid(isoDate)) {
    return isoDate.toISOString();
  }

  for (const candidateFormat of AUTO_FORMATS) {
    const parsed = parseWithFormat(value, candidateFormat, new Date());

    if (isValid(parsed)) {
      return parsed.toISOString();
    }
  }

  throw new Error(`Invalid date: ${raw}`);
}
