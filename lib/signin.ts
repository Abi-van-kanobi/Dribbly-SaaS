import "server-only";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

export type GoogleProfile = { sub: string; email: string; name?: string };

/**
 * Turns a verified Google identity into a session and says where to send the person next.
 *
 *  - Known person            -> signed in, straight to the app.
 *  - New person              -> an "onboarding" session. NOTHING is written to the database
 *                               until they accept the Terms and Privacy Policy.
 *  - Email already in use    -> refused. We never attach a new Google identity to an existing
 *                               account by email alone (that would let one person take over
 *                               another's account, including the demo account).
 */
export async function signInWithGoogleProfile(profile: GoogleProfile): Promise<string> {
  const email = profile.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { googleSub: profile.sub },
    include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  if (existing) {
    const membership = existing.memberships[0];
    if (!membership) return "/login?error=no-workspace";
    await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
    await setSession({ kind: "user", uid: existing.id, wid: membership.workspaceId });
    return "/app";
  }

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) return "/login?error=email-in-use";

  await setSession({ kind: "onboarding", sub: profile.sub, email, name: profile.name });
  return "/onboarding";
}
