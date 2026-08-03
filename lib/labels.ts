import type { CampaignStatus, DeliverableStage, InvoiceStatus, PayRail, CreatorStatus } from "@prisma/client";

export const campaignStatus: Record<CampaignStatus, { label: string; tag: string }> = {
  DRAFT: { label: "Draft", tag: "mkt-tag-neutral" },
  LIVE: { label: "Live", tag: "mkt-tag-accent" },
  IN_REVIEW: { label: "In review", tag: "mkt-tag-outline" },
  WRAPPING: { label: "Wrapping", tag: "mkt-tag-neutral" },
  COMPLETED: { label: "Completed", tag: "mkt-tag-good" },
};

export const deliverableStage: Record<DeliverableStage, { label: string; tag: string; color: string }> = {
  PLANNED: { label: "Planned", tag: "mkt-tag-neutral", color: "#9ca3af" },
  IN_PROGRESS: { label: "In progress", tag: "mkt-tag-accent", color: "#7c3aed" },
  IN_REVIEW: { label: "In review", tag: "mkt-tag-warn", color: "#ea580c" },
  APPROVED: { label: "Approved", tag: "mkt-tag-good", color: "#16a34a" },
  LIVE: { label: "Live", tag: "mkt-tag-good", color: "#16a34a" },
};

export function isDeliverableDone(stage: DeliverableStage) {
  return stage === "APPROVED" || stage === "LIVE";
}

export const invoiceStatus: Record<InvoiceStatus, { label: string; tag: string }> = {
  PENDING: { label: "Pending", tag: "mkt-tag-outline" },
  OVERDUE: { label: "Overdue", tag: "mkt-tag-warn" },
  PAID: { label: "Paid", tag: "mkt-tag-good" },
};

export const payRail: Record<PayRail, string> = {
  RAZORPAY: "Razorpay",
  STRIPE: "Stripe",
  WISE: "Wise",
  PAYPAL: "PayPal",
};

export const creatorStatus: Record<CreatorStatus, { label: string; tag: string }> = {
  ACTIVE: { label: "Active", tag: "mkt-tag-accent" },
  IDLE: { label: "Idle", tag: "mkt-tag-neutral" },
};
