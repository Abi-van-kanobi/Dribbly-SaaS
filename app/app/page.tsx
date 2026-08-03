import Link from "next/link";
import {
  Broadcast,
  SealCheck,
  CurrencyInr,
  CheckSquare,
  SunHorizon,
  MagicWand,
  Plus,
  Flag,
  CalendarDots,
  Wallet,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getManager } from "@/lib/session";
import { StatTile } from "@/components/StatTile";
import { TaskCheckbox } from "@/components/TaskCheckbox";
import { campaignStatus, deliverableStage, isDeliverableDone } from "@/lib/labels";
import { formatINR, formatShortDate, formatTime, formatWeekday, formatDueLabel } from "@/lib/format";
import { buildSparkline } from "@/lib/chart";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default async function DashboardPage() {
  const manager = await getManager();

  const [tasks, campaigns, approvalsWaiting, pendingInvoices, paidInvoices, upcomingDeliverables] =
    await Promise.all([
      prisma.task.findMany({ orderBy: { order: "asc" }, include: { campaign: true, creator: true } }),
      prisma.campaign.findMany({
        where: { status: { in: ["LIVE", "IN_REVIEW", "WRAPPING"] } },
        include: { brand: true, creator: true, deliverables: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.deliverable.count({ where: { stage: "IN_REVIEW" } }),
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        include: { brand: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.invoice.findMany({ where: { status: "PAID" }, select: { amount: true, dueDate: true } }),
      prisma.deliverable.findMany({
        where: { stage: { notIn: ["APPROVED", "LIVE"] } },
        orderBy: { dueDate: "asc" },
        take: 3,
        include: { campaign: { include: { brand: true, creator: true } } },
      }),
    ]);

  const doneCount = tasks.filter((t) => t.done).length;
  const paymentsDue = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const distinctCreators = new Set(campaigns.map((c) => c.creatorId)).size;

  const now = new Date();
  const buckets: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), total: 0 });
  }
  for (const inv of paidInvoices) {
    const bucket = buckets.find((b) => b.key === monthKey(new Date(inv.dueDate)));
    if (bucket) bucket.total += inv.amount;
  }
  const totalEarnings = buckets.reduce((sum, b) => sum + b.total, 0);
  const firstNonZero = buckets.find((b) => b.total > 0)?.total ?? 0;
  const lastTotal = buckets[buckets.length - 1].total;
  const growthPct = firstNonZero > 0 ? Math.round(((lastTotal - firstNonZero) / firstNonZero) * 100) : 0;
  const { areaPath, linePath, points } = buildSparkline(
    buckets.map((b) => b.total),
    340,
    150,
    20,
    0,
  );

  return (
    <div className="mkt">
      {/* HERO */}
      <section className="mkt-card p-8 mb-6" style={{ background: "var(--aurora-gradient-soft)", border: "1px solid var(--aurora-border)" }}>
        <div className="relative flex items-end justify-between gap-8 flex-wrap">
          <div>
            <div className="text-[12px] uppercase mb-2 font-semibold" style={{ letterSpacing: ".12em", color: "var(--aurora-accent)" }}>
              {now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="text-[36px] mb-2" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
              Good morning, {manager?.name.split(" ")[0] ?? "there"}
            </h1>
            <p className="m-0 text-[15px]" style={{ color: "var(--aurora-text-muted)" }}>
              You have <b style={{ color: "var(--aurora-text)" }}>{approvalsWaiting} approvals</b> waiting and{" "}
              <b style={{ color: "var(--aurora-text)" }}>{tasks.length} tasks</b> due today across{" "}
              {distinctCreators} creators.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="mkt-btn mkt-btn-ghost" style={{ background: "#fff" }}>
              <MagicWand size={16} />
              Ask Drribly
            </button>
            <Link href="/app/campaigns" className="mkt-btn mkt-btn-primary">
              <Plus size={16} />
              New campaign
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-7">
          <StatTile icon={<Broadcast size={15} />} label="Active campaigns" value={campaigns.length} />
          <StatTile icon={<SealCheck size={15} />} label="Approvals waiting" value={approvalsWaiting} />
          <StatTile icon={<CurrencyInr size={15} />} label="Payments due" value={formatINR(paymentsDue)} />
          <StatTile icon={<CheckSquare size={15} />} label="Tasks today" value={tasks.length} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          <section className="mkt-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] flex items-center gap-2" style={{ fontWeight: 700 }}>
                <SunHorizon size={17} style={{ color: "var(--aurora-accent)" }} />
                Today
              </h3>
              <span className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                {doneCount} of {tasks.length} done
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                  style={
                    task.done
                      ? { background: "#ede9fe" }
                      : { background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }
                  }
                >
                  <TaskCheckbox taskId={task.id} done={task.done} />
                  <div className="flex-1">
                    <div
                      className="text-[14.5px]"
                      style={task.done ? { color: "var(--aurora-text-muted)", textDecoration: "line-through" } : { color: "var(--aurora-text)" }}
                    >
                      {task.title}
                    </div>
                    {!task.done && task.dueAt && (
                      <div className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
                        due {formatTime(task.dueAt)}
                        {task.creator ? ` · ${task.creator.name.split(" ")[0]}` : ""}
                      </div>
                    )}
                  </div>
                  {task.done ? (
                    <span className="text-[11.5px]" style={{ color: "var(--aurora-accent)" }}>
                      done
                    </span>
                  ) : (
                    <span className="mkt-tag mkt-tag-accent">{task.tag ?? "Task"}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mkt-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] flex items-center gap-2" style={{ fontWeight: 700 }}>
                <Broadcast size={17} style={{ color: "var(--aurora-accent)" }} />
                Active campaigns
              </h3>
              <Link href="/app/campaigns" className="mkt-link text-[13px]">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {campaigns.map((c) => {
                const total = c.deliverables.length;
                const done = c.deliverables.filter((d) => isDeliverableDone(d.stage)).length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const next = c.deliverables.find((d) => !isDeliverableDone(d.stage));
                const status = campaignStatus[c.status];
                return (
                  <Link
                    key={c.id}
                    href={`/app/campaigns/${c.id}`}
                    className="block p-4 rounded-[13px] no-underline"
                    style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", color: "inherit" }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-[15px]">{c.name}</div>
                      <span className={`mkt-tag ${status.tag}`}>{status.label}</span>
                    </div>
                    <div className="text-[12.5px] my-1.5" style={{ color: "var(--aurora-text-muted)" }}>
                      {c.brand.name} · {c.creator.name} · {done} of {total}
                    </div>
                    <div className="mkt-progress mb-2.5">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--aurora-text-muted)" }}>
                      <Flag size={12} />
                      {next ? `${next.title} · ${formatShortDate(next.dueDate)}` : "All deliverables wrapped"}
                    </div>
                  </Link>
                );
              })}
              {campaigns.length === 0 && (
                <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
                  No active campaigns yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          <section className="mkt-card p-5" style={{ background: "var(--aurora-gradient-soft)" }}>
            <div className="relative flex items-start justify-between mb-1.5">
              <div>
                <div className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                  Earnings · last 6 months
                </div>
                <div className="text-[26px] font-bold mt-1" style={{ letterSpacing: "-.02em" }}>
                  {formatINR(totalEarnings)}
                </div>
              </div>
              {growthPct !== 0 && (
                <span
                  className="text-[12px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold"
                  style={{ background: "#fff", color: "var(--aurora-accent)" }}
                >
                  <TrendUp size={13} />
                  {growthPct > 0 ? "+" : ""}
                  {growthPct}%
                </span>
              )}
            </div>
            <svg viewBox="0 0 340 150" className="relative w-full h-[150px] mt-1.5" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#7c3aed" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="38" x2="340" y2="38" stroke="rgba(20,18,31,.06)" />
              <line x1="0" y1="76" x2="340" y2="76" stroke="rgba(20,18,31,.06)" />
              <line x1="0" y1="114" x2="340" y2="114" stroke="rgba(20,18,31,.06)" />
              <path d={areaPath} fill="url(#fill)" />
              <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.length > 0 && (
                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4.5" fill="#fff" stroke="#7c3aed" strokeWidth="2" />
              )}
            </svg>
            <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "var(--aurora-text-muted)" }}>
              {buckets.map((b) => (
                <span key={b.key}>{b.label}</span>
              ))}
            </div>
          </section>

          <section className="mkt-card p-5">
            <h3 className="text-[18px] mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
              <CalendarDots size={17} style={{ color: "var(--aurora-accent)" }} />
              Upcoming deadlines
            </h3>
            <div className="flex flex-col gap-3">
              {upcomingDeliverables.map((d) => {
                const stage = deliverableStage[d.stage];
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: stage.color }} />
                    <div className="flex-1">
                      <div className="text-[14px]">
                        {d.title} — {d.campaign.brand.name}
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
                        {d.campaign.creator.name.split(" ")[0]}
                      </div>
                    </div>
                    <span className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                      {formatWeekday(d.dueDate)}
                    </span>
                  </div>
                );
              })}
              {upcomingDeliverables.length === 0 && (
                <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
                  Nothing due soon.
                </p>
              )}
            </div>
          </section>

          <section className="mkt-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] flex items-center gap-2" style={{ fontWeight: 700 }}>
                <Wallet size={17} style={{ color: "var(--aurora-accent)" }} />
                Payments pending
              </h3>
              <span className="mkt-tag mkt-tag-outline">{formatINR(paymentsDue)}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {pendingInvoices.slice(0, 4).map((inv) => {
                const due = formatDueLabel(inv.dueDate);
                return (
                  <Link
                    key={inv.id}
                    href="/app/payments"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline"
                    style={
                      inv.status === "OVERDUE"
                        ? { background: "#fff7ed", border: "1px solid #fed7aa", color: "inherit" }
                        : { background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", color: "inherit" }
                    }
                  >
                    <div className="flex-1">
                      <div className="text-[14px]">
                        {inv.brand.name} · Inv #{inv.number}
                      </div>
                      <div className="text-[12px]" style={{ color: due.overdue ? "#c2410c" : "var(--aurora-text-muted)" }}>
                        {due.label}
                      </div>
                    </div>
                    <div className="font-semibold" style={{ color: due.overdue ? "#c2410c" : "var(--aurora-text)" }}>
                      {formatINR(inv.amount)}
                    </div>
                  </Link>
                );
              })}
              {pendingInvoices.length === 0 && (
                <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
                  All caught up — nothing pending.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
