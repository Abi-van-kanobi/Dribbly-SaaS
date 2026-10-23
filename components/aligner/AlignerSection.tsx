import Link from "next/link";
import type { AlignerItem } from "@prisma/client";
import { CaretDown, CheckCircle, Tray, Warning } from "@phosphor-icons/react/dist/ssr";
import { requireWorkspace } from "@/lib/session";
import { isStorageConfigured } from "@/lib/storage";
import { SIGNAL, type SignalStyle } from "@/lib/signal";
import { buildBoard, type Level } from "@/lib/aligner-board";
import { deliverableStage, invoiceStatus } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import { AlignerDropZone, type UploadState } from "./AlignerDropZone";
import { AlignerItemRow, type AlignerItemView } from "./AlignerItemRow";

const LEVEL: Record<Level, SignalStyle> = {
  late: SIGNAL.late,
  attention: SIGNAL.attention,
  ok: { ...SIGNAL.ok, bg: "var(--aurora-bg-tint)", border: "var(--aurora-border)" },
};

function toView(i: AlignerItem): AlignerItemView {
  return {
    id: i.id,
    kind: i.kind,
    title: i.title,
    url: i.url,
    text: i.text,
    fileName: i.fileName,
    mimeType: i.mimeType,
    sizeBytes: i.sizeBytes,
    createdAt: i.createdAt.toISOString(),
    campaignId: i.campaignId,
  };
}

/**
 * The Work Aligner on the dashboard: drop work in, see the Inbox, and read the whole roster at a
 * glance. Each campaign row is collapsed to its status and what needs attention; opening it shows
 * the deliverables, payments and filed items behind that status.
 */
export async function AlignerSection() {
  const { db, workspace } = await requireWorkspace();

  const [campaigns, inbox, allCampaigns] = await Promise.all([
    db.campaign.findMany({
      where: { status: { in: ["LIVE", "IN_REVIEW", "WRAPPING"] } },
      include: {
        brand: true,
        creator: true,
        deliverables: { orderBy: { order: "asc" } },
        invoices: { orderBy: { dueDate: "asc" } },
        alignerItems: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.alignerItem.findMany({ where: { status: "INBOX" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const uploadState: UploadState = workspace.isDemo ? "demo" : isStorageConfigured() ? "ready" : "off";
  const rows = buildBoard(campaigns, new Date());
  const byId = new Map(campaigns.map((c) => [c.id, c]));
  const counts = { late: 0, attention: 0, ok: 0 } satisfies Record<Level, number>;
  for (const r of rows) counts[r.level]++;

  return (
    <section className="mkt-card p-6 mb-6" aria-labelledby="aligner-title">
      <div className="mb-5">
        <h2 id="aligner-title" className="text-[20px] m-0 flex items-center gap-2" style={{ fontWeight: 800 }}>
          <Tray size={20} style={{ color: "var(--aurora-accent)" }} />
          Work Aligner
        </h2>
        <p className="text-[14px] m-0 mt-1" style={{ color: "var(--aurora-text-muted)" }}>
          Drop work from anywhere. See what needs attention. Open any campaign to see why.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.45fr] gap-7">
        {/* LEFT: add work, and the Inbox of things not filed yet */}
        <div>
          <AlignerDropZone uploadState={uploadState} />
          <h3 className="text-[14px] mt-5 mb-2 flex items-center gap-2" style={{ fontWeight: 700 }}>
            Inbox
            {inbox.length > 0 && <span className="mkt-tag mkt-tag-accent">{inbox.length}</span>}
          </h3>
          <div className="flex flex-col gap-2">
            {inbox.map((item) => (
              <AlignerItemRow key={item.id} item={toView(item)} campaigns={allCampaigns} />
            ))}
            {inbox.length === 0 && (
              <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                Nothing waiting. Anything you drop lands here until you file it to a campaign.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: the bird's-eye view */}
        <div>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h3 className="text-[14px] m-0" style={{ fontWeight: 700 }}>
              Bird&apos;s-eye view
            </h3>
            {rows.length > 0 && (
              <div className="flex gap-1.5 flex-wrap text-[12px]" style={{ fontWeight: 600 }}>
                {(["late", "attention", "ok"] as Level[]).map((lvl) => (
                  <span key={lvl} className="px-2.5 py-1 rounded-full" style={{ background: LEVEL[lvl].bg, color: LEVEL[lvl].text, border: `1px solid ${LEVEL[lvl].border}` }}>
                    {counts[lvl]} {LEVEL[lvl].label.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {rows.map((row) => {
              const lv = LEVEL[row.level];
              const campaign = byId.get(row.id)!;
              const shown = row.signals.slice(0, 2);
              return (
                <details key={row.id} className="group rounded-[13px]" style={{ background: lv.bg, border: `1px solid ${lv.border}` }}>
                  <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-3 flex items-start gap-3">
                    <span className="w-[10px] h-[10px] rounded-full flex-none mt-[6px]" style={{ background: lv.dot }} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px]" style={{ fontWeight: 700 }}>
                          {row.name}
                        </span>
                        <span className="text-[11.5px] px-2 py-0.5 rounded-full" style={{ color: lv.text, background: "#fff", fontWeight: 600 }}>
                          {lv.label}
                        </span>
                      </div>
                      <div className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                        {row.brand} · {row.creator} · {row.deliverablesDone} of {row.deliverablesTotal} done
                        {row.filedCount > 0 ? ` · ${row.filedCount} filed` : ""}
                      </div>
                      {shown.length > 0 ? (
                        <ul className="list-none p-0 m-0 mt-1.5 flex flex-col gap-0.5">
                          {shown.map((s) => (
                            <li key={s.text} className="text-[13px] flex items-center gap-1.5" style={{ color: LEVEL[s.level].text }}>
                              <Warning size={13} weight="fill" className="flex-none" aria-hidden="true" />
                              {s.text}
                            </li>
                          ))}
                          {row.signals.length > shown.length && (
                            <li className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
                              +{row.signals.length - shown.length} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <div className="text-[13px] mt-1.5 flex items-center gap-1.5" style={{ color: lv.text }}>
                          <CheckCircle size={13} weight="fill" aria-hidden="true" />
                          {row.nextDue ? `Next: ${row.nextDue.title}, ${formatShortDate(row.nextDue.dueDate)}` : "Nothing outstanding"}
                        </div>
                      )}
                    </div>
                    <CaretDown size={16} className="flex-none mt-1 transition-transform group-open:rotate-180" style={{ color: "var(--aurora-text-muted)" }} aria-hidden="true" />
                  </summary>

                  <div className="px-4 pb-4 pt-1 flex flex-col gap-4" style={{ borderTop: `1px solid ${lv.border}`, background: "#fff", borderRadius: "0 0 13px 13px" }}>
                    {row.signals.length > 0 && (
                      <div className="pt-3">
                        <h4 className="text-[12.5px] uppercase m-0 mb-1.5" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
                          Needs attention
                        </h4>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                          {row.signals.map((s) => (
                            <li key={s.text} className="text-[13.5px] flex items-start gap-2">
                              <span className="w-[8px] h-[8px] rounded-full flex-none mt-[7px]" style={{ background: LEVEL[s.level].dot }} aria-hidden="true" />
                              {s.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={row.signals.length > 0 ? "" : "pt-3"}>
                      <h4 className="text-[12.5px] uppercase m-0 mb-1.5" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
                        Deliverables
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {campaign.deliverables.map((d) => (
                          <div key={d.id} className="flex items-center gap-2 text-[13.5px]">
                            <span className="flex-1 min-w-0 truncate">{d.title}</span>
                            <span className={`mkt-tag ${deliverableStage[d.stage].tag}`}>{deliverableStage[d.stage].label}</span>
                            <span className="text-[12.5px] w-[52px] text-right" style={{ color: "var(--aurora-text-muted)" }}>
                              {formatShortDate(d.dueDate)}
                            </span>
                          </div>
                        ))}
                        {campaign.deliverables.length === 0 && (
                          <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                            No deliverables yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {campaign.invoices.length > 0 && (
                      <div>
                        <h4 className="text-[12.5px] uppercase m-0 mb-1.5" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
                          Payments
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          {campaign.invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center gap-2 text-[13.5px]">
                              <span className="flex-1">Invoice #{inv.number}</span>
                              <span className={`mkt-tag ${invoiceStatus[inv.status].tag}`}>{invoiceStatus[inv.status].label}</span>
                              <span className="text-[12.5px] w-[52px] text-right" style={{ color: "var(--aurora-text-muted)" }}>
                                {formatShortDate(inv.dueDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-[12.5px] uppercase m-0 mb-1.5" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
                        Filed here ({campaign.alignerItems.length})
                      </h4>
                      <div className="flex flex-col gap-2">
                        {campaign.alignerItems.map((item) => (
                          <AlignerItemRow key={item.id} item={toView(item)} campaigns={allCampaigns} />
                        ))}
                        {campaign.alignerItems.length === 0 && (
                          <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                            Nothing filed yet. File something from the Inbox.
                          </p>
                        )}
                      </div>
                    </div>

                    <Link href={`/app/campaigns/${row.id}`} className="mkt-link text-[13.5px]" style={{ fontWeight: 600 }}>
                      Open campaign →
                    </Link>
                  </div>
                </details>
              );
            })}
            {rows.length === 0 && (
              <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                No active campaigns yet. Create one and it shows up here.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
