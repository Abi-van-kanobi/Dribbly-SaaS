import type { BoardRow, Level } from "@/lib/aligner-board";

/** Pure helpers for the side navigation: what "Jump to" finds, and which campaigns the rail lists. */

export interface JumpItem {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: "Pages" | "Campaigns" | "Creators";
}

/**
 * Matches what the person typed against names. Names that start with it come first, then names with a
 * word that starts with it, then names that contain it, then matches on the hint (brand, creator).
 * With nothing typed, the first few items are shown in the order given.
 */
export function filterJump(items: JumpItem[], query: string, limit = 8): JumpItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit);

  const scored: { item: JumpItem; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const label = item.label.toLowerCase();
    let score = -1;
    if (label.startsWith(q)) score = 0;
    else if (label.split(/[\s·\-–—]+/).some((w) => w.startsWith(q))) score = 1;
    else if (label.includes(q)) score = 2;
    else if (item.hint.toLowerCase().includes(q)) score = 3;
    if (score >= 0) scored.push({ item, score, index });
  });
  return scored
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, limit)
    .map((s) => s.item);
}

export interface RailCampaign {
  id: string;
  name: string;
  level: Level;
  /** The first reason a campaign needs attention, for the tooltip. */
  note: string | null;
}

/** The campaigns shown in the rail: the most urgent first (the board already sorts them), capped so the rail stays short. */
export function railCampaigns(rows: BoardRow[], max = 6): { shown: RailCampaign[]; hiddenCount: number } {
  const shown = rows.slice(0, max).map((r) => ({ id: r.id, name: r.name, level: r.level, note: r.signals[0]?.text ?? null }));
  return { shown, hiddenCount: Math.max(0, rows.length - max) };
}

export const LEVEL_LABEL: Record<Level, string> = { late: "Late", attention: "Needs attention", ok: "On track" };
