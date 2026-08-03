"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { PayRail } from "@prisma/client";

export async function createInvoice(formData: FormData) {
  const campaignId = String(formData.get("campaignId") || "");
  const amount = Number(formData.get("amount") || 0);
  const rail = String(formData.get("rail") || "RAZORPAY") as PayRail;
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!campaignId || !amount || !dueDateRaw) return;

  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const count = await prisma.invoice.count();
  const number = String(200 + count);

  await prisma.invoice.create({
    data: {
      number,
      amount: Math.round(amount),
      rail,
      dueDate: new Date(dueDateRaw),
      status: "PENDING",
      campaignId,
      brandId: campaign.brandId,
      creatorId: campaign.creatorId,
    },
  });

  revalidatePath("/app/payments");
  revalidatePath("/app");
  revalidatePath(`/app/campaigns/${campaignId}`);
}

export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });
  revalidatePath("/app/payments");
  revalidatePath("/app");
  revalidatePath(`/app/campaigns/${invoice.campaignId}`);
}
