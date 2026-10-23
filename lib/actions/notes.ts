"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import type { NoteKind } from "@prisma/client";

export async function createNote(formData: FormData) {
  const { db, workspace } = await requireWorkspace();

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const kind = (String(formData.get("kind") || "INTERNAL") as NoteKind);
  const campaignId = String(formData.get("campaignId") || "") || undefined;
  const brandId = String(formData.get("brandId") || "") || undefined;

  if (!title || !body) return;

  // Optional links must point at this workspace's own records.
  if (campaignId && !(await db.campaign.findUnique({ where: { id: campaignId } }))) return;
  if (brandId && !(await db.brand.findUnique({ where: { id: brandId } }))) return;

  await db.note.create({ data: { title, body, kind, campaignId, brandId, workspaceId: workspace.id } });

  revalidatePath("/app/notes");
  if (campaignId) revalidatePath(`/app/campaigns/${campaignId}`);
}
