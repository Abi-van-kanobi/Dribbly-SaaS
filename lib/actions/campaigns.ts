"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import type { DeliverableStage } from "@prisma/client";
import { assignCreatorCore, createCampaignCore } from "@/lib/campaign-service";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createCampaign(formData: FormData): Promise<{ ok: true; campaignId: string } | { ok: false; error: string }> {
  const { db, workspace } = await requireWorkspace();

  const text = (key: string) => String(formData.get(key) ?? "");
  const result = await createCampaignCore(db, workspace.id, {
    name: text("name"),
    brandId: text("brandId"),
    newBrandName: text("newBrandName"),
    creatorId: text("creatorId"),
    newCreatorName: text("newCreatorName"),
    value: text("value"),
    deadline: text("deadline"),
  });

  if (result.ok) {
    revalidatePath("/app/campaigns");
    revalidatePath("/app/creators");
    revalidatePath("/app");
  }
  return result;
}

/** Gives a campaign a creator, or changes it. */
export async function assignCreator(formData: FormData): Promise<ActionResult> {
  const { db, workspace } = await requireWorkspace();

  const campaignId = String(formData.get("campaignId") ?? "");
  const result = await assignCreatorCore(db, workspace.id, {
    campaignId,
    creatorId: String(formData.get("creatorId") ?? ""),
    newCreatorName: String(formData.get("newCreatorName") ?? ""),
  });

  if (result.ok) {
    revalidatePath(`/app/campaigns/${campaignId}`);
    revalidatePath("/app/campaigns");
    revalidatePath("/app/creators");
    revalidatePath("/app/payments");
    revalidatePath("/app");
  }
  return result;
}

const STAGE_ORDER: DeliverableStage[] = ["PLANNED", "IN_PROGRESS", "IN_REVIEW", "APPROVED", "LIVE"];

export async function advanceDeliverableStage(deliverableId: string) {
  const { db } = await requireWorkspace();

  const deliverable = await db.deliverable.findUniqueOrThrow({ where: { id: deliverableId } });
  const idx = STAGE_ORDER.indexOf(deliverable.stage);
  const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
  await db.deliverable.update({ where: { id: deliverableId }, data: { stage: next } });

  revalidatePath(`/app/campaigns/${deliverable.campaignId}`);
  revalidatePath("/app/campaigns");
  revalidatePath("/app");
}

export async function addDeliverable(campaignId: string, formData: FormData) {
  const { db, workspace } = await requireWorkspace();

  const title = String(formData.get("title") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  if (!title || !dueDateRaw) return;

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return;

  const count = await db.deliverable.count({ where: { campaignId: campaign.id } });
  await db.deliverable.create({
    data: { title, dueDate: new Date(dueDateRaw), campaignId: campaign.id, order: count, workspaceId: workspace.id },
  });

  revalidatePath(`/app/campaigns/${campaign.id}`);
  revalidatePath("/app/campaigns");
}
