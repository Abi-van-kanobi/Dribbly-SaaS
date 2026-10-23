import Link from "next/link";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/solutions", label: "Solutions" },
      { href: "/pricing", label: "Pricing" },
      { href: "/login", label: "Start free" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources", label: "All resources" },
      { href: "/resources?type=BLOG", label: "Blog" },
      { href: "/resources?type=CASE_STUDY", label: "Case studies" },
      { href: "/resources?type=PRODUCT_INSIGHT", label: "Product insights" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="mkt relative z-10" style={{ borderTop: "1px solid var(--aurora-border)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-14 flex flex-col sm:flex-row gap-10 sm:gap-0 justify-between">
        <div className="max-w-[280px]">
          <div className="flex items-center gap-2 mb-3" style={{ fontWeight: 800, fontSize: 17 }}>
            <span
              className="w-[22px] h-[22px] rounded-md grid place-items-center text-white text-[11px] font-bold"
              style={{ background: "var(--aurora-gradient-primary)" }}
            >
              D
            </span>
            Ettuno
          </div>
          <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
            One workspace for creator work. Campaigns, creators and payments in one place.
          </p>
        </div>

        <div className="flex gap-16 flex-wrap">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] uppercase mb-3 font-semibold" style={{ letterSpacing: ".08em", color: "var(--aurora-text-muted)" }}>
                {col.title}
              </div>
              <div className="flex flex-col gap-2.5 text-[13.5px]">
                {col.links.map((l) => (
                  <Link key={l.href} href={l.href} className="mkt-underline-hover">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 pb-10 text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
        © {new Date().getFullYear()} Ettuno. Prototype build, not a live product.
      </div>
    </footer>
  );
}
