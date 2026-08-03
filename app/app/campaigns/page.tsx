import Link from "next/link";
import { Prisma, type CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { campaignStatus, invoiceStatus, isDeliverableDone } from "@/lib/labels";
import { formatINR, formatShortDate } from "@/lib/format";
import { NewCampaignDialog } from "@/components/NewCampaignDialog";
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "LIVE", label: "Live" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "WRAPPING", label: "Wrapping" },
  { key: "DRAFT", label: "Draft" },
  { key: "COMPLETED", label: "Completed" },
] as const;

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; selected?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "ALL";

  const where: Prisma.CampaignWhereInput = statusFilter === "ALL" ? {} : { status: statusFilter as CampaignStatus };

  const [campaigns, allForCounts, brands, creators] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: { brand: true, creator: true, deliverables: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({ select: { status: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
  ]);

  const counts: Record<string, number> = { ALL: allForCounts.length };
  for (const c of allForCounts) counts[c.status] = (counts[c.status] ?? 0) + 1;

  const selectedId = params.selected ?? campaigns[0]?.id;
  const selected = selectedId
    ? await prisma.campaign.findUnique({
        where: { id: selectedId },
        include: { brand: true, creator: true, deliverables: { orderBy: { order: "asc" } }, invoices: true },
      })
    : null;

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Campaigns
        </h1>
        <NewCampaignDialog brands={brands} creators={creators} />
      </div>

      <div className="flex items-center gap-2 mb-4.5 flex-wrap" style={{ marginBottom: 18 }}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <Link
              key={f.key}
              href={`/app/campaigns?status=${f.key}`}
              className="mkt-tag no-underline"
              style={
                active
                  ? { background: "var(--aurora-gradient-button)", color: "#fff", padding: "6px 13px", fontSize: 12.5 }
                  : { background: "var(--aurora-bg-tint)", color: "var(--aurora-text)", padding: "6px 13px", fontSize: 12.5 }
              }
            >
              {f.label} · {counts[f.key] ?? 0}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-5 items-start">
        <div className="mkt-card flex-1 min-w-0 p-0 overflow-hidden">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Brand</th>
                <th>Creator</th>
                <th>Status</th>
                <th>Value</th>
                <th>Deadline</th>
                <th style={{ width: 140 }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const total = c.deliverables.length;
                const done = c.deliverables.filter((d) => isDeliverableDone(d.stage)).length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const status = campaignStatus[c.status];
                const isSelected = c.id === selected?.id;
                return (
                  <tr key={c.id} style={isSelected ? { background: "#f5f3ff" } : undefined}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <Link
                        href={`/app/campaigns?status=${statusFilter}&selected=${c.id}`}
                        className="no-underline"
                        style={{ color: "inherit", display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 0.9fr 0.9fr 140px", alignItems: "center", padding: "12px" }}
                      >
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span>{c.brand.name}</span>
                        <span>{c.creator.name}</span>
                        <span>
                          <span className={`mkt-tag ${status.tag}`}>{status.label}</span>
                        </span>
                        <span>{formatINR(c.value)}</span>
                        <span>{formatShortDate(c.deadline)}</span>
                        <span>
                          <div className="mkt-progress">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                    No campaigns in this view yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className="mkt-card w-[320px] flex-none p-5 hidden lg:block">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[17px] m-0" style={{ fontWeight: 700 }}>
                {selected.name}
              </h3>
              <span className={`mkt-tag ${campaignStatus[selected.status].tag}`}>{campaignStatus[selected.status].label}</span>
            </div>
            <div className="text-[13px] mb-4" style={{ color: "var(--aurora-text-muted)" }}>
              {selected.brand.name} · {selected.creator.name} · {formatINR(selected.value)}
            </div>

            <h4 className="text-[12.5px] uppercase mb-2.5 font-semibold" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
              Deliverables
            </h4>
            <div className="flex flex-col gap-2 mb-4.5" style={{ marginBottom: 18 }}>
              {selected.deliverables.map((d) => {
                const done = isDeliverableDone(d.stage);
                return (
                  <div key={d.id} className="flex items-center gap-2">
                    {done ? <CheckCircle weight="fill" size={16} color="#16a34a" /> : <Circle size={16} color="#c9c3db" />}
                    <span className="text-[13.5px]" style={{ color: done ? "var(--aurora-text)" : "var(--aurora-text-muted)" }}>
                      {d.title}
                    </span>
                  </div>
                );
              })}
              {selected.deliverables.length === 0 && (
                <p className="text-[13px]" style={{ color: "var(--aurora-text-muted)" }}>
                  No deliverables yet.
                </p>
              )}
            </div>

            <h4 className="text-[12.5px] uppercase mb-2.5 font-semibold" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
              Payment
            </h4>
            <div className="flex flex-col gap-2 mb-4.5" style={{ marginBottom: 18 }}>
              {selected.invoices.length === 0 && (
                <p className="text-[13px]" style={{ color: "var(--aurora-text-muted)" }}>
                  No invoices linked yet.
                </p>
              )}
              {selected.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }}>
                  <span className="text-[13.5px]">
                    Inv #{inv.number} · {formatINR(inv.amount)}
                  </span>
                  <span className={`mkt-tag ${invoiceStatus[inv.status].tag}`}>{invoiceStatus[inv.status].label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Link href={`/app/campaigns/${selected.id}`} className="mkt-btn mkt-btn-primary flex-1 justify-center">
                Open
              </Link>
              <Link href="/app/notes" className="mkt-btn mkt-btn-ghost justify-center">
                Notes
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
