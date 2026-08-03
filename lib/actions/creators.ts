"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createCreator(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const handle = String(formData.get("handle") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const instagramRaw = String(formData.get("instagram") || "");
  const youtubeRaw = String(formData.get("youtube") || "");
  const ratecardNote = String(formData.get("ratecardNote") || "").trim() || undefined;

  if (!name || !handle || !category) return;

  await prisma.creator.create({
    data: {
      name,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      category,
      instagram: instagramRaw ? Number(instagramRaw) : undefined,
      youtube: youtubeRaw ? Number(youtubeRaw) : undefined,
      ratecardNote,
    },
  });

  revalidatePath("/app/creators");
}
