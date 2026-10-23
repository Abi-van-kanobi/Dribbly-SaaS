import type { TenantDb } from "@/lib/tenant";

/**
 * Creating a campaign and giving it a creator, with as few demands on the person as possible.
 *
 *  - Only a name and a brand are needed. The creator is optional and can be added any time.
 *  - A brand or creator can be picked from the list or typed as a new name. A typed name that matches
 *    an existing one (ignoring capitals) reuses it instead of making a duplicate.
 *  - Value is optional (0), and the deadline defaults to 30 days from now.
 *  - Everything that came from a form is checked against THIS workspace before anything is created,
 *    so a foreign ID is refused and a refused request leaves nothing behind.
 *
 * `db` must be the workspace-scoped client.
 */

export const MAX_CAMPAIGN_NAME = 120;
export const MAX_PARTY_NAME = 80;
export const DEFAULT_DEADLINE_DAYS = 30;

export interface CampaignInput {
  name?: string;
  brandId?: string;
  newBrandName?: string;
  creatorId?: string;
  newCreatorName?: string;
  value?: string | number;
  /** A day as YYYY-MM-DD. Blank means 30 days from now. */
  deadline?: string;
}

export type CampaignResult = { ok: true; campaignId: string } | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };

const clean = (s: string | undefined) => (s ?? "").trim();

/** "Elin Lindqvist" becomes "@elinlindqvist". Creators made from a typed name need a handle; they can edit it later. */
export function handleFromName(name: string) {
  const letters = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
  return `@${letters || "creator"}`;
}

type Resolved = { ok: true; id: string | null; create: string | null } | { ok: false; error: string };

async function resolveBrand(db: TenantDb, input: Pick<CampaignInput, "brandId" | "newBrandName">): Promise<Resolved> {
  const brandId = clean(input.brandId);
  if (brandId) {
    const found = await db.brand.findUnique({ where: { id: brandId }, select: { id: true } });
    return found ? { ok: true, id: found.id, create: null } : { ok: false, error: "That brand was not found." };
  }
  const name = clean(input.newBrandName);
  if (!name) return { ok: false, error: "Pick a brand, or type a new brand name." };
  if (name.length > MAX_PARTY_NAME) return { ok: false, error: `Brand names can be up to ${MAX_PARTY_NAME} characters.` };
  const same = (await db.brand.findMany({ select: { id: true, name: true } })).find((b) => b.name.trim().toLowerCase() === name.toLowerCase());
  return same ? { ok: true, id: same.id, create: null } : { ok: true, id: null, create: name };
}

/** No creator at all is a valid answer here: `{ id: null, create: null }`. */
async function resolveCreator(db: TenantDb, input: Pick<CampaignInput, "creatorId" | "newCreatorName">): Promise<Resolved> {
  const creatorId = clean(input.creatorId);
  if (creatorId) {
    const found = await db.creator.findUnique({ where: { id: creatorId }, select: { id: true } });
    return found ? { ok: true, id: found.id, create: null } : { ok: false, error: "That creator was not found." };
  }
  const name = clean(input.newCreatorName);
  if (!name) return { ok: true, id: null, create: null };
  if (name.length > MAX_PARTY_NAME) return { ok: false, error: `Creator names can be up to ${MAX_PARTY_NAME} characters.` };
  const same = (await db.creator.findMany({ select: { id: true, name: true } })).find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
  return same ? { ok: true, id: same.id, create: null } : { ok: true, id: null, create: name };
}

async function materialiseCreator(db: TenantDb, workspaceId: string, r: { id: string | null; create: string | null }) {
  if (r.id || !r.create) return r.id;
  const created = await db.creator.create({ data: { name: r.create, handle: handleFromName(r.create), category: "General", workspaceId } });
  return created.id;
}

export async function createCampaignCore(db: TenantDb, workspaceId: string, input: CampaignInput, now: Date = new Date()): Promise<CampaignResult> {
  const name = clean(input.name);
  if (!name) return { ok: false, error: "Give the campaign a name." };
  if (name.length > MAX_CAMPAIGN_NAME) return { ok: false, error: `Campaign names can be up to ${MAX_CAMPAIGN_NAME} characters.` };

  const brand = await resolveBrand(db, input);
  if (!brand.ok) return brand;
  const creator = await resolveCreator(db, input);
  if (!creator.ok) return creator;

  const rawValue = typeof input.value === "number" ? input.value : Number(clean(input.value) || 0);
  const value = Number.isFinite(rawValue) ? Math.max(0, Math.round(rawValue)) : 0;

  const rawDeadline = clean(input.deadline);
  const deadline = rawDeadline ? new Date(rawDeadline) : new Date(now.getTime() + DEFAULT_DEADLINE_DAYS * 86400000);
  if (Number.isNaN(deadline.getTime())) return { ok: false, error: "That deadline is not a valid date." };

  // Everything is checked. Only now is anything created.
  const brandId = brand.id ?? (await db.brand.create({ data: { name: brand.create!, workspaceId } })).id;
  const creatorId = await materialiseCreator(db, workspaceId, creator);

  const campaign = await db.campaign.create({
    data: { name, brandId, creatorId, value, deadline, status: "DRAFT", workspaceId },
  });
  return { ok: true, campaignId: campaign.id };
}

/**
 * Gives a campaign a creator, or changes it. Unpaid invoices follow the campaign's creator; paid ones keep
 * the creator they were paid under.
 */
export async function assignCreatorCore(
  db: TenantDb,
  workspaceId: string,
  input: { campaignId: string; creatorId?: string; newCreatorName?: string },
): Promise<SimpleResult> {
  const campaign = await db.campaign.findUnique({ where: { id: input.campaignId }, select: { id: true } });
  if (!campaign) return { ok: false, error: "That campaign was not found." };

  const creator = await resolveCreator(db, input);
  if (!creator.ok) return creator;
  if (!creator.id && !creator.create) return { ok: false, error: "Pick a creator, or type a new name." };

  const creatorId = await materialiseCreator(db, workspaceId, creator);
  await db.campaign.update({ where: { id: campaign.id }, data: { creatorId } });
  await db.invoice.updateMany({ where: { campaignId: campaign.id, status: { not: "PAID" } }, data: { creatorId } });
  return { ok: true };
}
