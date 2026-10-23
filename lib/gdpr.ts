import type { Prisma, PrismaClient } from "@prisma/client";
import type { FileStorage } from "@/lib/storage";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Hard-deletes everything a workspace owns in the database. Order matters: children go before the
 * records they point at, because the relations between business tables do not cascade.
 * Uploaded files are not in the database; see deleteWorkspaceFiles.
 */
export async function deleteWorkspaceData(db: Db, workspaceId: string) {
  const where = { workspaceId };
  await db.pin.deleteMany({ where });
  await db.alignerItem.deleteMany({ where });
  await db.invoice.deleteMany({ where });
  await db.deliverable.deleteMany({ where });
  await db.task.deleteMany({ where });
  await db.note.deleteMany({ where });
  await db.contact.deleteMany({ where });
  await db.campaign.deleteMany({ where });
  await db.brand.deleteMany({ where });
  await db.creator.deleteMany({ where });
}

/**
 * Removes every uploaded file a workspace owns by deleting its whole storage folder, so a file is
 * gone even if its database row was already lost.
 */
export async function deleteWorkspaceFiles(storage: FileStorage | null, workspaceId: string) {
  if (storage) await storage.deleteWorkspace(workspaceId);
}

/**
 * Right to erasure. Removes the person, and every workspace they are the only member of,
 * with all of its records and files. The database part is all-or-nothing. Files are removed after
 * it commits; if that step fails the error is thrown so it is never silently ignored.
 */
export async function deleteAccount(prisma: PrismaClient, userId: string, storage: FileStorage | null = null) {
  const erasedWorkspaceIds = await prisma.$transaction(async (tx) => {
    const memberships = await tx.membership.findMany({
      where: { userId },
      include: { workspace: { include: { _count: { select: { memberships: true } } } } },
    });

    const erased: string[] = [];
    for (const m of memberships) {
      if (m.workspace._count.memberships <= 1) {
        await deleteWorkspaceData(tx, m.workspaceId);
        await tx.workspace.delete({ where: { id: m.workspaceId } });
        erased.push(m.workspaceId);
      }
    }
    // Memberships in shared workspaces go with the user (cascade); the workspace stays.
    await tx.user.delete({ where: { id: userId } });
    return erased;
  });

  for (const workspaceId of erasedWorkspaceIds) await deleteWorkspaceFiles(storage, workspaceId);
}

/** Embed files in the export up to this total; beyond it the export lists them with a download path. */
const EXPORT_EMBED_LIMIT_BYTES = 100 * 1024 * 1024;

/**
 * Right of access and portability. Everything we hold about this person and their workspace,
 * as one JSON document. Uploaded files are included inside it (base64) up to a size limit.
 */
export async function exportAccountData(
  prisma: PrismaClient,
  userId: string,
  workspaceId: string,
  storage: FileStorage | null = null,
) {
  const where = { workspaceId };
  const [user, workspace, creators, brands, campaigns, deliverables, invoices, tasks, notes, contacts, alignerRows, pins] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
      prisma.creator.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.brand.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.campaign.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.deliverable.findMany({ where, orderBy: { order: "asc" } }),
      prisma.invoice.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.task.findMany({ where, orderBy: { order: "asc" } }),
      prisma.note.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.contact.findMany({ where }),
      prisma.alignerItem.findMany({ where, orderBy: { createdAt: "asc" } }),
      prisma.pin.findMany({ where, orderBy: { createdAt: "asc" } }),
    ]);

  let embedded = 0;
  const alignerItems = [];
  for (const { fileKey, ...item } of alignerRows) {
    if (!fileKey) {
      alignerItems.push(item);
      continue;
    }
    const size = item.sizeBytes ?? 0;
    if (storage && embedded + size <= EXPORT_EMBED_LIMIT_BYTES) {
      const bytes = await storage.get(fileKey);
      if (bytes) {
        embedded += bytes.length;
        alignerItems.push({ ...item, file: { embedded: true, contentBase64: bytes.toString("base64") } });
        continue;
      }
    }
    alignerItems.push({
      ...item,
      file: { embedded: false, downloadPath: `/app/aligner/file/${item.id}`, note: "Too large to embed. Download it from this path while signed in." },
    });
  }

  return {
    format: "ettuno-export-v1",
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      googleSub: user.googleSub,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      termsAcceptedAt: user.termsAcceptedAt,
      termsVersion: user.termsVersion,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      currency: workspace.currency,
      timezone: workspace.timezone,
      country: workspace.country,
      createdAt: workspace.createdAt,
    },
    data: { creators, brands, campaigns, deliverables, invoices, tasks, notes, contacts, alignerItems, pins },
  };
}
