import { NextResponse } from "next/server";
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD, UPLOAD_CONTENT_TYPES, workspaceLimitBytes } from "@/lib/aligner";
import { guardUpload } from "@/lib/aligner-guard";
import { usedBytes } from "@/lib/aligner-service";
import { getStorage, newPendingKey } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface DeclaredFile {
  name: string;
  size: number;
  type: string;
}

function parseFiles(body: unknown): DeclaredFile[] | null {
  const files = (body as { files?: unknown })?.files;
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES_PER_UPLOAD) return null;
  const out: DeclaredFile[] = [];
  for (const f of files) {
    if (!f || typeof f.name !== "string" || typeof f.type !== "string" || !Number.isInteger(f.size)) return null;
    out.push({ name: f.name.slice(0, 255), size: f.size, type: f.type });
  }
  return out;
}

/**
 * Step 1 of a browser-to-bucket upload. Checks what the browser says it is about to send, then hands
 * back one short-lived signed URL per file, tied to the exact type and length declared here.
 * With a driver that cannot do this (local development) it says so and the browser uses /upload instead.
 */
export async function POST(req: Request) {
  const guard = await guardUpload(req);
  if (!guard.ok) return guard.response;
  const { db, workspace } = guard.ctx;

  const storage = getStorage();
  if (!storage.direct) return NextResponse.json({ mode: "server" });

  const body = await req.json().catch(() => null);
  const files = parseFiles(body);
  if (!files) return NextResponse.json({ error: `Send between 1 and ${MAX_FILES_PER_UPLOAD} files.` }, { status: 400 });

  const campaignId = typeof body?.campaignId === "string" && body.campaignId ? body.campaignId : null;
  if (campaignId && !(await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) {
    return NextResponse.json({ error: "That campaign was not found." }, { status: 400 });
  }

  for (const f of files) {
    if (f.size <= 0) return NextResponse.json({ error: `${f.name} is empty.` }, { status: 400 });
    if (f.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${f.name} is over 10 MB.` }, { status: 400 });
    if (!(UPLOAD_CONTENT_TYPES as readonly string[]).includes(f.type)) {
      return NextResponse.json({ error: `${f.name}: only images (PNG, JPG, GIF, WebP) and PDFs are supported.` }, { status: 400 });
    }
  }
  const total = files.reduce((n, f) => n + f.size, 0);
  if ((await usedBytes(db)) + total > workspaceLimitBytes()) {
    return NextResponse.json({ error: "This workspace has reached its file storage limit. Delete some files to add more." }, { status: 413 });
  }

  const uploads = await Promise.all(
    files.map(async (f) => {
      const key = newPendingKey(workspace.id);
      const signed = await storage.direct!.presign(key, { contentType: f.type, size: f.size });
      return { key, name: f.name, url: signed.url, headers: signed.headers };
    }),
  );
  return NextResponse.json({ mode: "direct", uploads });
}
