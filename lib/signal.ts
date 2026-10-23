/**
 * The one colour language. Red is late, amber needs attention, green is on track or done, grey is later.
 * The sidebar dots, the Work Aligner board and the calendar all read their colours from here, so the same
 * colour always means the same thing. Colour is never the only signal: every use also carries words or a shape.
 */
export type Signal = "late" | "attention" | "ok" | "neutral";

export interface SignalStyle {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

export const SIGNAL: Record<Signal, SignalStyle> = {
  late: { label: "Late", dot: "#dc2626", text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  attention: { label: "Needs attention", dot: "#ea580c", text: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  ok: { label: "On track", dot: "#16a34a", text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  neutral: { label: "Later", dot: "#9ca3af", text: "var(--aurora-text-muted)", bg: "var(--aurora-bg-tint)", border: "var(--aurora-border)" },
};
