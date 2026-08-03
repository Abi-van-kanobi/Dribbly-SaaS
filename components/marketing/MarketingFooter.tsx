import Link from "next/link";

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
            Drrible
          </div>
          <p className="text-[13px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
            One workspace for talent managers to run campaigns, creators, and payments — instead of
            five disconnected tools.
          </p>
        </div>

        <div className="flex gap-16 flex-wrap">
          <div>
            <div className="text-[11px] uppercase mb-3 font-semibold" style={{ letterSpacing: ".08em", color: "var(--aurora-text-muted)" }}>
              Product
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <Link href="/#video" className="mkt-underline-hover">
                See how it works
              </Link>
              <Link href="/login" className="mkt-underline-hover">
                Start free
              </Link>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase mb-3 font-semibold" style={{ letterSpacing: ".08em", color: "var(--aurora-text-muted)" }}>
              Insights
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <Link href="/insights" className="mkt-underline-hover">
                All articles
              </Link>
              <Link href="/insights?type=CASE_STUDY" className="mkt-underline-hover">
                Case studies
              </Link>
              <Link href="/insights?type=GUIDE" className="mkt-underline-hover">
                Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 pb-10 text-[12px]" style={{ color: "#a8a3b8" }}>
        © {new Date().getFullYear()} Drrible. Prototype build — not a live product.
      </div>
    </footer>
  );
}
