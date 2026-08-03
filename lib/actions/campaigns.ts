"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { DeliverableStage } from "@prisma/client";

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const brandId = String(formData.get("brandId") || "");
  const newBrandName = String(formData.get("newBrandName") || "").trim();
  const creatorId = String(formData.get("creatorId") || "");
  const value = Number(formData.get("value") || 0);
  const deadlineRaw = String(formData.get("deadline") || "");

  if (!name || !creatorId || (!brandId && !newBrandName) || !deadlineRaw) return;

  let finalBrandId = brandId;
  if (!finalBrandId && newBrandName) {
    const brand = await prisma.brand.create({ data: { name: newBrandName } });
    finalBrandId = brand.id;
  }

  await prisma.campaign.create({
    data: {
      name,
      brandId: finalBrandId,
      creatorId,
      value: Math.max(0, Math.round(value)),
      deadline: new Date(deadlineRaw),
      status: "DRAFT",
    },
  });

  revalidatePath("/app/campaigns");
  revalidatePath("/app");
}

const STAGE_ORDER: DeliverableStage[] = ["PLANNED", "IN_PROGRESS", "IN_REVIEW", "APPROVED", "LIVE"];

export async function advanceDeliverableStage(deliverableId: string) {
  const deliverable = await prisma.deliverable.findUniqueOrThrow({ where: { id: deliverableId } });
  const idx = STAGE_ORDER.indexOf(deliverable.stage);
  const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
  await prisma.deliverable.update({ where: { id: deliverableId }, data: { stage: next } });
  revalidatePath(`/app/campaigns/${deliverable.campaignId}`);
  revalidatePath("/app/campaigns");
  revalidatePath("/app");
}

export async function addDeliverable(campaignId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  if (!title || !dueDateRaw) return;

  const count = await prisma.deliverable.count({ where: { campaignId } });
  await prisma.deliverable.create({
    data: { title, dueDate: new Date(dueDateRaw), campaignId, order: count },
  });

  revalidatePath(`/app/campaigns/${campaignId}`);
  revalidatePath("/app/campaigns");
}
