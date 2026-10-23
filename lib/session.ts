import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { tenantDb } from "@/lib/tenant";
import { SESSION_COOKIE, createSessionToken, sessionMaxAge, verifySessionToken, type SessionData } from "@/lib/auth";

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Only call from a server action or route handler (server components cannot set cookies). */
export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAge(data),
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * The one door into the signed-in app. Returns who is signed in, which workspace they are in,
 * and a database client that can only see that workspace.
 *
 * The session cookie only says who someone claims to be; the database decides whether they
 * still belong. A cookie for a deleted account or removed membership is sent to
 * /api/session/clear, which drops it, so a stale cookie can never cause a redirect loop.
 */
export const requireWorkspace = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.kind === "onboarding") redirect("/onboarding");

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.uid, workspaceId: session.wid } },
    include: { user: true, workspace: true },
  });
  if (!membership) redirect("/api/session/clear");

  return {
    user: membership.user,
    workspace: membership.workspace,
    role: membership.role,
    db: tenantDb(membership.workspaceId),
  };
});
