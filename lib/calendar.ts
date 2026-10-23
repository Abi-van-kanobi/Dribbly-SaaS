/**
 * What the calendar shows, and how it is coloured. No I/O here, so the rules can be tested on their own.
 *
 * Days are workspace-local "YYYY-MM-DD" strings (see today.ts), never the server's clock day.
 * Three kinds of date share the calendar: deliverable deadlines, campaign deadlines and invoice due dates.
 *
 * Colour rule (agreed with the client, 15 Oct 2026): red when late, amber when due within SOON_DAYS days,
 * green when done, grey otherwise. Campaign deadlines also carry a flag so colour is not the only signal.
 */
import type { DeliverableStage, InvoiceStatus, CampaignStatus } from "@prisma/client";
import { addDays, dayInZone, daysBetween } from "./today";
import type { Signal } from "./signal";

export const SOON_DAYS = 3;

export type CalKind = "deliverable" | "campaign" | "invoice";

export interface CalEvent {
  id: string;
  kind: CalKind;
  day: string;
  label: string;
  detail: string;
  href: string;
  signal: Signal;
}

export function signalFor(day: string, today: string, done: boolean): Signal {
  if (done) return "ok";
  const diff = daysBetween(today, day);
  if (diff < 0) return "late";
  if (diff <= SOON_DAYS) return "attention";
  return "neutral";
}

/** The 42 days (six Sunday-first weeks) of the grid for a month. `month` counts from 0. */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const start = addDays(first.toISOString().slice(0, 10), -first.getUTCDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Parse "YYYY-MM" from the URL, falling back to the month of `today`. */
export function parseMonth(value: string | undefined, today: string): { year: number; month: number; key: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  const ok = m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
  const [y, mo] = ok ? [Number(m![1]), Number(m![2])] : [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  return { year: y, month: mo - 1, key: `${y}-${String(mo).padStart(2, "0")}` };
}

export function shiftMonth(year: number, month: number, by: number): string {
  const d = new Date(Date.UTC(year, month + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface DeliverableRow {
  id: string;
  title: string;
  stage: DeliverableStage;
  dueDate: Date;
  campaignId: string;
  campaign: { name: string; brand: { name: string }; creator: { name: string } | null };
}
interface CampaignRow {
  id: string;
  name: string;
  status: CampaignStatus;
  deadline: Date;
  brand: { name: string };
  creator: { name: string } | null;
}
interface InvoiceRow {
  id: string;
  number: string;
  status: InvoiceStatus;
  dueDate: Date;
  brand: { name: string };
  creator: { name: string } | null;
}

const who = (c: { name: string } | null) => c?.name ?? "No creator yet";
const DONE_STAGES: DeliverableStage[] = ["APPROVED", "LIVE"];

export function buildCalendarEvents(
  input: { deliverables: DeliverableRow[]; campaigns: CampaignRow[]; invoices: InvoiceRow[] },
  today: string,
  timeZone: string,
): CalEvent[] {
  const out: CalEvent[] = [];

  for (const d of input.deliverables) {
    const day = dayInZone(d.dueDate, timeZone);
    out.push({
      id: `d-${d.id}`,
      kind: "deliverable",
      day,
      label: d.title,
      detail: `${d.title} · ${d.campaign.name} · ${d.campaign.brand.name} · ${who(d.campaign.creator)}`,
      href: `/app/campaigns/${d.campaignId}?tab=deliverables`,
      signal: signalFor(day, today, DONE_STAGES.includes(d.stage)),
    });
  }

  for (const c of input.campaigns) {
    const day = dayInZone(c.deadline, timeZone);
    out.push({
      id: `c-${c.id}`,
      kind: "campaign",
      day,
      label: c.name,
      detail: `Campaign deadline · ${c.name} · ${c.brand.name} · ${who(c.creator)}`,
      href: `/app/campaigns/${c.id}`,
      signal: signalFor(day, today, c.status === "COMPLETED"),
    });
  }

  for (const i of input.invoices) {
    const day = dayInZone(i.dueDate, timeZone);
    const paid = i.status === "PAID";
    const signal: Signal = paid ? "ok" : i.status === "OVERDUE" ? "late" : signalFor(day, today, false);
    out.push({
      id: `i-${i.id}`,
      kind: "invoice",
      day,
      label: `Inv #${i.number}`,
      detail: `Invoice #${i.number} due · ${i.brand.name} · ${who(i.creator)}`,
      href: "/app/payments",
      signal,
    });
  }

  const RANK: Record<Signal, number> = { late: 0, attention: 1, neutral: 2, ok: 3 };
  const KIND: Record<CalKind, number> = { campaign: 0, deliverable: 1, invoice: 2 };
  return out.sort((a, b) => a.day.localeCompare(b.day) || RANK[a.signal] - RANK[b.signal] || KIND[a.kind] - KIND[b.kind] || a.label.localeCompare(b.label));
}
