import type { DeliverableStage, InvoiceStatus } from "@prisma/client";

/**
 * Builds the bird's-eye board: one row per active campaign, with plain-language signals saying what
 * needs attention. Pure and deterministic: the same data and the same "now" always give the same
 * board, and nothing here reads a file or calls an AI. Every signal can be traced to a record.
 */

export type Level = "late" | "attention" | "ok";

export interface Signal {
  level: Exclude<Level, "ok">;
  text: string;
}

export interface BoardCampaign {
  id: string;
  name: string;
  status: string;
  deadline: Date;
  brand: { name: string };
  creator: { name: string } | null;
  deliverables: { id: string; title: string; stage: DeliverableStage; dueDate: Date }[];
  invoices: { id: string; number: string; status: InvoiceStatus; dueDate: Date }[];
  alignerItems: { id: string }[];
}

export interface BoardRow {
  id: string;
  name: string;
  brand: string;
  creator: string;
  level: Level;
  signals: Signal[];
  deliverablesDone: number;
  deliverablesTotal: number;
  nextDue: { title: string; dueDate: Date } | null;
  filedCount: number;
}

const DONE: DeliverableStage[] = ["APPROVED", "LIVE"];
const DUE_SOON_DAYS = 3;
const DEADLINE_SOON_DAYS = 7;

/** Whole calendar days from today to `date` (negative = in the past). */
export function daysFromToday(date: Date, now: Date) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86400000);
}

function when(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "1 day ago";
  return days < 0 ? `${-days} days ago` : `in ${days} days`;
}

const RANK: Record<Level, number> = { late: 0, attention: 1, ok: 2 };

export function buildBoard(campaigns: BoardCampaign[], now: Date): BoardRow[] {
  const rows = campaigns.map((c): BoardRow => {
    const signals: Signal[] = [];
    const open = c.deliverables.filter((d) => !DONE.includes(d.stage));

    for (const d of open) {
      const days = daysFromToday(d.dueDate, now);
      if (days < 0) {
        signals.push({ level: "late", text: `${d.title} was due ${when(days)}` });
      } else if (d.stage === "IN_REVIEW") {
        signals.push({ level: "attention", text: `${d.title} is waiting for approval` });
      } else if (days <= DUE_SOON_DAYS && (d.stage === "PLANNED" || d.stage === "IN_PROGRESS")) {
        const state = d.stage === "PLANNED" ? "not started" : "in progress";
        signals.push({ level: "attention", text: `${d.title} is due ${when(days)} and ${state}` });
      }
    }

    for (const inv of c.invoices) {
      if (inv.status === "PAID") continue;
      const days = daysFromToday(inv.dueDate, now);
      if (inv.status === "OVERDUE" || days < 0) {
        signals.push({ level: "late", text: `Invoice #${inv.number} is ${Math.max(-days, 1)} ${Math.max(-days, 1) === 1 ? "day" : "days"} late` });
      }
    }

    const deadlineDays = daysFromToday(c.deadline, now);
    if (open.length > 0 && deadlineDays >= 0 && deadlineDays <= DEADLINE_SOON_DAYS) {
      signals.push({ level: "attention", text: `Campaign ends ${when(deadlineDays)} with ${open.length} ${open.length === 1 ? "deliverable" : "deliverables"} left` });
    }

    signals.sort((a, b) => RANK[a.level] - RANK[b.level]);
    const level: Level = signals[0]?.level ?? "ok";
    const next = [...open].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

    return {
      id: c.id,
      name: c.name,
      brand: c.brand.name,
      creator: c.creator?.name ?? "No creator yet",
      level,
      signals,
      deliverablesDone: c.deliverables.length - open.length,
      deliverablesTotal: c.deliverables.length,
      nextDue: next ? { title: next.title, dueDate: next.dueDate } : null,
      filedCount: c.alignerItems.length,
    };
  });

  return rows.sort((a, b) => {
    if (RANK[a.level] !== RANK[b.level]) return RANK[a.level] - RANK[b.level];
    if (a.signals.length !== b.signals.length) return b.signals.length - a.signals.length;
    const ad = a.nextDue?.dueDate.getTime() ?? Infinity;
    const bd = b.nextDue?.dueDate.getTime() ?? Infinity;
    return ad - bd;
  });
}
