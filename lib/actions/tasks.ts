"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleTask(taskId: string, done: boolean) {
  await prisma.task.update({ where: { id: taskId }, data: { done } });
  revalidatePath("/app");
  revalidatePath("/app/campaigns");
}
