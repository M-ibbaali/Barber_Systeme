/**
 * Global Date Utilities for Africa/Casablanca (Morocco) Timezone
 */

export const MOROCCO_TIMEZONE = "Africa/Casablanca";

/**
 * Returns a formal Date object representing the current time in Morocco.
 * This is useful for comparisons or getting the current "Marrakech day".
 */
export function getMoroccoNow(): Date {
  const now = new Date();
  const moroccoTimeStr = now.toLocaleString("en-US", { timeZone: MOROCCO_TIMEZONE });
  return new Date(moroccoTimeStr);
}

/**
 * Returns the current date in Morocco formatted as YYYY-MM-DD.
 */
export function getMoroccoToday(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: MOROCCO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA gives YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Formats a Date object or UTC string to Morocco time (HH:mm:ss).
 */
export function formatMoroccoTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-GB", {
    timeZone: MOROCCO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Formats a Date object or UTC string to a full readable string in Morocco timezone.
 */
export function formatMoroccoFull(date: Date | string, locale: string = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, {
    timeZone: MOROCCO_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a YYYY-MM-DD date string to a localized day name and date.
 */
export function formatMoroccoDay(dateStr: string, locale: string = "en-US"): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // We create a date at 12:00 in UTC to avoid any shifts
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  return d.toLocaleDateString(locale, {
    timeZone: "UTC", // Use UTC because we manually constructed it at UTC 12:00
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parses a "HH:mm:ss" string from the database (which might be in local or UTC)
 * and ensures it's treated correctly for display in Morocco.
 * 
 * Note: Our database stores `time` as naive TIME. 
 * If the DB saves 10:00:00, we should show 10:00:00.
 */
export function parseDatabaseTime(timeStr: string): string {
  if (!timeStr) return "";
  // If the time already has seconds, we just format it to HH:mm
  const [h, m] = timeStr.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}
