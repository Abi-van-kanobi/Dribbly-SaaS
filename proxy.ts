import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Cheap first gate: reads the signed cookie and routes people to the right place.
 * It cannot reach the database, so it only knows what the cookie claims. The real check
 * (does this person still belong to this workspace?) happens in requireWorkspace().
 */
export async function proxy(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const path = req.nextUrl.pathname;

  const go = (to: string) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (path.startsWith("/app")) {
    if (!session) return go("/login");
    if (session.kind === "onboarding") return go("/onboarding");
    return NextResponse.next();
  }

  if (path === "/login") {
    if (session?.kind === "user") return go("/app");
    if (session?.kind === "onboarding") return go("/onboarding");
    return NextResponse.next();
  }

  if (path === "/onboarding") {
    if (!session) return go("/login");
    if (session.kind === "user") return go("/app");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/onboarding"],
};
