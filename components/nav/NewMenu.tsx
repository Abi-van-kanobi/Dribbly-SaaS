"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flag, NotePencil, Plus, Receipt, UserPlus } from "@phosphor-icons/react";

export const NEW_OPTIONS = [
  { label: "New campaign", href: "/app/campaigns?new=campaign", Icon: Flag },
  { label: "Add creator", href: "/app/creators?new=creator", Icon: UserPlus },
  { label: "New invoice", href: "/app/payments?new=invoice", Icon: Receipt },
  { label: "New note", href: "/app/notes?new=note", Icon: NotePencil },
] as const;

/** The four things a person can create, as links. Used by the rail menu and the phone sheet. */
export function NewOptions({ onPick }: { onPick: () => void }) {
  return (
    <div className="flex flex-col gap-1" role="menu">
      {NEW_OPTIONS.map(({ label, href, Icon }) => (
        <Link
          key={href}
          href={href}
          role="menuitem"
          onClick={onPick}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg no-underline text-[14px]"
          style={{ color: "var(--aurora-text)", fontWeight: 500 }}
        >
          <Icon size={17} style={{ color: "var(--aurora-accent)" }} />
          {label}
        </Link>
      ))}
    </div>
  );
}

/** The "+ New" button at the top of the rail. One place to start anything. */
export function NewMenuButton({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="New"
        title="New"
        className="mkt-btn mkt-btn-primary w-full"
        style={{ padding: collapsed ? "10px 0" : "9px 14px", fontSize: 14 }}
      >
        <Plus size={16} weight="bold" />
        {!collapsed && "New"}
      </button>
      {open && (
        <div
          className="absolute z-50 rounded-xl p-1.5 w-[210px]"
          style={{
            background: "#fff",
            border: "1px solid var(--aurora-border)",
            boxShadow: "var(--aurora-shadow-lg)",
            top: collapsed ? 0 : "calc(100% + 6px)",
            left: collapsed ? "calc(100% + 8px)" : 0,
          }}
        >
          <NewOptions onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
