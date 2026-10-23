"use server";

import { revalidatePath } from "next/cache";
import type { PinKind } from "@prisma/client";
import { requireWorkspace } from "@/lib/session";
import { pinItem, setDone, snooze, swapPin, unpin, unpinTarget, type PinResult, type SimpleResult } from "@/lib/pin-service";

const KINDS: PinKind[] = ["TASK", "DELIVERABLE", "INVOICE"];

async function context() {
  const { db, workspace, user } = await requireWorkspace();
  return { db, ctx: { workspaceId: workspace.id, userId: user.id, timeZone: workspace.timezone, now: new Date() } };
}

/** The pin shows on the dashboard, campaign pages and the payments page, so refresh all of the app. */
function refresh() {
  revalidatePath("/app", "layout");
}

const validKind = (kind: unknown): kind is PinKind => typeof kind === "string" && KINDS.includes(kind as PinKind);

export async function pinAction(input: { kind: PinKind; id: string }): Promise<PinResult> {
  if (!validKind(input.kind) || typeof input.id !== "string") return { ok: false, error: "That item was not found." };
  const { db, ctx } = await context();
  const result = await pinItem(db, ctx, input);
  if (result.ok) refresh();
  return result;
}

export async function unpinAction(input: { pinId?: string; kind?: PinKind; id?: string }): Promise<SimpleResult> {
  const { db } = await context();
  const result =
    input.pinId !== undefined
      ? await unpin(db, { pinId: input.pinId })
      : validKind(input.kind) && typeof input.id === "string"
        ? await unpinTarget(db, { kind: input.kind, id: input.id })
        : ({ ok: false, error: "Nothing to unpin." } as const);
  if (result.ok) refresh();
  return result;
}

export async function doneAction(input: { pinId: string; done: boolean }): Promise<SimpleResult> {
  const { db, ctx } = await context();
  const result = await setDone(db, ctx, input);
  if (result.ok) refresh();
  return result;
}

export async function tomorrowAction(input: { pinId: string }): Promise<SimpleResult> {
  const { db, ctx } = await context();
  const result = await snooze(db, ctx, input);
  if (result.ok) refresh();
  return result;
}

export async function swapAction(input: { dropPinId: string; kind: PinKind; id: string }): Promise<PinResult> {
  if (!validKind(input.kind)) return { ok: false, error: "That item was not found." };
  const { db, ctx } = await context();
  const result = await swapPin(db, ctx, input);
  if (result.ok) refresh();
  return result;
}
