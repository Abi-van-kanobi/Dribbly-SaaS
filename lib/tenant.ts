import { prisma } from "./prisma";

/**
 * Tenant isolation.
 *
 * `tenantDb(workspaceId)` returns a Prisma client that cannot see or touch any row outside
 * that workspace. Every read is filtered, every create is stamped, and every update or delete
 * is pinned to the workspace, so forgetting a `where: { workspaceId }` in a page or action
 * cannot leak data between customers.
 *
 * Rules:
 *  - App code gets its database access ONLY from requireWorkspace().db (see lib/session.ts).
 *  - Raw SQL ($queryRaw, $executeRaw) bypasses this guard. Never use it on tenant tables
 *    without an explicit workspaceId filter.
 *  - IDs that arrive from a form (brandId, creatorId, campaignId) must still be looked up
 *    through this client before use, so a foreign ID is rejected, not silently linked.
 */
const TENANT_MODELS = new Set([
  "Creator",
  "Brand",
  "Campaign",
  "Deliverable",
  "Invoice",
  "Task",
  "Note",
  "Contact",
  "AlignerItem",
  "Pin",
]);

type Args = Record<string, unknown>;

function withoutWorkspace(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const copy: Args = { ...(data as Args) };
  delete copy.workspaceId;
  return copy;
}

function stamp(data: unknown, workspaceId: string): unknown {
  if (Array.isArray(data)) return data.map((d) => ({ ...(d as Args), workspaceId }));
  return { ...(data as Args), workspaceId };
}

function scopeArgs(operation: string, model: string, input: unknown, workspaceId: string): Args {
  const args: Args = { ...((input as Args | undefined) ?? {}) };

  switch (operation) {
    // Filtered reads and bulk writes: AND our filter onto whatever the caller asked for.
    case "findMany":
    case "findFirst":
    case "findFirstOrThrow":
    case "count":
    case "aggregate":
    case "groupBy":
    case "deleteMany":
      args.where = { AND: [args.where ?? {}, { workspaceId }] };
      return args;
    case "updateMany":
      args.where = { AND: [args.where ?? {}, { workspaceId }] };
      args.data = withoutWorkspace(args.data);
      return args;

    // Unique lookups and single writes: pin the unique selector to the workspace.
    case "findUnique":
    case "findUniqueOrThrow":
    case "delete":
      args.where = { ...(args.where as Args), workspaceId };
      return args;
    case "update":
      args.where = { ...(args.where as Args), workspaceId };
      args.data = withoutWorkspace(args.data);
      return args;

    // Creates: the workspace comes from the session, never from the caller.
    case "create":
      args.data = stamp(args.data, workspaceId);
      return args;
    case "createMany":
    case "createManyAndReturn":
      args.data = stamp(args.data, workspaceId);
      return args;
    case "upsert":
      args.where = { ...(args.where as Args), workspaceId };
      args.create = stamp(args.create, workspaceId);
      args.update = withoutWorkspace(args.update);
      return args;

    default:
      // Fail closed: an operation we have not reasoned about does not run.
      throw new Error(`tenantDb: operation "${operation}" on ${model} is not allowed`);
  }
}

export function tenantDb(workspaceId: string) {
  if (!workspaceId) throw new Error("tenantDb requires a workspaceId");
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);
          return query(scopeArgs(operation, model, args, workspaceId) as typeof args);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;
