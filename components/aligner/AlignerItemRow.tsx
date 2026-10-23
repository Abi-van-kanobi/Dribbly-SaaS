"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, FilePdf, FileText, GoogleDriveLogo, Image as ImageIcon, LinkSimple, Note, NotionLogo, Trash } from "@phosphor-icons/react";
import { deleteItem, fileItem } from "@/lib/actions/aligner";

export interface AlignerItemView {
  id: string;
  kind: "FILE" | "IMAGE" | "NOTE" | "LINK" | "NOTION" | "GOOGLE_DOC" | "GOOGLE_SHEET";
  title: string;
  url: string | null;
  text: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  campaignId: string | null;
}

const KIND_LABEL: Record<AlignerItemView["kind"], string> = {
  FILE: "File",
  IMAGE: "Image",
  NOTE: "Note",
  LINK: "Link",
  NOTION: "Notion",
  GOOGLE_DOC: "Google Doc",
  GOOGLE_SHEET: "Google Sheet",
};

function KindIcon({ kind, mime }: { kind: AlignerItemView["kind"]; mime: string | null }) {
  const props = { size: 20 } as const;
  if (kind === "NOTION") return <NotionLogo {...props} />;
  if (kind === "GOOGLE_DOC" || kind === "GOOGLE_SHEET") return <GoogleDriveLogo {...props} />;
  if (kind === "LINK") return <LinkSimple {...props} />;
  if (kind === "NOTE") return <Note {...props} />;
  if (mime === "application/pdf") return <FilePdf {...props} />;
  if (kind === "IMAGE") return <ImageIcon {...props} />;
  return <FileText {...props} />;
}

// UTC so the server render and the browser render always agree (no hydration mismatch).
function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function AlignerItemRow({ item, campaigns }: { item: AlignerItemView; campaigns: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const hasFile = item.kind === "IMAGE" || item.kind === "FILE";
  const href = hasFile ? `/app/aligner/file/${item.id}` : item.url;
  const meta = [KIND_LABEL[item.kind], formatSize(item.sizeBytes), formatShortDate(item.createdAt)].filter(Boolean).join(" · ");

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div
      className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5 rounded-xl"
      style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)", opacity: pending ? 0.6 : 1 }}
    >
      <div
        className="w-10 h-10 rounded-lg grid place-items-center flex-none overflow-hidden"
        style={{ background: "#fff", border: "1px solid var(--aurora-border)", color: "var(--aurora-accent)" }}
      >
        {item.kind === "IMAGE" ? (
          // Served by our own authenticated route, so next/image optimisation does not apply.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/app/aligner/file/${item.id}`} alt="" className="w-full h-full object-cover" />
        ) : (
          <KindIcon kind={item.kind} mime={item.mimeType} />
        )}
      </div>

      <div className="flex-1 min-w-[150px]">
        <div className="text-[14px] truncate" style={{ fontWeight: 600 }} title={item.title}>
          {item.title}
        </div>
        <div className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
          {meta}
        </div>
        {item.kind === "NOTE" && item.text && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left text-[13px] mt-1 bg-transparent border-0 p-0 cursor-pointer"
            style={{ color: "var(--aurora-text)", whiteSpace: open ? "pre-wrap" : "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", display: "block" }}
            aria-expanded={open}
          >
            {item.text}
          </button>
        )}
        {error && (
          <div role="alert" className="text-[12px] mt-1" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-none flex-wrap justify-end">
        <label className="sr-only" htmlFor={`file-to-${item.id}`}>
          File &quot;{item.title}&quot; to a campaign
        </label>
        <select
          id={`file-to-${item.id}`}
          className="mkt-input"
          style={{ padding: "5px 8px", fontSize: 12.5, width: "auto", maxWidth: 160 }}
          value={item.campaignId ?? ""}
          disabled={pending}
          onChange={(e) => run(() => fileItem({ itemId: item.id, campaignId: e.target.value || null }))}
        >
          <option value="">{item.campaignId ? "Back to Inbox" : "File to..."}</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="mkt-btn-icon" aria-label={`Open ${item.title}`} title="Open">
            <ArrowSquareOut size={16} />
          </a>
        )}
        <button
          type="button"
          className="mkt-btn-icon"
          aria-label={`Delete ${item.title}`}
          title="Delete"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete "${item.title}"? ${hasFile ? "The file is removed permanently." : "This cannot be undone."}`)) {
              run(() => deleteItem({ itemId: item.id }));
            }
          }}
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}
