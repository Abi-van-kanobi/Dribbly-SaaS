import type { AlignerItem } from "@prisma/client";
import { MAX_FILE_BYTES, safeFileName, sniffFile, titleFromFile, workspaceLimitBytes, type SniffedFile } from "@/lib/aligner";
import { finalKeyFromPending, newFileKey, pendingKeyBelongsTo, type FileStorage } from "@/lib/storage";
import type { TenantDb } from "@/lib/tenant";

/**
 * The database-plus-storage steps of the Aligner, kept apart from routes and server actions so they
 * can be tested directly (npm run verify:tenancy does). `db` must be the workspace-scoped client.
 */

export type SaveResult = { ok: true; item: AlignerItem } | { ok: false; error: string };

/** Bytes this workspace already stores. */
export async function usedBytes(db: TenantDb) {
  const sum = await db.alignerItem.aggregate({ _sum: { sizeBytes: true } });
  return sum._sum.sizeBytes ?? 0;
}

export async function hasRoomFor(db: TenantDb, extraBytes: number) {
  return (await usedBytes(db)) + extraBytes <= workspaceLimitBytes();
}

const OVER_LIMIT = "This workspace has reached its file storage limit. Delete some files to add more.";

async function createFileRow(args: {
  db: TenantDb;
  workspaceId: string;
  userId: string;
  key: string;
  name: string;
  sniffed: SniffedFile;
  size: number;
  campaignId?: string | null;
}) {
  const { db, workspaceId, userId, key, sniffed, size, campaignId } = args;
  const fileName = safeFileName(args.name, sniffed.mime);
  const now = new Date();
  return db.alignerItem.create({
    data: {
      kind: sniffed.kind,
      status: campaignId ? "FILED" : "INBOX",
      filedAt: campaignId ? now : null,
      title: titleFromFile(fileName, now),
      fileKey: key,
      fileName,
      mimeType: sniffed.mime,
      sizeBytes: size,
      addedById: userId,
      campaignId: campaignId ?? null,
      workspaceId,
    },
  });
}

/** Server-side upload: the bytes arrive here (local development, and any host without a size cap). */
export async function saveUploadedFile(args: {
  db: TenantDb;
  storage: FileStorage;
  workspaceId: string;
  userId: string;
  name: string;
  bytes: Buffer;
  campaignId?: string | null;
}): Promise<SaveResult> {
  const { db, storage, workspaceId, userId, name, bytes, campaignId } = args;

  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, error: "Files can be up to 10 MB." };
  const sniffed = sniffFile(bytes);
  if (!sniffed) return { ok: false, error: "Only images (PNG, JPG, GIF, WebP) and PDFs are supported." };
  if (!(await hasRoomFor(db, bytes.length))) return { ok: false, error: OVER_LIMIT };

  const key = newFileKey(workspaceId);
  await storage.put(key, bytes, sniffed.mime);
  try {
    const item = await createFileRow({ db, workspaceId, userId, key, name, sniffed, size: bytes.length, campaignId });
    return { ok: true, item };
  } catch (e) {
    // Never leave an orphaned file behind a failed insert.
    await storage.delete(key).catch(() => {});
    throw e;
  }
}

/**
 * Accepts a file the browser uploaded straight to the bucket. The object is checked before it becomes
 * real: it must belong to this workspace, be a sensible size, and really be an allowed type (judged
 * from its first bytes, not from what the browser said). Anything that fails is deleted.
 */
export async function finalizeDirectUpload(args: {
  db: TenantDb;
  storage: FileStorage;
  workspaceId: string;
  userId: string;
  pendingKey: string;
  name: string;
  campaignId?: string | null;
}): Promise<SaveResult> {
  const { db, storage, workspaceId, userId, pendingKey, name, campaignId } = args;
  const direct = storage.direct;
  if (!direct) return { ok: false, error: "Direct uploads are not available here." };
  if (!pendingKeyBelongsTo(pendingKey, workspaceId)) return { ok: false, error: "That upload was not recognised." };

  const seen = await direct.inspect(pendingKey);
  if (!seen) return { ok: false, error: "The upload did not arrive, or it expired. Please try again." };

  const reject = async (error: string): Promise<SaveResult> => {
    await direct.discard(pendingKey).catch(() => {});
    return { ok: false, error };
  };

  if (seen.size === 0) return reject("The file is empty.");
  if (seen.size > MAX_FILE_BYTES) return reject("Files can be up to 10 MB.");
  const sniffed = sniffFile(seen.head);
  if (!sniffed) return reject("Only images (PNG, JPG, GIF, WebP) and PDFs are supported.");
  if (!(await hasRoomFor(db, seen.size))) return reject(OVER_LIMIT);

  const finalKey = finalKeyFromPending(pendingKey);
  await direct.promote(pendingKey, finalKey, sniffed.mime);
  try {
    const item = await createFileRow({ db, workspaceId, userId, key: finalKey, name, sniffed, size: seen.size, campaignId });
    return { ok: true, item };
  } catch (e) {
    await storage.delete(finalKey).catch(() => {});
    throw e;
  }
}

/** Deletes the record and its file. Returns false if the item is not in this workspace. */
export async function removeItem(args: { db: TenantDb; storage: FileStorage | null; id: string }) {
  const item = await args.db.alignerItem.findUnique({ where: { id: args.id } });
  if (!item) return false;
  await args.db.alignerItem.delete({ where: { id: item.id } });
  if (item.fileKey && args.storage) await args.storage.delete(item.fileKey);
  return true;
}
