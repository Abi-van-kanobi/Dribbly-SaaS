import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { CaretLeft, CaretRight, Coins, Flag, ListChecks } from "@phosphor-icons/react/dist/ssr";
import { addDays, dayInZone } from "@/lib/today";
import { SIGNAL, type Signal } from "@/lib/signal";
import { buildCalendarEvents, monthGrid, parseMonth, shiftMonth, SOON_DAYS, type CalKind } from "@/lib/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// On the calendar the green state means finished, not merely on track, so it gets its own word.
const WORD: Record<Signal, string> = { late: "Late", attention: `Due within ${SOON_DAYS} days`, ok: "Done", neutral: "Later" };
const KIND_WORD: Record<CalKind, string> = { deliverable: "Deliverable", campaign: "Campaign deadline", invoice: "Invoice due" };
const KIND_ICON: Record<CalKind, typeof Flag> = { deliverable: ListChecks, campaign: Flag, invoice: Coins };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { db, workspace } = await requireWorkspace();
  const today = dayInZone(new Date(), workspace.timezone);
  const { year, month, key: monthKey } = parseMonth(params.month, today);

  const days = monthGrid(year, month);
  // A day is the workspace's own day, so ask the database for a day either side and bucket by day afterwards.
  const from = new Date(`${addDays(days[0], -1)}T00:00:00Z`);
  const to = new Date(`${addDays(days[days.length - 1], 2)}T00:00:00Z`);

  const [deliverables, campaigns, invoices] = await Promise.all([
    db.deliverable.findMany({
      where: { dueDate: { gte: from, lte: to } },
      include: { campaign: { include: { brand: true, creator: true } } },
    }),
    db.campaign.findMany({ where: { deadline: { gte: from, lte: to } }, include: { brand: true, creator: true } }),
    db.invoice.findMany({ where: { dueDate: { gte: from, lte: to } }, include: { brand: true, creator: true } }),
  ]);

  const events = buildCalendarEvents({ deliverables, campaigns, invoices }, today, workspace.timezone);
  const byDay = new Map<string, typeof events>();
  for (const e of events) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);

  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <Link href={`/app/calendar?month=${shiftMonth(year, month, -1)}`} className="mkt-btn-icon" aria-label="Previous month">
            <CaretLeft size={15} />
          </Link>
          <span className="text-sm" style={{ minWidth: 150, textAlign: "center" }}>
            {monthLabel}
          </span>
          <Link href={`/app/calendar?month=${shiftMonth(year, month, 1)}`} className="mkt-btn-icon" aria-label="Next month">
            <CaretRight size={15} />
          </Link>
          {monthKey !== today.slice(0, 7) && (
            <Link href="/app/calendar" className="mkt-btn mkt-btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }}>
              Today
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3 text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }} aria-label="Legend">
        {(["late", "attention", "ok", "neutral"] as Signal[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="w-[10px] h-[10px] rounded-full" style={{ background: SIGNAL[s].dot }} aria-hidden="true" />
            {WORD[s]}
          </span>
        ))}
        <span aria-hidden="true" style={{ opacity: 0.4 }}>|</span>
        {(Object.keys(KIND_WORD) as CalKind[]).map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <span key={k} className="inline-flex items-center gap-1.5">
              <Icon size={14} weight={k === "campaign" ? "fill" : "regular"} aria-hidden="true" />
              {KIND_WORD[k]}
            </span>
          );
        })}
      </div>

      <div className="mkt-card p-4 overflow-x-auto relative">
        <div style={{ minWidth: 700 }}>
          <div className="grid grid-cols-7 text-[11px] uppercase mb-2 font-semibold" style={{ color: "var(--aurora-text-muted)" }}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const inMonth = day.startsWith(monthKey);
              const isToday = day === today;
              const dayEvents = byDay.get(day) ?? [];
              return (
                <div
                  key={day}
                  className="rounded-lg p-1.5 min-w-0"
                  style={{
                    minHeight: 96,
                    background: inMonth ? "var(--aurora-bg-tint)" : "transparent",
                    border: isToday ? "1.5px solid var(--aurora-accent)" : "1px solid var(--aurora-border)",
                  }}
                >
                  <div className="text-[11.5px] mb-1" style={{ color: inMonth ? "var(--aurora-text)" : "#c9c3db", fontWeight: isToday ? 700 : 400 }}>
                    {Number(day.slice(8))}
                    {isToday && <span className="sr-only"> (today)</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayEvents.map((e) => {
                      const s = SIGNAL[e.signal];
                      const Icon = KIND_ICON[e.kind];
                      const isCampaign = e.kind === "campaign";
                      return (
                        <Link
                          key={e.id}
                          href={e.href}
                          title={`${WORD[e.signal]} · ${e.detail}`}
                          className="flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded no-underline min-w-0"
                          style={{ background: s.bg, color: s.text, border: `${isCampaign ? 1.5 : 1}px solid ${isCampaign ? s.dot : s.border}`, fontWeight: isCampaign ? 700 : 500 }}
                        >
                          <Icon size={11} weight={isCampaign ? "fill" : "regular"} className="flex-none" aria-hidden="true" />
                          <span className="sr-only">{`${KIND_WORD[e.kind]}, ${WORD[e.signal]}: `}</span>
                          <span className="truncate">{e.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
