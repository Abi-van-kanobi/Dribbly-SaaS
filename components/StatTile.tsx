export function StatTile({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }}>
      <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
        <span style={{ color: "var(--aurora-accent)" }}>{icon}</span>
        {label}
      </div>
      <div className="text-[28px] font-bold mt-2" style={{ letterSpacing: "-.02em", color: valueColor ?? "var(--aurora-text)" }}>
        {value}
      </div>
    </div>
  );
}
