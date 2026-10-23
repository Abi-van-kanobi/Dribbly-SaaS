import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { appOrigin } from "@/lib/google";

/**
 * Drops a session cookie that no longer matches a real account (for example after the account
 * was deleted) and sends the person to the login page. Without this, the proxy would keep
 * treating the stale cookie as valid and bounce between /login and /app.
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", appOrigin(req.nextUrl.origin)));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
