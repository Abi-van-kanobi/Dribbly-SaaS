"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";

export async function createCreator(formData: FormData) {
  const { db, workspace } = await requireWorkspace();

  const name = String(formData.get("name") || "").trim();
  const handle = String(formData.get("handle") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const instagramRaw = String(formData.get("instagram") || "");
  const youtubeRaw = String(formData.get("youtube") || "");
  const ratecardNote = String(formData.get("ratecardNote") || "").trim() || undefined;

  if (!name || !handle || !category) return;

  await db.creator.create({
    data: {
      name,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      category,
      instagram: instagramRaw ? Number(instagramRaw) : undefined,
      youtube: youtubeRaw ? Number(youtubeRaw) : undefined,
      ratecardNote,
      workspaceId: workspace.id,
    },
  });

  revalidatePath("/app/creators");
}
