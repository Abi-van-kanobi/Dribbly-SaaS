import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/google";
import { signInWithGoogleProfile } from "@/lib/signin";

/**
 * Local-only stand-in for "Sign in with Google", so the sign-up, onboarding and privacy flows
 * can be exercised without Google keys. It is invisible (404) unless BOTH hold:
 *   - NODE_ENV is not "production"
 *   - ALLOW_DEV_LOGIN=true is set in the local .env
 * It runs the exact same sign-in logic as the real Google callback.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_LOGIN !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = (req.nextUrl.searchParams.get("email") ?? "dev.user@example.com").trim().toLowerCase();
  const name = req.nextUrl.searchParams.get("name") ?? "Dev User";

  const next = await signInWithGoogleProfile({ sub: `dev:${email}`, email, name });
  return NextResponse.redirect(new URL(next, appOrigin(req.nextUrl.origin)));
}
