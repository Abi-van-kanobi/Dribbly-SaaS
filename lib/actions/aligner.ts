"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import { MAX_NOTE, classifyLink, titleFromNote } from "@/lib/aligner";
import { removeItem } from "@/lib/aligner-service";
import { getStorage, isStorageConfigured } from "@/lib/storage";

type Result = { ok: true } | { ok: false; error: string };

function refresh(campaignId?: string | null) {
  revalidatePath("/app");
  if (campaignId) revalidatePath(`/app/campaigns/${campaignId}`);
}

async function ownCampaign(db: Awaited<ReturnType<typeof requireWorkspace>>["db"], id?: string | null) {
  if (!id) return null;
  return db.campaign.findUnique({ where: { id }, select: { id: true } });
}

/** Paste a link: Notion, a Google Doc or Sheet, or any web address. Stored as a link, never fetched. */
export async function addLink(input: { url: string; title?: string; campaignId?: string | null }): Promise<Result> {
  const { db, workspace, user } = await requireWorkspace();
  const link = classifyLink(input.url, input.title);
  if (!link) return { ok: false, error: "That does not look like a web link." };

  const campaign = await ownCampaign(db, input.campaignId);
  if (input.campaignId && !campaign) return { ok: false, error: "That campaign was not found." };

  await db.alignerItem.create({
    data: {
      kind: link.kind,
      title: link.title,
      url: link.url,
      status: campaign ? "FILED" : "INBOX",
      filedAt: campaign ? new Date() : null,
      campaignId: campaign?.id ?? null,
      addedById: user.id,
      workspaceId: workspace.id,
    },
  });
  refresh(campaign?.id);
  return { ok: true };
}

export async function addNote(input: { text: string; campaignId?: string | null }): Promise<Result> {
  const { db, workspace, user } = await requireWorkspace();
  const text = input.text.trim();
  if (!text) return { ok: false, error: "Type a note first." };
  if (text.length > MAX_NOTE) return { ok: false, error: `Notes can be up to ${MAX_NOTE} characters.` };

  const campaign = await ownCampaign(db, input.campaignId);
  if (input.campaignId && !campaign) return { ok: false, error: "That campaign was not found." };

  await db.alignerItem.create({
    data: {
      kind: "NOTE",
      title: titleFromNote(text),
      text,
      status: campaign ? "FILED" : "INBOX",
      filedAt: campaign ? new Date() : null,
      campaignId: campaign?.id ?? null,
      addedById: user.id,
      workspaceId: workspace.id,
    },
  });
  refresh(campaign?.id);
  return { ok: true };
}

/** File an item to a campaign, or pass null to send it back to the Inbox. */
export async function fileItem(input: { itemId: string; campaignId: string | null }): Promise<Result> {
  const { db } = await requireWorkspace();
  const item = await db.alignerItem.findUnique({ where: { id: input.itemId } });
  if (!item) return { ok: false, error: "That item was not found." };

  const campaign = await ownCampaign(db, input.campaignId);
  if (input.campaignId && !campaign) return { ok: false, error: "That campaign was not found." };

  await db.alignerItem.update({
    where: { id: item.id },
    data: campaign
      ? { campaignId: campaign.id, status: "FILED", filedAt: new Date() }
      : { campaignId: null, status: "INBOX", filedAt: null },
  });
  refresh(item.campaignId);
  refresh(campaign?.id);
  return { ok: true };
}

export async function deleteItem(input: { itemId: string }): Promise<Result> {
  const { db } = await requireWorkspace();
  const existing = await db.alignerItem.findUnique({ where: { id: input.itemId }, select: { campaignId: true, fileKey: true } });
  if (!existing) return { ok: false, error: "That item was not found." };

  await removeItem({ db, storage: existing.fileKey && isStorageConfigured() ? getStorage() : null, id: input.itemId });
  refresh(existing.campaignId);
  return { ok: true };
}
