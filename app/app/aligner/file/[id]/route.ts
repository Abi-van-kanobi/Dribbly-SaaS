import { requireWorkspace } from "@/lib/session";
import { getStorage, isStorageConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Serves an uploaded file to the people in its workspace, and nobody else. The item is looked up
 * through the workspace-scoped client, so another customer's ID simply returns 404. The type comes
 * from our database (set from the file's real bytes at upload), never from the request.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireWorkspace();

  const item = await db.alignerItem.findUnique({ where: { id } });
  if (!item?.fileKey || !item.mimeType || !isStorageConfigured()) return new Response("Not found", { status: 404 });

  const object = await getStorage().open(item.fileKey);
  if (!object) return new Response("Not found", { status: 404 });

  const name = encodeURIComponent(item.fileName ?? "file");
  return new Response(object.body, {
    headers: {
      "Content-Type": item.mimeType,
      ...(object.size !== null ? { "Content-Length": String(object.size) } : {}),
      "Content-Disposition": `inline; filename*=UTF-8''${name}`,
      "X-Content-Type-Options": "nosniff",
      // Images get a locked-down sandbox. PDFs cannot (it would stop the browser's PDF viewer), so they rely on the fixed type above plus nosniff.
      ...(item.mimeType.startsWith("image/") ? { "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" } : {}),
      "Cache-Control": "private, no-store",
    },
  });
}
