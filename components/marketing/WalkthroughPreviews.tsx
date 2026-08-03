import { Play } from "@phosphor-icons/react/dist/ssr";

/**
 * Illustrative static stand-ins for the real product-recorded video/GIF
 * walkthroughs called for in each row — flagged in the build notes. The
 * play badge signals "this is a video slot," not a real recording.
 */
function ClipFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="absolute -inset-4 rounded-[28px] -z-10"
        style={{ background: "var(--aurora-gradient-soft)", filter: "blur(6px)" }}
      />
      <div className="mkt-card p-5">{children}</div>
      <span
        className="absolute -top-3 -right-3 w-9 h-9 rounded-full grid place-items-center"
        style={{ background: "var(--aurora-gradient-primary)", boxShadow: "0 8px 20px rgba(124,58,237,.35)" }}
      >
        <Play weight="fill" size={13} color="#fff" style={{ marginLeft: 1 }} />
      </span>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <ClipFrame>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: "Active", value: "12" },
          { label: "Approvals", value: "3" },
          { label: "Due", value: "₹4.2L" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: "var(--aurora-bg-tint)" }}>
            <div className="text-[10.5px]" style={{ color: "var(--aurora-text-muted)" }}>
              {s.label}
            </div>
            <div className="text-[18px] font-bold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ border: "1px solid var(--aurora-border)" }}>
          <span className="w-3.5 h-3.5 rounded-[4px] flex-none" style={{ border: "1.5px solid #cfc9e0" }} />
          <span className="text-[12.5px]">Approve Reel draft — Aanya × Nykaa</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "var(--aurora-bg-tint)" }}>
          <span className="w-3.5 h-3.5 rounded-[4px] flex-none grid place-items-center" style={{ background: "var(--aurora-accent)" }} />
          <span className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)", textDecoration: "line-through" }}>
            Confirm shoot slot — Mamaearth
          </span>
        </div>
      </div>
    </ClipFrame>
  );
}

export function CreatorProfilePreview() {
  return (
    <ClipFrame>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full grid place-items-center text-[14px] font-bold text-white flex-none"
          style={{ background: "var(--aurora-gradient-button)" }}
        >
          AS
        </div>
        <div>
          <div className="font-bold text-[15px]">Aanya Sharma</div>
          <div className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
            @aanya · IG 480k · YT 120k
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {["Beauty", "2 live", "₹1.8L pending"].map((t) => (
          <span key={t} className="mkt-tag" style={{ background: "var(--aurora-bg-tint)", color: "var(--aurora-text)" }}>
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ border: "1px solid var(--aurora-border)" }}>
        <span className="text-[12.5px]">Summer Glow · Nykaa</span>
        <span className="mkt-tag" style={{ background: "#ede9fe", color: "#7c3aed" }}>
          Live
        </span>
      </div>
    </ClipFrame>
  );
}

export function CampaignTimelinePreview() {
  const rows = [
    { label: "Concept & script", left: 2, width: 20, color: "#16a34a" },
    { label: "Reel #1", left: 22, width: 26, color: "#16a34a" },
    { label: "Story set", left: 50, width: 18, color: "#f97316" },
    { label: "Reel #2", left: 70, width: 22, color: "#7c3aed" },
  ];
  return (
    <ClipFrame>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-[92px] flex-none text-[11.5px] truncate">{r.label}</div>
            <div className="flex-1 relative h-4 rounded" style={{ background: "var(--aurora-bg-tint)" }}>
              <div className="absolute h-full rounded" style={{ left: `${r.left}%`, width: `${r.width}%`, background: r.color, opacity: 0.85 }} />
            </div>
          </div>
        ))}
      </div>
    </ClipFrame>
  );
}

export function PaymentTrackingPreview() {
  const rows = [
    { label: "Nykaa · Inv #204", meta: "overdue 3d", amount: "₹1.8L", bg: "#fff7ed", color: "#c2410c" },
    { label: "Boat · Inv #211", meta: "due in 5d", amount: "₹95k", bg: "#f8f7fc", color: "var(--aurora-text-muted)" },
    { label: "Mamaearth · Inv #198", meta: "paid", amount: "₹2.2L", bg: "#ecfdf5", color: "#15803d" },
  ];
  return (
    <ClipFrame>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: r.bg }}>
            <div className="flex-1">
              <div className="text-[12.5px]">{r.label}</div>
              <div className="text-[11px]" style={{ color: r.color }}>
                {r.meta}
              </div>
            </div>
            <div className="font-bold text-[12.5px]">{r.amount}</div>
          </div>
        ))}
      </div>
    </ClipFrame>
  );
}

export function NotesInContextPreview() {
  return (
    <ClipFrame>
      <div className="mb-3">
        <span className="mkt-tag" style={{ background: "#fce7f3", color: "#c026d3" }}>
          Brief
        </span>
      </div>
      <div className="font-bold text-[14px] mb-1.5">Nykaa — Summer Glow brand brief</div>
      <p className="text-[12.5px] m-0 mb-3" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
        Warm-toned summer look, no pastel backgrounds. Product must appear in first 3 seconds…
      </p>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit" style={{ background: "var(--aurora-bg-tint)" }}>
        <span className="text-[11.5px]" style={{ color: "var(--aurora-text-muted)" }}>
          Linked to
        </span>
        <span className="text-[11.5px] font-medium">Summer Glow · Nykaa</span>
      </div>
    </ClipFrame>
  );
}
