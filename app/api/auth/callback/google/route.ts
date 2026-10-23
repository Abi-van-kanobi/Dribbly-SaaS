import { NextRequest, NextResponse } from "next/server";
import { decodeIdToken } from "arctic";
import { appOrigin, googleClient, isGoogleConfigured } from "@/lib/google";
import { signInWithGoogleProfile } from "@/lib/signin";

/** Step 2 of Google sign-in: Google sends the person back here with a one-time code. */
export async function GET(req: NextRequest) {
  const origin = appOrigin(req.nextUrl.origin);

  const finish = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    // The state and verifier are single-use: always clear them.
    res.cookies.set("g_state", "", { path: "/api/auth", maxAge: 0 });
    res.cookies.set("g_verifier", "", { path: "/api/auth", maxAge: 0 });
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("g_state")?.value;
  const codeVerifier = req.cookies.get("g_verifier")?.value;

  // The state must match the one we issued to this browser, or the request is not ours.
  if (!isGoogleConfigured() || !code || !state || !savedState || !codeVerifier || state !== savedState) {
    return finish("/login?error=google");
  }

  try {
    const tokens = await googleClient(origin).validateAuthorizationCode(code, codeVerifier);
    const claims = decodeIdToken(tokens.idToken()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!claims.sub || !claims.email || claims.email_verified !== true) {
      return finish("/login?error=email-unverified");
    }

    const next = await signInWithGoogleProfile({ sub: claims.sub, email: claims.email, name: claims.name });
    return finish(next);
  } catch {
    return finish("/login?error=google");
  }
}
