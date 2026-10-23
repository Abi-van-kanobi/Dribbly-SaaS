import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { MAX_FILES_PER_UPLOAD } from "@/lib/aligner";
import { guardUpload } from "@/lib/aligner-guard";
import { finalizeDirectUpload } from "@/lib/aligner-service";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Step 2 of a browser-to-bucket upload. The browser says which pending objects it uploaded; each one
 * is inspected (workspace, size, real file type) before it is accepted, and deleted if it fails.
 */
export async function POST(req: Request) {
  const guard = await guardUpload(req);
  if (!guard.ok) return guard.response;
  const { db, workspace, user } = guard.ctx;

  const body = (await req.json().catch(() => null)) as { uploads?: { key?: unknown; name?: unknown }[]; campaignId?: unknown } | null;
  const uploads = body?.uploads;
  if (!Array.isArray(uploads) || uploads.length === 0 || uploads.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json({ error: "Nothing to complete." }, { status: 400 });
  }

  const campaignId = typeof body?.campaignId === "string" && body.campaignId ? body.campaignId : null;
  if (campaignId && !(await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) {
    return NextResponse.json({ error: "That campaign was not found." }, { status: 400 });
  }

  const storage = getStorage();
  const saved: { id: string; title: string }[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const u of uploads) {
    const name = typeof u.name === "string" ? u.name.slice(0, 255) : "file";
    if (typeof u.key !== "string") {
      errors.push({ name, error: "That upload was not recognised." });
      continue;
    }
    const result = await finalizeDirectUpload({ db, storage, workspaceId: workspace.id, userId: user.id, pendingKey: u.key, name, campaignId });
    if (result.ok) saved.push({ id: result.item.id, title: result.item.title });
    else errors.push({ name, error: result.error });
  }

  revalidatePath("/app");
  if (campaignId) revalidatePath(`/app/campaigns/${campaignId}`);
  return NextResponse.json({ saved, errors }, { status: saved.length ? 200 : 400 });
}
