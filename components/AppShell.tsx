"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkle, MagnifyingGlass, Bell, SignOut } from "@phosphor-icons/react";
import { logoutAction } from "@/app/login/actions";

const NAV = [
  { href: "/app", label: "Home" },
  { href: "/app/campaigns", label: "Campaigns" },
  { href: "/app/creators", label: "Creators" },
  { href: "/app/payments", label: "Payments" },
  { href: "/app/calendar", label: "Calendar" },
  { href: "/app/notes", label: "Notes" },
  { href: "/app/contacts", label: "Contacts" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppShell({
  managerName,
  children,
}: {
  managerName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mkt relative min-h-screen">
      <header
        className="sticky top-0 z-30 flex items-center gap-6 px-6 py-3"
        style={{ background: "rgba(255,255,255,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--aurora-border)" }}
      >
        <Link href="/app" className="flex items-center gap-2.5 mr-2 no-underline" style={{ fontWeight: 800, fontSize: 19, color: "var(--aurora-text)" }}>
          <span className="w-[26px] h-[26px] rounded-lg grid place-items-center" style={{ background: "var(--aurora-gradient-primary)" }}>
            <Sparkle weight="fill" size={15} color="#fff" />
          </span>
          Drribly
        </Link>

        <nav className="flex gap-1 text-sm">
          {NAV.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline px-3 py-1.5 rounded-lg"
                style={{
                  color: active ? "var(--aurora-accent)" : "var(--aurora-text-muted)",
                  background: active ? "#ede9fe" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 w-[200px] rounded-[10px] text-[13px]"
            style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", color: "var(--aurora-text-muted)" }}
          >
            <MagnifyingGlass size={14} />
            Search
            <span className="ml-auto text-[11px] px-1.5 py-px rounded" style={{ background: "#fff", border: "1px solid var(--aurora-border)" }}>
              ⌘K
            </span>
          </div>
          <button className="mkt-btn-icon relative" aria-label="Notifications">
            <Bell size={16} />
            <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] rounded-full" style={{ background: "var(--aurora-accent)" }} />
          </button>
          <div
            className="w-[38px] h-[38px] rounded-[11px] grid place-items-center text-[13px] font-semibold text-white"
            style={{ background: "var(--aurora-gradient-button)" }}
            title={managerName}
          >
            {initials(managerName)}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="mkt-btn-icon" aria-label="Sign out" title="Sign out">
              <SignOut size={16} />
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 max-w-[1420px] mx-auto px-6 py-8 pb-16">{children}</main>
    </div>
  );
}
