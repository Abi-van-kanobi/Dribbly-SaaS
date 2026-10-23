import type { PinKind, Prisma } from "@prisma/client";
import type { TenantDb } from "@/lib/tenant";
import { MAX_PINS, addDays, carriedLabel, dayInZone, dueInfo, type DueInfo } from "@/lib/today";

/**
 * The Important Today bar: what is pinned, what shows, and the rules for changing it.
 *
 * Rules (from the product spec):
 *  - Up to 5 cards. Pinning a sixth asks which one to drop.
 *  - A pin that is not finished by midnight (workspace time zone) carries over and says so.
 *  - A pin that is ticked off stays on the bar, struck through, until the end of that day.
 *  - "Tomorrow" moves a pin off today's bar and back onto tomorrow's.
 *
 * `db` must be the workspace-scoped client, so a pin can only ever point at this workspace's own records.
 */

export interface PinContext {
  workspaceId: string;
  userId: string;
  timeZone: string;
  now: Date;
}

export interface BarCard {
  pinId: string;
  kind: PinKind;
  targetId: string;
  title: string;
  subtitle: string;
  due: DueInfo;
  carried: string | null;
  done: boolean;
  openHref: string | null;
}

export interface Bar {
  today: string;
  cards: BarCard[];
  doneCount: number;
}

export interface Candidate {
  kind: PinKind;
  id: string;
  title: string;
  subtitle: string;
  due: DueInfo;
}

export type PinResult = { ok: true; pinId: string } | { ok: false; error: string } | { ok: false; full: true; cards: BarCard[] };
export type SimpleResult = { ok: true } | { ok: false; error: string };

const include = {
  task: { include: { campaign: true, creator: true } },
  deliverable: { include: { campaign: { include: { creator: true } } } },
  invoice: { include: { campaign: true, brand: true, creator: true } },
} satisfies Prisma.PinInclude;

const dayOf = (ctx: PinContext) => dayInZone(ctx.now, ctx.timeZone);

/** Pins that belong on today's bar: for today or earlier and unfinished, or finished today. */
const onBarWhere = (today: string): Prisma.PinWhereInput => ({
  showOn: { lte: today },
  OR: [{ doneOn: null }, { doneOn: today }],
});

const linkFor = (kind: PinKind, id: string): Prisma.PinWhereUniqueInput | Prisma.PinWhereInput =>
  kind === "TASK" ? { taskId: id } : kind === "DELIVERABLE" ? { deliverableId: id } : { invoiceId: id };

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

function toCard(pin: Prisma.PinGetPayload<{ include: typeof include }>, today: string, timeZone: string): BarCard | null {
  const done = pin.doneOn !== null;
  const carried = done ? null : carriedLabel(pin.showOn, today);
  const base = { pinId: pin.id, kind: pin.kind, done, carried };

  if (pin.kind === "TASK" && pin.task) {
    const t = pin.task;
    const due = dueInfo(t.dueAt, today, timeZone, true);
    return { ...base, targetId: t.id, title: t.title, subtitle: join(t.campaign?.name, t.creator?.name), due: done ? { ...due, late: false } : due, openHref: t.campaignId ? `/app/campaigns/${t.campaignId}` : null };
  }
  if (pin.kind === "DELIVERABLE" && pin.deliverable) {
    const d = pin.deliverable;
    const due = dueInfo(d.dueDate, today, timeZone);
    return { ...base, targetId: d.id, title: d.title, subtitle: join(d.campaign.name, d.campaign.creator?.name), due: done ? { ...due, late: false } : due, openHref: `/app/campaigns/${d.campaignId}?tab=deliverables` };
  }
  if (pin.kind === "INVOICE" && pin.invoice) {
    const inv = pin.invoice;
    const due = dueInfo(inv.dueDate, today, timeZone);
    return { ...base, targetId: inv.id, title: `Invoice #${inv.number} · ${inv.brand.name}`, subtitle: join(inv.campaign.name, inv.creator?.name), due: done ? { ...due, late: false } : due, openHref: "/app/payments" };
  }
  return null;
}

export async function loadBar(db: TenantDb, ctx: PinContext): Promise<Bar> {
  const today = dayOf(ctx);
  const pins = await db.pin.findMany({
    where: onBarWhere(today),
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include,
    take: MAX_PINS,
  });
  const cards = pins.map((p) => toCard(p, today, ctx.timeZone)).filter((c): c is BarCard => c !== null);
  return { today, cards, doneCount: cards.filter((c) => c.done).length };
}

/** Everything currently pinned (not archived), as "KIND:id" keys, so a pin button knows whether to pin or unpin. */
export async function pinnedKeys(db: TenantDb, ctx: PinContext): Promise<Set<string>> {
  const today = dayOf(ctx);
  const pins = await db.pin.findMany({
    where: { OR: [{ doneOn: null }, { doneOn: today }] },
    select: { taskId: true, deliverableId: true, invoiceId: true },
  });
  const keys = new Set<string>();
  for (const p of pins) {
    if (p.taskId) keys.add(`TASK:${p.taskId}`);
    if (p.deliverableId) keys.add(`DELIVERABLE:${p.deliverableId}`);
    if (p.invoiceId) keys.add(`INVOICE:${p.invoiceId}`);
  }
  return keys;
}

/** Things worth pinning right now: late first, then what is due soon. Already-pinned items are left out. */
export async function loadCandidates(db: TenantDb, ctx: PinContext): Promise<Candidate[]> {
  const today = dayOf(ctx);
  const horizon = addDays(today, 7);
  const pinned = await pinnedKeys(db, ctx);

  const [tasks, deliverables, invoices] = await Promise.all([
    db.task.findMany({ where: { done: false }, orderBy: { dueAt: "asc" }, take: 30, include: { campaign: true, creator: true } }),
    db.deliverable.findMany({ where: { stage: { notIn: ["APPROVED", "LIVE"] } }, orderBy: { dueDate: "asc" }, take: 30, include: { campaign: { include: { creator: true } } } }),
    db.invoice.findMany({ where: { status: { in: ["PENDING", "OVERDUE"] } }, orderBy: { dueDate: "asc" }, take: 30, include: { campaign: true, brand: true, creator: true } }),
  ]);

  type Ranked = Candidate & { dueDay: string | null };
  const dayOrNull = (d: Date | null) => (d ? dayInZone(d, ctx.timeZone) : null);

  const all: Ranked[] = [
    ...tasks.map((t): Ranked => ({ kind: "TASK", id: t.id, title: t.title, subtitle: join(t.campaign?.name, t.creator?.name), due: dueInfo(t.dueAt, today, ctx.timeZone, true), dueDay: dayOrNull(t.dueAt) })),
    ...deliverables.map((d): Ranked => ({ kind: "DELIVERABLE", id: d.id, title: d.title, subtitle: join(d.campaign.name, d.campaign.creator?.name), due: dueInfo(d.dueDate, today, ctx.timeZone), dueDay: dayOrNull(d.dueDate) })),
    ...invoices.map((i): Ranked => ({ kind: "INVOICE", id: i.id, title: `Invoice #${i.number} · ${i.brand.name}`, subtitle: join(i.campaign.name, i.creator?.name), due: dueInfo(i.dueDate, today, ctx.timeZone), dueDay: dayOrNull(i.dueDate) })),
  ];

  return all
    .filter((c) => !pinned.has(`${c.kind}:${c.id}`))
    // Late, due within a week, or a task with no date at all.
    .filter((c) => c.dueDay === null || c.dueDay <= horizon)
    .sort((a, b) => {
      if (a.due.late !== b.due.late) return a.due.late ? -1 : 1;
      if (a.due.late && b.due.late) return b.due.daysLate - a.due.daysLate;
      return (a.dueDay ?? "9999-12-31").localeCompare(b.dueDay ?? "9999-12-31");
    })
    .map((c) => ({ kind: c.kind, id: c.id, title: c.title, subtitle: c.subtitle, due: c.due }))
    .slice(0, 15);
}

async function targetExists(db: TenantDb, kind: PinKind, id: string) {
  if (kind === "TASK") return (await db.task.findUnique({ where: { id }, select: { id: true } })) !== null;
  if (kind === "DELIVERABLE") return (await db.deliverable.findUnique({ where: { id }, select: { id: true } })) !== null;
  return (await db.invoice.findUnique({ where: { id }, select: { id: true } })) !== null;
}

export async function pinItem(db: TenantDb, ctx: PinContext, target: { kind: PinKind; id: string }): Promise<PinResult> {
  if (!(await targetExists(db, target.kind, target.id))) return { ok: false, error: "That item was not found." };

  const today = dayOf(ctx);
  const link = linkFor(target.kind, target.id);
  const existing = await db.pin.findFirst({ where: link as Prisma.PinWhereInput });

  if (existing && (existing.doneOn === null || existing.doneOn === today) && existing.showOn <= today) {
    return { ok: true, pinId: existing.id }; // already on the bar
  }

  if ((await db.pin.count({ where: onBarWhere(today) })) >= MAX_PINS) {
    return { ok: false, full: true, cards: (await loadBar(db, ctx)).cards };
  }

  const last = await db.pin.aggregate({ where: onBarWhere(today), _max: { order: true } });
  const order = (last._max.order ?? -1) + 1;

  if (existing) {
    // Re-pinning something that was snoozed, or finished on an earlier day, reuses its row.
    const revived = await db.pin.update({ where: { id: existing.id }, data: { showOn: today, doneOn: null, order, pinnedById: ctx.userId } });
    return { ok: true, pinId: revived.id };
  }

  const created = await db.pin.create({
    data: { kind: target.kind, showOn: today, order, pinnedById: ctx.userId, workspaceId: ctx.workspaceId, ...(link as { taskId?: string; deliverableId?: string; invoiceId?: string }) },
  });
  return { ok: true, pinId: created.id };
}

export async function unpin(db: TenantDb, input: { pinId: string }): Promise<SimpleResult> {
  const pin = await db.pin.findUnique({ where: { id: input.pinId }, select: { id: true } });
  if (!pin) return { ok: false, error: "That pin was not found." };
  await db.pin.delete({ where: { id: pin.id } });
  return { ok: true };
}

export async function unpinTarget(db: TenantDb, target: { kind: PinKind; id: string }): Promise<SimpleResult> {
  await db.pin.deleteMany({ where: linkFor(target.kind, target.id) as Prisma.PinWhereInput });
  return { ok: true };
}

/** Ticks a pin off (or back on). Ticking a pinned task also completes the task itself. */
export async function setDone(db: TenantDb, ctx: PinContext, input: { pinId: string; done: boolean }): Promise<SimpleResult> {
  const pin = await db.pin.findUnique({ where: { id: input.pinId } });
  if (!pin) return { ok: false, error: "That pin was not found." };
  const today = dayOf(ctx);
  await db.pin.update({ where: { id: pin.id }, data: { doneOn: input.done ? today : null } });
  if (pin.kind === "TASK" && pin.taskId) await db.task.update({ where: { id: pin.taskId }, data: { done: input.done } });
  return { ok: true };
}

/** Keeps a pin in step when its task is ticked off somewhere else (the "Due today" list). */
export async function syncTaskPin(db: TenantDb, ctx: PinContext, taskId: string, done: boolean) {
  await db.pin.updateMany({ where: { taskId }, data: { doneOn: done ? dayOf(ctx) : null } });
}

/** Moves a pin to tomorrow: off today's bar now, back on tomorrow's. */
export async function snooze(db: TenantDb, ctx: PinContext, input: { pinId: string }): Promise<SimpleResult> {
  const pin = await db.pin.findUnique({ where: { id: input.pinId }, select: { id: true } });
  if (!pin) return { ok: false, error: "That pin was not found." };
  await db.pin.update({ where: { id: pin.id }, data: { showOn: addDays(dayOf(ctx), 1), doneOn: null } });
  return { ok: true };
}

/** Pinning when the bar is full: drop one pin and pin the new item in its place. */
export async function swapPin(db: TenantDb, ctx: PinContext, input: { dropPinId: string; kind: PinKind; id: string }): Promise<PinResult> {
  if (!(await targetExists(db, input.kind, input.id))) return { ok: false, error: "That item was not found." };
  const drop = await db.pin.findFirst({ where: { id: input.dropPinId, ...onBarWhere(dayOf(ctx)) }, select: { id: true } });
  if (!drop) return { ok: false, error: "That pin is no longer on the bar." };
  await db.pin.delete({ where: { id: drop.id } });
  return pinItem(db, ctx, { kind: input.kind, id: input.id });
}
