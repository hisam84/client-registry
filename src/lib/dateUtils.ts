/**
 * Utility functions for handling and formatting dates strictly in Asia/Dhaka timezone (UTC+6).
 */

export const DHAKA_TIMEZONE = "Asia/Dhaka";
export const DHAKA_OFFSET_HOURS = 6;
export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/**
 * Returns YYYY-MM-DD string in Asia/Dhaka timezone for any given date (default: now).
 */
export function getDhakaDateString(dateInput?: string | Date | number | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Returns a Date object set to 00:00:00.000 in Asia/Dhaka for the given date.
 */
export function getDhakaStartOfDay(dateInput?: string | Date | number | null): Date {
  const dateStr = getDhakaDateString(dateInput);
  return new Date(`${dateStr}T00:00:00.000+06:00`);
}

/**
 * Returns a Date object set to 23:59:59.999 in Asia/Dhaka for the given date.
 */
export function getDhakaEndOfDay(dateInput?: string | Date | number | null): Date {
  const dateStr = getDhakaDateString(dateInput);
  return new Date(`${dateStr}T23:59:59.999+06:00`);
}

/**
 * Calculates whole calendar days difference between target and base (default: today) in Asia/Dhaka timezone.
 * Returns negative if target is in the past, 0 if target is today, positive if target is in the future.
 */
export function getDhakaDayDiff(
  targetInput: string | Date | number,
  baseInput?: string | Date | number
): number {
  const targetStart = getDhakaStartOfDay(targetInput).getTime();
  const baseStart = getDhakaStartOfDay(baseInput).getTime();
  const diffMs = targetStart - baseStart;
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Formats date strictly in Asia/Dhaka timezone (e.g. "20 Sep 2026").
 */
export function formatDhakaDate(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-GB"
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DHAKA_TIMEZONE,
    ...options,
  };

  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Formats time strictly in Asia/Dhaka timezone (e.g. "04:30 PM").
 */
export function formatDhakaTime(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US"
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DHAKA_TIMEZONE,
    ...options,
  };

  return d.toLocaleTimeString(locale, defaultOptions);
}

/**
 * Formats full date and time strictly in Asia/Dhaka timezone (e.g. "Sep 20, 2026, 4:30 PM").
 */
export function formatDhakaDateTime(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US"
): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DHAKA_TIMEZONE,
    ...options,
  };

  return d.toLocaleString(locale, defaultOptions);
}

/**
 * Formats date into YYYY-MM and human label (e.g. "September 2026") strictly in Asia/Dhaka timezone.
 */
export function getDhakaMonthKeyAndLabel(dateInput: string | Date | number): {
  key: string;
  label: string;
} {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { key: "undated", label: "Undated Tasks" };

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value || "1970";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const key = `${year}-${month}`;

  const label = d.toLocaleDateString("en-US", {
    timeZone: DHAKA_TIMEZONE,
    month: "long",
    year: "numeric",
  });

  return { key, label };
}

/**
 * Formats date as YYYY-MM-DDTHH:mm in Asia/Dhaka timezone for <input type="datetime-local">.
 */
export function formatToDhakaDateTimeInput(dateInput?: string | Date | number | null): string {
  const d = dateInput ? new Date(dateInput) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (isNaN(d.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const partsMap: Record<string, string> = {};
  formatter.formatToParts(d).forEach((p) => {
    partsMap[p.type] = p.value;
  });

  const year = partsMap.year || "1970";
  const month = partsMap.month || "01";
  const day = partsMap.day || "01";
  const hour = partsMap.hour || "00";
  const minute = partsMap.minute || "00";

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parses a datetime string (such as from <input type="datetime-local">) as Asia/Dhaka time (+06:00).
 */
export function parseDhakaDateTimeInput(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();

  // If already contains offset or Z timezone indicator, parse directly
  if (
    trimmed.includes("Z") ||
    /[+-]\d{2}:?\d{2}$/.test(trimmed)
  ) {
    return new Date(trimmed);
  }

  // If YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}:00+06:00`);
  }

  // If YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}+06:00`);
  }

  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00+06:00`);
  }

  return new Date(trimmed);
}
