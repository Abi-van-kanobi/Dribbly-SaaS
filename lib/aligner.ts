import type { AlignerKind } from "@prisma/client";

/** Pure helpers for the Work Aligner: what we accept, and how we label it. No I/O here. */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_TITLE = 200;
export const MAX_NOTE = 5000;
export const MAX_URL = 2000;

/** Total uploaded bytes one workspace may hold. A plan limit to be set with pricing; override with ALIGNER_WORKSPACE_LIMIT_MB. */
export function workspaceLimitBytes() {
  const mb = Number(process.env.ALIGNER_WORKSPACE_LIMIT_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 1024) * 1024 * 1024;
}

/** File types the browser may declare for a direct upload. The real type is still decided from the bytes afterwards. */
export const UPLOAD_CONTENT_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"] as const;

export interface SniffedFile {
  mime: string;
  kind: "IMAGE" | "FILE";
}

/**
 * Decide what a file really is from its first bytes, not from the name or the type the browser
 * claims. Anything not on this list is refused, so an uploaded .html or .svg can never be served
 * back as a page.
 */
export function sniffFile(b: Buffer): SniffedFile | null {
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", kind: "IMAGE" };
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", kind: "IMAGE" };
  if (b.length >= 6 && (b.subarray(0, 6).toString("ascii") === "GIF87a" || b.subarray(0, 6).toString("ascii") === "GIF89a")) {
    return { mime: "image/gif", kind: "IMAGE" };
  }
  if (b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") {
    return { mime: "image/webp", kind: "IMAGE" };
  }
  if (b.length >= 5 && b.subarray(0, 5).toString("ascii") === "%PDF-") return { mime: "application/pdf", kind: "FILE" };
  return null;
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** A safe display name: no path parts, no control characters, and an extension that matches the real type. */
export function safeFileName(original: string, mime: string) {
  const base = original.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>|?*:]/g, "").trim();
  const stem = cleaned.replace(/\.[A-Za-z0-9]{1,6}$/, "").slice(0, 120) || "file";
  return `${stem}.${EXT[mime] ?? "bin"}`;
}

export function titleFromFile(fileName: string, createdAt: Date) {
  const stem = fileName.replace(/\.[A-Za-z0-9]{1,6}$/, "");
  // Pasted screenshots arrive with generic names such as "image" or "Screenshot".
  if (/^(image|screenshot|screen shot|untitled|file)$/i.test(stem)) {
    return `Screenshot ${createdAt.toISOString().slice(0, 10)}`;
  }
  return stem.slice(0, MAX_TITLE);
}

export interface ClassifiedLink {
  url: string;
  kind: Extract<AlignerKind, "LINK" | "NOTION" | "GOOGLE_DOC" | "GOOGLE_SHEET">;
  title: string;
}

/** Notion pages end in a long id; "My-Brief-1a2b3c..." becomes "My Brief". */
function notionTitle(pathname: string) {
  const last = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
  const words = last.replace(/-?[0-9a-f]{32}$/i, "").replace(/-/g, " ").trim();
  return words || "Notion page";
}

/**
 * Accept only http(s) links and label them. We never fetch the URL (that would let a user make our
 * server call any address), so the title comes from the link itself or from what the user typed.
 */
export function classifyLink(raw: string, userTitle?: string): ClassifiedLink | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!u.hostname.includes(".")) return null;

  const host = u.hostname.toLowerCase();
  let kind: ClassifiedLink["kind"] = "LINK";
  let title = host.replace(/^www\./, "");

  if (host === "notion.so" || host.endsWith(".notion.so") || host.endsWith(".notion.site")) {
    kind = "NOTION";
    title = notionTitle(u.pathname);
  } else if (host === "docs.google.com" && u.pathname.startsWith("/document/")) {
    kind = "GOOGLE_DOC";
    title = "Google Doc";
  } else if (host === "docs.google.com" && u.pathname.startsWith("/spreadsheets/")) {
    kind = "GOOGLE_SHEET";
    title = "Google Sheet";
  }

  const typed = userTitle?.trim();
  return { url: u.toString(), kind, title: (typed || title).slice(0, MAX_TITLE) };
}

export function titleFromNote(text: string) {
  const first = text.trim().split(/\r?\n/)[0] ?? "";
  return (first.length > 80 ? `${first.slice(0, 77)}...` : first) || "Note";
}

export const KIND_LABEL: Record<AlignerKind, string> = {
  FILE: "File",
  IMAGE: "Image",
  NOTE: "Note",
  LINK: "Link",
  NOTION: "Notion",
  GOOGLE_DOC: "Google Doc",
  GOOGLE_SHEET: "Google Sheet",
};
