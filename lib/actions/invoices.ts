"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import type { PayRail } from "@prisma/client";

export async function createInvoice(formData: FormData) {
  const { db, workspace } = await requireWorkspace();

  const campaignId = String(formData.get("campaignId") || "");
  const amount = Number(formData.get("amount") || 0);
  const rail = String(formData.get("rail") || "RAZORPAY") as PayRail;
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!campaignId || !amount || !dueDateRaw) return;

  // Looked up through the workspace guard: a campaign from another customer is "not found".
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return;

  const count = await db.invoice.count();
  const number = String(200 + count);

  await db.invoice.create({
    data: {
      number,
      amount: Math.round(amount),
      rail,
      dueDate: new Date(dueDateRaw),
      status: "PENDING",
      campaignId: campaign.id,
      brandId: campaign.brandId,
      creatorId: campaign.creatorId,
      workspaceId: workspace.id,
    },
  });

  revalidatePath("/app/payments");
  revalidatePath("/app");
  revalidatePath(`/app/campaigns/${campaign.id}`);
}

export async function markInvoicePaid(invoiceId: string) {
  const { db } = await requireWorkspace();

  const invoice = await db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });
  revalidatePath("/app/payments");
  revalidatePath("/app");
  revalidatePath(`/app/campaigns/${invoice.campaignId}`);
}
