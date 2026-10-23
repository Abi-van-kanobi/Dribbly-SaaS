import Link from "next/link";

/**
 * The one way a creator appears next to a campaign, deliverable or payment: a round initial and the name,
 * linking to their profile. A campaign with no creator says so plainly instead of leaving a gap.
 * (There are no creator photos yet, so the initial stands in for one.)
 */
export function CreatorChip({ creator, className = "" }: { creator: { id: string; name: string } | null; className?: string }) {
  if (!creator) {
    return (
      <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`} style={{ color: "var(--aurora-text-muted)" }}>
        <span className="w-[22px] h-[22px] rounded-full flex-none grid place-items-center text-[11px]" style={{ border: "1px dashed var(--aurora-border)" }} aria-hidden="true">
          ?
        </span>
        <span className="truncate">No creator yet</span>
      </span>
    );
  }
  return (
    <Link
      href={`/app/creators?selected=${creator.id}`}
      title={creator.name}
      className={`inline-flex items-center gap-1.5 min-w-0 no-underline ${className}`}
      style={{ color: "inherit" }}
    >
      <span
        className="w-[22px] h-[22px] rounded-full flex-none grid place-items-center text-[11px] font-bold"
        style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", color: "var(--aurora-accent)" }}
        aria-hidden="true"
      >
        {creator.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="truncate">{creator.name}</span>
    </Link>
  );
}
