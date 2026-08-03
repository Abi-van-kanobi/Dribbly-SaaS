import Link from "next/link";

export function MarketingHeader() {
  return (
    <header
      className="mkt sticky top-0 z-30 px-6 py-4"
      style={{ background: "rgba(255,255,255,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--aurora-border)" }}
    >
      <div className="max-w-[1200px] w-full mx-auto flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 no-underline" style={{ fontWeight: 800, fontSize: 19, color: "var(--aurora-text)" }}>
          <span
            className="w-[26px] h-[26px] rounded-lg grid place-items-center text-white text-[13px] font-bold"
            style={{ background: "var(--aurora-gradient-primary)" }}
          >
            D
          </span>
          Drrible
        </Link>

        <nav className="hidden sm:flex gap-1">
          <Link href="/#product" className="mkt-underline-hover text-[14px] px-3 py-1.5">
            Product
          </Link>
          <Link href="/#services" className="mkt-underline-hover text-[14px] px-3 py-1.5">
            Services
          </Link>
          <Link href="/#stories" className="mkt-underline-hover text-[14px] px-3 py-1.5">
            Stories
          </Link>
          <Link href="/insights" className="mkt-underline-hover text-[14px] px-3 py-1.5">
            Insights
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <Link href="/login" className="mkt-link text-[14px]" style={{ fontWeight: 500 }}>
            Log in
          </Link>
          <Link href="/login" className="mkt-btn mkt-btn-primary" style={{ padding: "9px 18px", fontSize: 14 }}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
