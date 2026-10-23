/**
 * Money in the workspace's own currency, short for big numbers ($4,500 then $12.5K).
 * Amounts are whole units of the currency until Phase 2 moves storage to minor units.
 */
export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  const compact = Math.abs(amount) >= 10000;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatFollowers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  return `${count}`;
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatWeekday(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDueLabel(date: Date | string): { label: string; overdue: boolean } {
  const d = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays < 0) return { label: `overdue ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: "due today", overdue: false };
  if (diffDays === 1) return { label: "due tomorrow", overdue: false };
  return { label: `due in ${diffDays}d`, overdue: false };
}
