import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import { exportAccountData } from "@/lib/gdpr";
import { getStorage, isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Right of access and portability: everything we hold for this person's workspace, as JSON. */
export async function GET() {
  const { user, workspace } = await requireWorkspace();
  const data = await exportAccountData(prisma, user.id, workspace.id, isStorageConfigured() ? getStorage() : null);
  const day = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ettuno-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
