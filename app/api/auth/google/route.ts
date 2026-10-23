import { NextRequest, NextResponse } from "next/server";
import { generateCodeVerifier, generateState } from "arctic";
import { appOrigin, googleClient, isGoogleConfigured } from "@/lib/google";

/** Step 1 of Google sign-in: send the person to Google with a one-time state and PKCE challenge. */
export async function GET(req: NextRequest) {
  const origin = appOrigin(req.nextUrl.origin);

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google-not-configured", origin));
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  // Basic profile only. Drive/Sheets access is requested later, at the moment it is needed.
  const url = googleClient(origin).createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  const res = NextResponse.redirect(url);
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/auth",
  };
  res.cookies.set("g_state", state, options);
  res.cookies.set("g_verifier", codeVerifier, options);
  return res;
}
