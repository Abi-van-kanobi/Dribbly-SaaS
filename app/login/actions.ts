"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, setSession } from "@/lib/session";
import { DEMO_EMAIL, isDemoEnabled } from "@/lib/demo-account";

/** Opens the shared demo workspace (sample data only). Off by default in production. */
export async function demoLoginAction() {
  if (!isDemoEnabled()) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { memberships: { include: { workspace: true } } },
  });
  const membership = user?.memberships.find((m) => m.workspace.isDemo);
  if (!user || !membership) redirect("/login?error=demo");

  await setSession({ kind: "user", uid: user.id, wid: membership.workspaceId });
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
