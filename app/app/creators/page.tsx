import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { campaignStatus, creatorStatus, isDeliverableDone } from "@/lib/labels";
import { formatFollowers, formatINR, formatShortDate } from "@/lib/format";
import { NewCreatorDialog } from "@/components/NewCreatorDialog";
import { InstagramLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const params = await searchParams;

  const creators = await prisma.creator.findMany({
    orderBy: { name: "asc" },
    include: {
      campaigns: { include: { brand: true, deliverables: true } },
      invoices: { where: { status: { in: ["PENDING", "OVERDUE"] } } },
    },
  });

  const selectedId = params.selected ?? creators[0]?.id;
  const selected = creators.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4.5" style={{ marginBottom: 18 }}>
        <h1 className="text-[26px] flex items-baseline gap-2" style={{ fontWeight: 800 }}>
          Creators <span className="text-[16px] font-normal" style={{ color: "var(--aurora-text-muted)" }}>· {creators.length}</span>
        </h1>
        <NewCreatorDialog />
      </div>

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {creators.map((creator) => {
            const activeCampaigns = creator.campaigns.filter((c) => ["LIVE", "IN_REVIEW", "WRAPPING"].includes(c.status));
            const pending = creator.invoices.reduce((sum, inv) => sum + inv.amount, 0);
            const upcoming = activeCampaigns
              .flatMap((c) => c.deliverables.filter((d) => !isDeliverableDone(d.stage)))
              .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
            const status = creatorStatus[creator.status];
            const isSelected = creator.id === selected?.id;

            return (
              <Link
                key={creator.id}
                href={`/app/creators?selected=${creator.id}`}
                className="p-4 rounded-[13px] no-underline block"
                style={{
                  color: "inherit",
                  border: isSelected ? "1px solid var(--aurora-accent)" : "1px solid var(--aurora-border)",
                  background: isSelected ? "#f5f3ff" : "var(--aurora-bg-tint)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-[42px] h-[42px] rounded-full grid place-items-center text-[14px] font-bold text-white flex-none"
                    style={{ background: "var(--aurora-gradient-button)" }}
                  >
                    {creator.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">{creator.name}</div>
                    <div className="text-[12.5px] flex items-center gap-2 flex-wrap" style={{ color: "var(--aurora-text-muted)" }}>
                      {creator.handle}
                      {creator.instagram && (
                        <span className="flex items-center gap-1">
                          <InstagramLogo size={12} /> {formatFollowers(creator.instagram)}
                        </span>
                      )}
                      {creator.youtube && (
                        <span className="flex items-center gap-1">
                          <YoutubeLogo size={12} /> {formatFollowers(creator.youtube)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`mkt-tag ${status.tag}`}>{activeCampaigns.length > 0 ? `${activeCampaigns.length} live` : status.label}</span>
                </div>
                <div className="flex gap-4 mt-3 text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                  <span>{pending > 0 ? `${formatINR(pending)} pending` : "—"}</span>
                  <span>
                    {upcoming
                      ? `Next: ${upcoming.title} · ${formatShortDate(upcoming.dueDate)}`
                      : creator.status === "IDLE"
                        ? "No campaign in a while — follow up"
                        : "No upcoming deliverables"}
                  </span>
                </div>
              </Link>
            );
          })}
          {creators.length === 0 && (
            <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
              No creators yet — add your first one.
            </p>
          )}
        </div>

        {selected && (
          <aside className="mkt-card w-[320px] flex-none p-5 hidden lg:block">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-[46px] h-[46px] rounded-full grid place-items-center text-[16px] font-bold text-white flex-none"
                style={{ background: "var(--aurora-gradient-button)" }}
              >
                {selected.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-[16px]">{selected.name}</div>
                <div className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                  {selected.handle}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mb-4.5 flex-wrap" style={{ marginBottom: 18 }}>
              {selected.instagram && <span className="mkt-tag mkt-tag-neutral">IG {formatFollowers(selected.instagram)}</span>}
              {selected.youtube && <span className="mkt-tag mkt-tag-neutral">YT {formatFollowers(selected.youtube)}</span>}
              <span className="mkt-tag mkt-tag-neutral">{selected.category}</span>
            </div>

            <h4 className="text-[12.5px] uppercase mb-2.5 font-semibold" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
              Active campaigns
            </h4>
            <div className="flex flex-col gap-2 mb-4.5" style={{ marginBottom: 18 }}>
              {selected.campaigns
                .filter((c) => ["LIVE", "IN_REVIEW", "WRAPPING"].includes(c.status))
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/campaigns/${c.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl no-underline"
                    style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", color: "inherit" }}
                  >
                    <span className="text-[13.5px]">
                      {c.name} · {c.brand.name}
                    </span>
                    <span className={`mkt-tag ${campaignStatus[c.status].tag}`}>{campaignStatus[c.status].label}</span>
                  </Link>
                ))}
              {selected.campaigns.filter((c) => ["LIVE", "IN_REVIEW", "WRAPPING"].includes(c.status)).length === 0 && (
                <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                  No active campaigns right now.
                </p>
              )}
            </div>

            {selected.ratecardNote && (
              <>
                <h4 className="text-[12.5px] uppercase mb-2.5 font-semibold" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
                  Rate card
                </h4>
                <p className="text-[13px]" style={{ color: "var(--aurora-text)" }}>
                  {selected.ratecardNote}
                </p>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
