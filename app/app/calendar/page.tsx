import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const monthValue = params.month ?? monthParam(now);
  const [yearStr, mStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(mStr) - 1;

  const monthStart = new Date(year, month, 1);

  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const gridEnd = days[days.length - 1];

  const [deliverables, invoices] = await Promise.all([
    prisma.deliverable.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd } },
      include: { campaign: { include: { brand: true } } },
    }),
    prisma.invoice.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd } },
      include: { brand: true },
    }),
  ]);

  function eventsFor(day: Date) {
    const key = day.toDateString();
    return {
      deliverables: deliverables.filter((d) => new Date(d.dueDate).toDateString() === key),
      invoices: invoices.filter((i) => new Date(i.dueDate).toDateString() === key),
    };
  }

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4.5" style={{ marginBottom: 18 }}>
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <Link href={`/app/calendar?month=${monthParam(prevMonth)}`} className="mkt-btn-icon" aria-label="Previous month">
            <CaretLeft size={15} />
          </Link>
          <span className="text-sm" style={{ minWidth: 150, textAlign: "center" }}>
            {monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Link href={`/app/calendar?month=${monthParam(nextMonth)}`} className="mkt-btn-icon" aria-label="Next month">
            <CaretRight size={15} />
          </Link>
        </div>
      </div>

      <div className="mkt-card p-4">
        <div className="grid grid-cols-7 text-[11px] uppercase mb-2 font-semibold" style={{ color: "var(--aurora-text-muted)" }}>
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const inMonth = day.getMonth() === month;
            const isToday = day.toDateString() === now.toDateString();
            const { deliverables: dls, invoices: invs } = eventsFor(day);
            return (
              <div
                key={day.toISOString()}
                className="rounded-lg p-1.5"
                style={{
                  minHeight: 86,
                  background: inMonth ? "var(--aurora-bg-tint)" : "transparent",
                  border: isToday ? "1px solid var(--aurora-accent)" : "1px solid var(--aurora-border)",
                }}
              >
                <div className="text-[11.5px] mb-1" style={{ color: inMonth ? "var(--aurora-text)" : "#c9c3db" }}>
                  {day.getDate()}
                </div>
                <div className="flex flex-col gap-1">
                  {dls.map((d) => (
                    <Link
                      key={d.id}
                      href={`/app/campaigns/${d.campaignId}`}
                      title={`${d.title} — ${d.campaign.brand.name}`}
                      className="block text-[10.5px] px-1.5 py-0.5 rounded no-underline truncate"
                      style={{ background: "#ede9fe", color: "#7c3aed" }}
                    >
                      {d.title}
                    </Link>
                  ))}
                  {invs.map((i) => (
                    <Link
                      key={i.id}
                      href="/app/payments"
                      title={`Inv #${i.number} — ${i.brand.name}`}
                      className="block text-[10.5px] px-1.5 py-0.5 rounded no-underline truncate"
                      style={{ background: "#ffedd5", color: "#c2410c" }}
                    >
                      Inv #{i.number}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
