"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, UploadSimple } from "@phosphor-icons/react";
import { addLink, addNote } from "@/lib/actions/aligner";
import { MAX_FILE_BYTES } from "@/lib/aligner";

export type UploadState = "ready" | "demo" | "off";

const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf";

/** One word with a dot and no spaces reads as a link; anything else is a note. The server decides what the link is. */
function looksLikeLink(v: string) {
  return /^(https?:\/\/)?[^\s/]+\.[^\s/]{2,}(\/\S*)?$/i.test(v.trim());
}

interface SendOutcome {
  saved: number;
  errors: string[];
  redirectTo?: string;
}

/**
 * Sends files to the server. If the server offers signed URLs (Cloudflare R2), each file goes
 * straight from this browser to the bucket and the server then checks and accepts it. Otherwise
 * (local development) the files are posted to the server itself.
 */
async function sendFiles(files: File[], campaignId: string | null, progress: (text: string) => void): Promise<SendOutcome> {
  const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES);
  const sendable = files.filter((f) => f.size <= MAX_FILE_BYTES);
  const errors = tooBig.map((f) => `${f.name} is over 10 MB.`);
  if (sendable.length === 0) return { saved: 0, errors };

  const jsonHeaders = { "Content-Type": "application/json" };
  const init = await fetch("/app/aligner/upload/init", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ files: sendable.map((f) => ({ name: f.name, size: f.size, type: f.type })), campaignId }),
  });
  if (init.redirected) return { saved: 0, errors, redirectTo: init.url };
  const plan = (await init.json().catch(() => null)) as {
    mode?: "direct" | "server";
    uploads?: { key: string; name: string; url: string; headers: Record<string, string> }[];
    error?: string;
  } | null;

  if (plan?.mode === "direct" && plan.uploads) {
    const done: { key: string; name: string }[] = [];
    for (const [i, u] of plan.uploads.entries()) {
      progress(`Uploading ${i + 1} of ${plan.uploads.length}...`);
      try {
        const put = await fetch(u.url, { method: "PUT", headers: u.headers, body: sendable[i] });
        if (put.ok) done.push({ key: u.key, name: u.name });
        else errors.push(`${u.name}: the upload was rejected (${put.status}).`);
      } catch {
        errors.push(`${u.name}: could not reach file storage. If this keeps happening, the storage bucket's CORS settings need checking.`);
      }
    }
    if (done.length === 0) return { saved: 0, errors };
    const complete = await fetch("/app/aligner/upload/complete", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ uploads: done, campaignId }) });
    const result = (await complete.json().catch(() => null)) as { saved?: unknown[]; errors?: { name: string; error: string }[]; error?: string } | null;
    for (const e of result?.errors ?? []) errors.push(`${e.name}: ${e.error}`);
    if (result?.error) errors.push(result.error);
    return { saved: result?.saved?.length ?? 0, errors };
  }

  if (plan?.mode === "server") {
    const body = new FormData();
    for (const f of sendable) body.append("files", f, f.name);
    if (campaignId) body.append("campaignId", campaignId);
    const res = await fetch("/app/aligner/upload", { method: "POST", body });
    if (res.redirected) return { saved: 0, errors, redirectTo: res.url };
    const json = (await res.json().catch(() => null)) as { saved?: unknown[]; errors?: { name: string; error: string }[]; error?: string } | null;
    for (const e of json?.errors ?? []) errors.push(`${e.name}: ${e.error}`);
    if (json?.error) errors.push(json.error);
    return { saved: json?.saved?.length ?? 0, errors };
  }

  if (plan?.error) errors.push(plan.error);
  return { saved: 0, errors };
}

export function AlignerDropZone({
  uploadState,
  campaignId = null,
  compact = false,
}: {
  uploadState: UploadState;
  campaignId?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (uploadState !== "ready") {
        setMessage({
          tone: "error",
          text:
            uploadState === "demo"
              ? "Uploads are switched off in the shared demo. Links and notes still work."
              : "File uploads are not set up yet. Links and notes still work.",
        });
        return;
      }
      setBusy(true);
      setMessage(null);
      try {
        const outcome = await sendFiles(files, campaignId, (text) => setMessage({ tone: "ok", text }));
        if (outcome.redirectTo) {
          window.location.href = outcome.redirectTo;
          return;
        }
        if (outcome.saved > 0) {
          const extra = outcome.errors.length ? ` ${outcome.errors.length} skipped: ${outcome.errors[0]}` : "";
          setMessage({ tone: outcome.errors.length ? "error" : "ok", text: `Added ${outcome.saved} ${outcome.saved === 1 ? "item" : "items"}.${extra}` });
          router.refresh();
        } else {
          setMessage({ tone: "error", text: outcome.errors[0] ?? "That upload did not work." });
        }
      } catch {
        setMessage({ tone: "error", text: "Could not reach the server. Check your connection and try again." });
      } finally {
        setBusy(false);
      }
    },
    [campaignId, router, uploadState],
  );

  const addText = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      startTransition(async () => {
        const result = looksLikeLink(value) ? await addLink({ url: value, campaignId }) : await addNote({ text: value, campaignId });
        if (result.ok) {
          // Clear only if the box still holds what was sent, so anything typed meanwhile is kept.
          setText((current) => (current.trim() === value ? "" : current));
          setMessage({ tone: "ok", text: looksLikeLink(value) ? "Link added." : "Note added." });
          router.refresh();
        } else {
          setMessage({ tone: "error", text: result.error });
        }
      });
    },
    [campaignId, router],
  );

  // Pasting a screenshot (Ctrl or Cmd + V) anywhere outside a text box adds it.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        void uploadFiles(files);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [uploadFiles]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) return void uploadFiles(files);
    // Dragging a browser tab or link in carries a web address instead of a file.
    const dropped = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (dropped) addText(dropped.split(/\r?\n/).find((l) => l && !l.startsWith("#")) ?? "");
  }

  const working = busy || pending;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add work: drop files here, or press Enter to choose files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="rounded-2xl text-center cursor-pointer"
        style={{
          padding: compact ? "18px 16px" : "28px 16px",
          border: `2px dashed ${dragging ? "var(--aurora-accent)" : "var(--aurora-border)"}`,
          background: dragging ? "var(--aurora-bg-tint)" : "transparent",
          transition: "background .15s, border-color .15s",
        }}
      >
        <UploadSimple size={compact ? 22 : 28} style={{ color: "var(--aurora-accent)" }} />
        <div className="text-[15px] mt-1.5" style={{ fontWeight: 600 }}>
          {working ? "Adding..." : "Drop work here"}
        </div>
        <div className="text-[13px] mt-0.5" style={{ color: "var(--aurora-text-muted)" }}>
          Files, screenshots, PDFs or links. Or paste a screenshot with Ctrl+V.
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          addText(text);
        }}
      >
        <label htmlFor={`aligner-text-${campaignId ?? "home"}`} className="sr-only">
          Paste a link or type a note
        </label>
        <input
          id={`aligner-text-${campaignId ?? "home"}`}
          className="mkt-input flex-1"
          placeholder="Paste a Notion, Google Doc or any link, or type a note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={5000}
        />
        <button type="submit" className="mkt-btn mkt-btn-ghost" disabled={working || !text.trim()}>
          <Paperclip size={15} />
          Add
        </button>
      </form>

      <div aria-live="polite" className="text-[13px] mt-2 min-h-[18px]" style={{ color: message?.tone === "error" ? "#b91c1c" : "var(--aurora-text-muted)" }}>
        {message?.text}
      </div>
    </div>
  );
}
