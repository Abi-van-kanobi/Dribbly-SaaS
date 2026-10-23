import "server-only";
import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { isStorageConfigured } from "@/lib/storage";

/** The checks every upload route runs first. Returns a ready-made error response, or the signed-in context. */
export async function guardUpload(req: Request) {
  // The session cookie is SameSite=Lax, which already blocks cross-site POSTs; this is a second lock.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return { ok: false as const, response: NextResponse.json({ error: "Cross-site uploads are not allowed." }, { status: 403 }) };
  }

  const ctx = await requireWorkspace();

  if (ctx.workspace.isDemo) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Uploads are switched off in the shared demo. Links and notes still work." }, { status: 403 }),
    };
  }
  if (!isStorageConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "File uploads are not set up yet. Links and notes still work." }, { status: 503 }),
    };
  }
  return { ok: true as const, ctx };
}
