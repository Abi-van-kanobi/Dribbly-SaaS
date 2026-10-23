import Link from "next/link";

const NAV = [
  { href: "/solutions", label: "Solutions" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader() {
  return (
    <header
      className="mkt sticky top-0 z-30 px-6 py-3 sm:py-4"
      style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--aurora-border)" }}
    >
      <div className="max-w-[1200px] w-full mx-auto flex flex-wrap items-center gap-x-8 gap-y-2">
        <Link href="/" className="flex items-center gap-2 no-underline" style={{ fontWeight: 800, fontSize: 19, color: "var(--aurora-text)" }}>
          <span
            className="w-[26px] h-[26px] rounded-lg grid place-items-center text-white text-[13px] font-bold"
            style={{ background: "var(--aurora-gradient-primary)" }}
          >
            D
          </span>
          Ettuno
        </Link>

        <nav aria-label="Main" className="flex gap-1 order-last w-full justify-center sm:order-none sm:w-auto sm:justify-start">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="mkt-underline-hover text-[14px] px-3 py-1.5">
              {item.label}
            </Link>
          ))}
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
