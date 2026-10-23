/**
 * Calendar-day helpers for the Important Today bar.
 *
 * A "day" is a plain string, "YYYY-MM-DD", in the WORKSPACE's time zone. It is never derived from the
 * server's clock zone, so a manager in Stockholm and a manager in Los Angeles each get their own midnight.
 * No I/O here.
 */

export const MAX_PINS = 5;

function safeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The workspace-local calendar day an instant falls on. */
export function dayInZone(date: Date, timeZone: string): string {
  // The "en-CA" locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: safeZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

const toUtc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** A day plus or minus whole days. */
export function addDays(ymd: string, n: number): string {
  return new Date(toUtc(ymd) + n * 86400000).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86400000);
}

export interface DueInfo {
  text: string;
  late: boolean;
  daysLate: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * How a due date reads on a card. Late items say how late, in words, so the meaning never depends on colour.
 * `withTime` adds the clock time for things that have one (tasks), in the workspace zone.
 */
export function dueInfo(due: Date | null, today: string, timeZone: string, withTime = false): DueInfo {
  if (!due) return { text: "No due date", late: false, daysLate: 0 };
  const zone = safeZone(timeZone);
  const dueDay = dayInZone(due, zone);
  const diff = daysBetween(today, dueDay);

  if (diff < 0) return { text: `${plural(-diff, "day")} late`, late: true, daysLate: -diff };

  const time = withTime ? new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(due) : "";
  if (diff === 0) return { text: time ? `Due today, ${time}` : "Due today", late: false, daysLate: 0 };
  if (diff === 1) return { text: time ? `Due tomorrow, ${time}` : "Due tomorrow", late: false, daysLate: 0 };
  const label = new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "short", day: "numeric" }).format(due);
  return { text: `Due ${label}`, late: false, daysLate: 0 };
}

/** The note on a pin that was not finished on the day it was for. */
export function carriedLabel(showOn: string, today: string): string | null {
  const behind = daysBetween(showOn, today);
  if (behind <= 0) return null;
  return behind === 1 ? "From yesterday" : `From ${behind} days ago`;
}
