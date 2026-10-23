import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD } from "@/lib/aligner";
import { guardUpload } from "@/lib/aligner-guard";
import { saveUploadedFile } from "@/lib/aligner-service";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Server-side upload: the files arrive in this request. Used where the storage driver cannot take
 * uploads straight from the browser (local development). With Cloudflare R2 the browser uses
 * /app/aligner/upload/init and /complete instead, because hosts such as Vercel cap request bodies.
 */
export async function POST(req: Request) {
  const guard = await guardUpload(req);
  if (!guard.ok) return guard.response;
  const { db, workspace, user } = guard.ctx;

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_BYTES * MAX_FILES_PER_UPLOAD + 1024 * 1024) {
    return NextResponse.json({ error: "That upload is too large." }, { status: 413 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files received." }, { status: 400 });
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json({ error: `Up to ${MAX_FILES_PER_UPLOAD} files at a time.` }, { status: 400 });
  }

  const campaignId = String(form.get("campaignId") ?? "") || null;
  if (campaignId && !(await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) {
    return NextResponse.json({ error: "That campaign was not found." }, { status: 400 });
  }

  const storage = getStorage();
  const saved: { id: string; title: string }[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      errors.push({ name: file.name, error: "Files can be up to 10 MB." });
      continue;
    }
    const result = await saveUploadedFile({
      db,
      storage,
      workspaceId: workspace.id,
      userId: user.id,
      name: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
      campaignId,
    });
    if (result.ok) saved.push({ id: result.item.id, title: result.item.title });
    else errors.push({ name: file.name, error: result.error });
  }

  revalidatePath("/app");
  if (campaignId) revalidatePath(`/app/campaigns/${campaignId}`);
  return NextResponse.json({ saved, errors }, { status: saved.length ? 200 : 400 });
}
