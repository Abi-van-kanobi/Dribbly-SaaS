"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { NoteKind } from "@prisma/client";

export async function createNote(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const kind = (String(formData.get("kind") || "INTERNAL") as NoteKind);
  const campaignId = String(formData.get("campaignId") || "") || undefined;
  const brandId = String(formData.get("brandId") || "") || undefined;

  if (!title || !body) return;

  await prisma.note.create({ data: { title, body, kind, campaignId, brandId } });

  revalidatePath("/app/notes");
  if (campaignId) revalidatePath(`/app/campaigns/${campaignId}`);
}
