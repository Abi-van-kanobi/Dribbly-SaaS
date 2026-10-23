"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import { syncTaskPin } from "@/lib/pin-service";

export async function toggleTask(taskId: string, done: boolean) {
  const { db, workspace, user } = await requireWorkspace();

  // Looked up through the workspace-scoped client first, so a foreign ID is rejected, not updated.
  const task = await db.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return;

  await db.task.update({ where: { id: task.id }, data: { done } });
  // If this task is pinned to the Important Today bar, tick it there too.
  await syncTaskPin(db, { workspaceId: workspace.id, userId: user.id, timeZone: workspace.timezone, now: new Date() }, task.id, done);
  revalidatePath("/app");
  revalidatePath("/app/campaigns");
}
