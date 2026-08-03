import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { campaignStatus, deliverableStage, invoiceStatus, payRail, isDeliverableDone } from "@/lib/labels";
import { formatINR, formatShortDate } from "@/lib/format";
import { AddDeliverableDialog } from "@/components/AddDeliverableDialog";
import { AdvanceStageButton } from "@/components/AdvanceStageButton";
import { Flag } from "@phosphor-icons/react/dist/ssr";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "deliverables", label: "Deliverables" },
  { key: "payments", label: "Payments" },
  { key: "notes", label: "Notes" },
] as const;

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: true,
      creator: true,
      deliverables: { orderBy: { order: "asc" } },
      invoices: { orderBy: { dueDate: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!campaign) notFound();

  const total = campaign.deliverables.length;
  const done = campaign.deliverables.filter((d) => isDeliverableDone(d.stage)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = campaignStatus[campaign.status];

  const dates = campaign.deliverables.map((d) => d.dueDate.getTime());
  const start = Math.min(campaign.createdAt.getTime(), ...dates, campaign.deadline.getTime());
  const end = Math.max(campaign.deadline.getTime(), ...dates, campaign.createdAt.getTime());
  const span = Math.max(end - start, 86400000);
  const posPct = (d: Date) => Math.min(96, Math.max(0, ((d.getTime() - start) / span) * 100));

  return (
    <div className="mkt">
      <div className="text-[13px] mb-1" style={{ color: "var(--aurora-text-muted)" }}>
        <Link href="/app/campaigns" className="no-underline" style={{ color: "var(--aurora-text-muted)" }}>
          Campaigns
        </Link>{" "}
        / {campaign.brand.name} · {campaign.name}
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] m-0" style={{ fontWeight: 800 }}>
            {campaign.name}
          </h1>
          <span className={`mkt-tag ${status.tag}`}>{status.label}</span>
        </div>
        <AddDeliverableDialog campaignId={campaign.id} />
      </div>

      <div className="flex gap-5 text-sm mb-5 pb-3" style={{ borderBottom: "1px solid var(--aurora-border)", color: "var(--aurora-text-muted)" }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/app/campaigns/${campaign.id}?tab=${t.key}`}
              className="no-underline pb-3"
              style={{
                color: active ? "var(--aurora-text)" : "var(--aurora-text-muted)",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "2px solid var(--aurora-accent)" : "2px solid transparent",
                marginBottom: -13,
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mkt-card p-5 md:col-span-2">
            <h3 className="text-[16px] mb-3" style={{ fontWeight: 700 }}>
              Summary
            </h3>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt style={{ color: "var(--aurora-text-muted)" }}>Brand</dt>
              <dd className="m-0">{campaign.brand.name}</dd>
              <dt style={{ color: "var(--aurora-text-muted)" }}>Creator</dt>
              <dd className="m-0">{campaign.creator.name}</dd>
              <dt style={{ color: "var(--aurora-text-muted)" }}>Value</dt>
              <dd className="m-0">{formatINR(campaign.value)}</dd>
              <dt style={{ color: "var(--aurora-text-muted)" }}>Deadline</dt>
              <dd className="m-0">{formatShortDate(campaign.deadline)}</dd>
              <dt style={{ color: "var(--aurora-text-muted)" }}>Deliverables</dt>
              <dd className="m-0">
                {done} of {total} complete
              </dd>
            </dl>
            <div className="mkt-progress mt-4">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="mkt-card p-5">
            <h3 className="text-[16px] mb-3" style={{ fontWeight: 700 }}>
              Payment
            </h3>
            <div className="flex flex-col gap-2">
              {campaign.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span>
                    #{inv.number} · {formatINR(inv.amount)}
                  </span>
                  <span className={`mkt-tag ${invoiceStatus[inv.status].tag}`}>{invoiceStatus[inv.status].label}</span>
                </div>
              ))}
              {campaign.invoices.length === 0 && (
                <p className="text-sm m-0" style={{ color: "var(--aurora-text-muted)" }}>
                  No invoices yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="mkt-card p-6">
          <div className="flex flex-col gap-4">
            {campaign.deliverables.map((d) => {
              const stage = deliverableStage[d.stage];
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-[180px] flex-none text-[14px] truncate">{d.title}</div>
                  <div className="flex-1 relative h-[26px] rounded-md" style={{ background: "var(--aurora-bg-tint)" }}>
                    <div
                      className="absolute h-full rounded-md"
                      style={{ left: `${posPct(d.dueDate)}%`, width: "14%", background: stage.color, opacity: 0.9 }}
                    />
                    {d.isPaymentMilestone && (
                      <div className="absolute -top-1 text-[16px]" style={{ left: `calc(${posPct(d.dueDate)}% + 6%)`, color: "#ea580c" }}>
                        ◆
                      </div>
                    )}
                  </div>
                  <span className={`mkt-tag ${stage.tag} flex-none`} style={{ marginLeft: 4 }}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
            {campaign.deliverables.length === 0 && (
              <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
                No deliverables scheduled yet.
              </p>
            )}
          </div>
          <div className="flex gap-6 mt-6 pt-4 text-[13px] flex-wrap" style={{ borderTop: "1px solid var(--aurora-border)", color: "var(--aurora-text-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#16a34a" }} />
              Approved / Live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#ea580c" }} />
              In review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--aurora-accent)" }} />
              In progress
            </span>
            <span className="flex items-center gap-1.5">
              <span style={{ color: "#ea580c" }}>◆</span>
              Payment milestone
            </span>
          </div>
        </div>
      )}

      {tab === "deliverables" && (
        <div className="mkt-card p-0 overflow-hidden">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Stage</th>
                <th>Due</th>
                <th>Milestone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaign.deliverables.map((d) => {
                const stage = deliverableStage[d.stage];
                return (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td>
                      <span className={`mkt-tag ${stage.tag}`}>{stage.label}</span>
                    </td>
                    <td>{formatShortDate(d.dueDate)}</td>
                    <td>
                      {d.isPaymentMilestone && (
                        <span className="flex items-center gap-1 text-[12.5px]" style={{ color: "#ea580c" }}>
                          <Flag size={12} /> Payment
                        </span>
                      )}
                    </td>
                    <td>
                      <AdvanceStageButton deliverableId={d.id} isFinal={d.stage === "LIVE"} />
                    </td>
                  </tr>
                );
              })}
              {campaign.deliverables.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                    No deliverables yet — add the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "payments" && (
        <div className="mkt-card p-0 overflow-hidden">
          <table className="mkt-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Rail</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {campaign.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>#{inv.number}</td>
                  <td>{formatINR(inv.amount)}</td>
                  <td>{payRail[inv.rail]}</td>
                  <td>
                    <span className={`mkt-tag ${invoiceStatus[inv.status].tag}`}>{invoiceStatus[inv.status].label}</span>
                  </td>
                  <td>{formatShortDate(inv.dueDate)}</td>
                </tr>
              ))}
              {campaign.invoices.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                    No invoices linked to this campaign yet.{" "}
                    <Link href="/app/payments" className="mkt-link">
                      Add one from Payments →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "notes" && (
        <div className="flex flex-col gap-3">
          {campaign.notes.map((note) => (
            <div key={note.id} className="mkt-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="mkt-tag mkt-tag-outline">{note.kind === "BRIEF" ? "Brief" : "Internal"}</span>
                <h4 className="text-[14.5px] m-0" style={{ fontWeight: 600 }}>
                  {note.title}
                </h4>
              </div>
              <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                {note.body}
              </p>
            </div>
          ))}
          {campaign.notes.length === 0 && (
            <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
              No notes for this campaign yet.{" "}
              <Link href="/app/notes" className="mkt-link">
                Add one from Notes →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
