import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function getManager() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const managerId = await verifySessionToken(token);
  if (!managerId) return null;
  return prisma.manager.findUnique({ where: { id: managerId } });
}

export async function requireManager() {
  const manager = await getManager();
  if (!manager) redirect("/login");
  return manager;
}
