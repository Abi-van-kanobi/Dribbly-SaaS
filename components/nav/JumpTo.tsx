"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowElbowDownLeft, MagnifyingGlass } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { filterJump, type JumpItem } from "@/lib/jump";

/** "Jump to": type part of a campaign, creator or page name, press Enter. Opens with Ctrl+K or Cmd+K. */
export function JumpTo({ open, onClose, items }: { open: boolean; onClose: () => void; items: JumpItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => filterJump(items, query), [items, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function close() {
    setQuery("");
    setActive(0);
    onClose();
  }

  function go(item: JumpItem | undefined) {
    if (!item) return;
    router.push(item.href);
    close();
  }

  return (
    <Modal open={open} onClose={close} title="Jump to">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }}>
        <MagnifyingGlass size={16} style={{ color: "var(--aurora-text-muted)" }} />
        <label htmlFor="jump-input" className="sr-only">
          Search campaigns, creators and pages
        </label>
        <input
          id="jump-input"
          autoFocus
          autoComplete="off"
          value={query}
          placeholder="A campaign, a creator or a page"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive(Math.min(current + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive(Math.max(current - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[current]);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="jump-results"
          aria-activedescendant={results[current] ? `jump-${results[current].group}-${results[current].id}` : undefined}
          className="flex-1 bg-transparent border-0 outline-none text-[15px]"
          style={{ color: "var(--aurora-text)" }}
        />
      </div>

      <ul id="jump-results" role="listbox" aria-label="Results" className="list-none p-0 m-0 flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
        {results.map((item, i) => (
          <li
            key={`${item.group}-${item.id}`}
            id={`jump-${item.group}-${item.id}`}
            role="option"
            aria-selected={i === current}
            onMouseEnter={() => setActive(i)}
            onClick={() => go(item)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
            style={{ background: i === current ? "#ede9fe" : "transparent" }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[14px] truncate" style={{ fontWeight: 600 }}>
                {item.label}
              </div>
              {item.hint && (
                <div className="text-[12.5px] truncate" style={{ color: "var(--aurora-text-muted)" }}>
                  {item.hint}
                </div>
              )}
            </div>
            <span className="text-[11.5px]" style={{ color: "var(--aurora-text-muted)" }}>
              {item.group === "Pages" ? "Page" : item.group === "Campaigns" ? "Campaign" : "Creator"}
            </span>
            {i === current && <ArrowElbowDownLeft size={14} style={{ color: "var(--aurora-accent)" }} aria-hidden="true" />}
          </li>
        ))}
        {results.length === 0 && (
          <li className="px-3 py-3 text-[13.5px]" style={{ color: "var(--aurora-text-muted)" }}>
            Nothing matches &quot;{query}&quot;. Try part of a name.
          </li>
        )}
      </ul>
    </Modal>
  );
}
