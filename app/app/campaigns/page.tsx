import Link from "next/link";
import { Prisma, type CampaignStatus } from "@prisma/client";
import { requireWorkspace } from "@/lib/session";
import { campaignStatus, invoiceStatus, isDeliverableDone } from "@/lib/labels";
import { formatMoney, formatShortDate } from "@/lib/format";
import { NewCampaignDialog } from "@/components/NewCampaignDialog";
import { CreatorChip } from "@/components/CreatorChip";
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
  const { db, workspace } = await requireWorkspace();
  const money = (n: number) => formatMoney(n, workspace.currency);
  const statusFilter = params.status ?? "ALL";

  const where: Prisma.CampaignWhereInput = statusFilter === "ALL" ? {} : { status: statusFilter as CampaignStatus };

  const [campaigns, allForCounts, brands, creators] = await Promise.all([
    db.campaign.findMany({
      where,
      include: { brand: true, creator: true, deliverables: true },
      orderBy: { createdAt: "desc" },
    }),
    db.campaign.findMany({ select: { status: true } }),
    db.brand.findMany({ orderBy: { name: "asc" } }),
    db.creator.findMany({ orderBy: { name: "asc" } }),
  ]);

  const counts: Record<string, number> = { ALL: allForCounts.length };
  for (const c of allForCounts) counts[c.status] = (counts[c.status] ?? 0) + 1;

  const selectedId = params.selected ?? campaigns[0]?.id;
  const selected = selectedId
    ? await db.campaign.findUnique({
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
        <NewCampaignDialog brands={brands} creators={creators} currency={workspace.currency} selfCreatorId={creators.find((c) => c.isSelf)?.id ?? null} />
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
        <div className="mkt-card flex-1 min-w-0 p-0 overflow-x-auto">
          <div
            className="data-grid"
            role="table"
            aria-label="Campaigns"
            style={
              {
                "--cols-wide": "minmax(150px, 2fr) minmax(100px, 1.2fr) minmax(130px, 1.4fr) 104px 84px 76px 110px",
                "--cols-compact": "minmax(100px, 1.3fr) minmax(112px, 1.2fr) minmax(132px, 1.6fr) 92px 70px 64px",
              } as React.CSSProperties
            }
          >
            <div className="data-grid-head" role="row">
              <span role="columnheader">Campaign</span>
              <span role="columnheader">Brand</span>
              <span role="columnheader">Creator</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="num">
                Value
              </span>
              <span role="columnheader">Deadline</span>
              <span role="columnheader" className="opt">
                Progress
              </span>
            </div>
            {campaigns.map((c) => {
              const total = c.deliverables.length;
              const done = c.deliverables.filter((d) => isDeliverableDone(d.stage)).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const status = campaignStatus[c.status];
              const isSelected = c.id === selected?.id;
              return (
                <div key={c.id} className="data-grid-row" role="row" style={isSelected ? { background: "#f5f3ff" } : undefined}>
                  <span role="cell" className="cell">
                    {/* Wide screens have a preview panel, so a click selects. Narrower screens have none, so a click opens. */}
                    <Link href={`/app/campaigns?status=${statusFilter}&selected=${c.id}`} className="row-link hidden min-[1500px]:inline" title={c.name}>
                      {c.name}
                    </Link>
                    <Link href={`/app/campaigns/${c.id}`} className="row-link min-[1500px]:hidden" title={c.name}>
                      {c.name}
                    </Link>
                  </span>
                  <span role="cell" className="cell" title={c.brand.name}>
                    {c.brand.name}
                  </span>
                  <span role="cell" className="cell">
                    <CreatorChip creator={c.creator} className="above max-w-full" />
                  </span>
                  <span role="cell">
                    <span className={`mkt-tag ${status.tag}`}>{status.label}</span>
                  </span>
                  <span role="cell" className="cell num">
                    {money(c.value)}
                  </span>
                  <span role="cell" className="cell">
                    {formatShortDate(c.deadline)}
                  </span>
                  <span role="cell" className="opt" aria-label={`${pct}% of deliverables done`}>
                    <div className="mkt-progress">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </span>
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div role="row" style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                <span role="cell">No campaigns in this view yet.</span>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="mkt-card w-[320px] flex-none p-5 hidden min-[1500px]:block">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[17px] m-0" style={{ fontWeight: 700 }}>
                {selected.name}
              </h3>
              <span className={`mkt-tag ${campaignStatus[selected.status].tag}`}>{campaignStatus[selected.status].label}</span>
            </div>
            <div className="text-[13px] mb-4" style={{ color: "var(--aurora-text-muted)" }}>
              {selected.brand.name} · {selected.creator?.name ?? "No creator yet"} · {money(selected.value)}
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
                    Inv #{inv.number} · {money(inv.amount)}
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
