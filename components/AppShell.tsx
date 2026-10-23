"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AddressBook,
  CalendarDots,
  Coins,
  DotsThree,
  Flag,
  GearSix,
  House,
  MagnifyingGlass,
  Notepad,
  Plus,
  SidebarSimple,
  SignOut,
  Sparkle,
  Users,
} from "@phosphor-icons/react";
import { logoutAction } from "@/app/login/actions";
import { Modal } from "@/components/Modal";
import { JumpTo } from "@/components/nav/JumpTo";
import { NewMenuButton, NewOptions } from "@/components/nav/NewMenu";
import { SIGNAL } from "@/lib/signal";
import { LEVEL_LABEL, type JumpItem, type RailCampaign } from "@/lib/jump";
import type { Level } from "@/lib/aligner-board";

const DOT: Record<Level, string> = { late: SIGNAL.late.dot, attention: SIGNAL.attention.dot, ok: SIGNAL.ok.dot };

type Icon = typeof House;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function RailLink({ href, label, Icon, active, collapsed, onClick }: { href: string; label: string; Icon: Icon; active: boolean; collapsed: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-lg no-underline text-[14px]"
      style={{
        padding: collapsed ? "9px 0" : "8px 10px",
        justifyContent: collapsed ? "center" : "flex-start",
        color: active ? "var(--aurora-accent)" : "var(--aurora-text)",
        background: active ? "#ede9fe" : "transparent",
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon size={18} weight={active ? "fill" : "regular"} style={{ flex: "none", color: active ? "var(--aurora-accent)" : "var(--aurora-text-muted)" }} />
      {!collapsed && label}
    </Link>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 mx-3" style={{ borderTop: "1px solid var(--aurora-border)" }} aria-hidden="true" />;
  return (
    <div className="px-2.5 pt-4 pb-1 text-[11.5px] uppercase" style={{ letterSpacing: ".07em", color: "var(--aurora-text-muted)", fontWeight: 600 }}>
      {children}
    </div>
  );
}

export function AppShell({
  userName,
  workspaceName,
  campaigns,
  hiddenCampaigns,
  jumpItems,
  children,
}: {
  userName: string;
  workspaceName: string;
  campaigns: RailCampaign[];
  hiddenCampaigns: number;
  jumpItems: JumpItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Kept in memory only (no cookie, no storage): it lasts for the visit and resets on a full reload.
  const [collapsed, setCollapsed] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setJumpOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const is = (href: string) => (href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`));
  const onCampaignsList = pathname === "/app/campaigns";

  return (
    <div className="mkt relative min-h-screen md:flex">
      {/* Desktop: the rail */}
      <aside
        aria-label="Main"
        className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ width: collapsed ? 68 : 256, background: "#fff", borderRight: "1px solid var(--aurora-border)", padding: collapsed ? "14px 10px" : "14px 12px", transition: "width .15s ease" }}
      >
        <div className="flex items-center gap-2 mb-3" style={{ justifyContent: collapsed ? "center" : "space-between" }}>
          {!collapsed && (
            <Link href="/app" className="flex items-center gap-2.5 no-underline min-w-0" style={{ color: "var(--aurora-text)" }}>
              <span className="w-[28px] h-[28px] rounded-lg grid place-items-center flex-none" style={{ background: "var(--aurora-gradient-primary)" }}>
                <Sparkle weight="fill" size={16} color="#fff" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] leading-tight" style={{ fontWeight: 800 }}>
                  Ettuno
                </span>
                <span className="block text-[11.5px] truncate" style={{ color: "var(--aurora-text-muted)" }}>
                  {workspaceName}
                </span>
              </span>
            </Link>
          )}
          <button
            type="button"
            className="mkt-btn-icon"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{ width: 32, height: 32 }}
          >
            <SidebarSimple size={17} />
          </button>
        </div>

        <NewMenuButton collapsed={collapsed} />

        <button
          type="button"
          onClick={() => setJumpOpen(true)}
          title="Jump to (Ctrl+K)"
          aria-label="Jump to"
          className="flex items-center gap-2 mt-2.5 rounded-[10px] text-[13px] cursor-pointer w-full"
          style={{
            padding: collapsed ? "9px 0" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "var(--aurora-bg-tint)",
            border: "1px solid var(--aurora-border)",
            color: "var(--aurora-text-muted)",
          }}
        >
          <MagnifyingGlass size={15} />
          {!collapsed && (
            <>
              Jump to
              <span className="ml-auto text-[11px] px-1.5 py-px rounded" style={{ background: "#fff", border: "1px solid var(--aurora-border)" }}>
                Ctrl K
              </span>
            </>
          )}
        </button>

        <nav aria-label="Workspace" className="flex flex-col gap-0.5 mt-3 flex-1">
          <RailLink href="/app" label="Home" Icon={House} active={is("/app")} collapsed={collapsed} />

          <SectionLabel collapsed={collapsed}>Campaigns</SectionLabel>
          {campaigns.map((c) => {
            const active = pathname === `/app/campaigns/${c.id}`;
            const tip = `${LEVEL_LABEL[c.level]}${c.note ? `: ${c.note}` : ""}`;
            return (
              <Link
                key={c.id}
                href={`/app/campaigns/${c.id}`}
                title={collapsed ? `${c.name}. ${tip}` : tip}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-2.5 rounded-lg no-underline text-[14px]"
                style={{
                  padding: collapsed ? "9px 0" : "7px 10px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: active ? "var(--aurora-accent)" : "var(--aurora-text)",
                  background: active ? "#ede9fe" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <span className="w-[10px] h-[10px] rounded-full flex-none" style={{ background: DOT[c.level] }} aria-hidden="true" />
                <span className="sr-only">{LEVEL_LABEL[c.level]}: </span>
                {collapsed ? <span className="sr-only">{c.name}</span> : <span className="truncate">{c.name}</span>}
              </Link>
            );
          })}
          {campaigns.length === 0 && !collapsed && (
            <div className="px-2.5 py-1 text-[13px]" style={{ color: "var(--aurora-text-muted)" }}>
              No active campaigns yet.
            </div>
          )}
          {!collapsed && (
            <Link
              href="/app/campaigns"
              aria-current={onCampaignsList ? "page" : undefined}
              className="px-2.5 py-1.5 text-[13px] no-underline rounded-lg"
              style={{ color: "var(--aurora-accent)", fontWeight: 600, background: onCampaignsList ? "#ede9fe" : "transparent" }}
            >
              {hiddenCampaigns > 0 ? `See all campaigns (+${hiddenCampaigns})` : "All campaigns"}
            </Link>
          )}
          {collapsed && <RailLink href="/app/campaigns" label="All campaigns" Icon={Flag} active={onCampaignsList} collapsed />}

          <SectionLabel collapsed={collapsed}>People and money</SectionLabel>
          <RailLink href="/app/creators" label="Creators" Icon={Users} active={is("/app/creators")} collapsed={collapsed} />
          <RailLink href="/app/payments" label="Payments" Icon={Coins} active={is("/app/payments")} collapsed={collapsed} />

          <SectionLabel collapsed={collapsed}>More</SectionLabel>
          <RailLink href="/app/calendar" label="Calendar" Icon={CalendarDots} active={is("/app/calendar")} collapsed={collapsed} />
          <RailLink href="/app/notes" label="Notes" Icon={Notepad} active={is("/app/notes")} collapsed={collapsed} />
          <RailLink href="/app/contacts" label="Contacts" Icon={AddressBook} active={is("/app/contacts")} collapsed={collapsed} />
        </nav>

        <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--aurora-border)", flexDirection: collapsed ? "column" : "row" }}>
          <div
            className="w-[34px] h-[34px] rounded-[10px] grid place-items-center text-[12px] font-semibold text-white flex-none"
            style={{ background: "var(--aurora-gradient-button)" }}
            title={userName}
            aria-hidden="true"
          >
            {initials(userName)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-[13px] truncate" style={{ fontWeight: 600 }} title={userName}>
              {userName}
            </div>
          )}
          <Link href="/app/settings" className="mkt-btn-icon" aria-label="Settings and privacy" title="Settings and privacy" aria-current={is("/app/settings") ? "page" : undefined} style={{ width: 32, height: 32 }}>
            <GearSix size={16} />
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="mkt-btn-icon" aria-label="Sign out" title="Sign out" style={{ width: 32, height: 32 }}>
              <SignOut size={16} />
            </button>
          </form>
        </div>
      </aside>

      {/* Phone: slim top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5" style={{ background: "rgba(255,255,255,.94)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--aurora-border)" }}>
        <Link href="/app" className="flex items-center gap-2 no-underline min-w-0" style={{ color: "var(--aurora-text)" }}>
          <span className="w-[26px] h-[26px] rounded-lg grid place-items-center flex-none" style={{ background: "var(--aurora-gradient-primary)" }}>
            <Sparkle weight="fill" size={15} color="#fff" />
          </span>
          <span className="text-[16px] truncate" style={{ fontWeight: 800 }}>
            {workspaceName}
          </span>
        </Link>
        <button type="button" className="mkt-btn-icon ml-auto" aria-label="Jump to" onClick={() => setJumpOpen(true)}>
          <MagnifyingGlass size={17} />
        </button>
      </header>

      <main className="relative z-10 flex-1 min-w-0 max-w-[1420px] w-full mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 md:pb-16">{children}</main>

      {/* Phone: bottom bar */}
      <nav
        aria-label="Main"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 items-center"
        style={{ background: "rgba(255,255,255,.97)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--aurora-border)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {(
          [
            { href: "/app", label: "Home", Icon: House, active: is("/app") },
            { href: "/app/campaigns", label: "Campaigns", Icon: Flag, active: is("/app/campaigns") },
          ] as const
        ).map(({ href, label, Icon, active }) => (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-2 no-underline text-[11px]" style={{ color: active ? "var(--aurora-accent)" : "var(--aurora-text-muted)", fontWeight: active ? 700 : 500 }}>
            <Icon size={22} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        ))}
        <button type="button" onClick={() => setNewOpen(true)} aria-label="New" className="mx-auto w-[46px] h-[46px] rounded-full grid place-items-center cursor-pointer border-0" style={{ background: "var(--aurora-gradient-button)", color: "#fff", marginTop: -14, boxShadow: "0 6px 16px rgba(219,39,119,.3)" }}>
          <Plus size={22} weight="bold" />
        </button>
        <Link href="/app/payments" aria-current={is("/app/payments") ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-2 no-underline text-[11px]" style={{ color: is("/app/payments") ? "var(--aurora-accent)" : "var(--aurora-text-muted)", fontWeight: is("/app/payments") ? 700 : 500 }}>
          <Coins size={22} weight={is("/app/payments") ? "fill" : "regular"} />
          Payments
        </Link>
        <button type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] bg-transparent border-0 cursor-pointer" style={{ color: "var(--aurora-text-muted)", fontWeight: 500 }}>
          <DotsThree size={22} weight="bold" />
          More
        </button>
      </nav>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Create">
        <NewOptions onPick={() => setNewOpen(false)} />
      </Modal>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1">
          {(
            [
              { href: "/app/creators", label: "Creators", Icon: Users },
              { href: "/app/calendar", label: "Calendar", Icon: CalendarDots },
              { href: "/app/notes", label: "Notes", Icon: Notepad },
              { href: "/app/contacts", label: "Contacts", Icon: AddressBook },
              { href: "/app/settings", label: "Settings and privacy", Icon: GearSix },
            ] as const
          ).map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg no-underline text-[14px]" style={{ color: "var(--aurora-text)", fontWeight: 500 }}>
              <Icon size={18} style={{ color: "var(--aurora-accent)" }} />
              {label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] w-full text-left bg-transparent border-0 cursor-pointer" style={{ color: "var(--aurora-text)", fontWeight: 500 }}>
              <SignOut size={18} style={{ color: "var(--aurora-accent)" }} />
              Sign out
            </button>
          </form>
        </div>
      </Modal>

      <JumpTo open={jumpOpen} onClose={() => setJumpOpen(false)} items={jumpItems} />
    </div>
  );
}
