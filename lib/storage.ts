import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * File storage for the Work Aligner.
 *
 * Callers use only the FileStorage interface, so the provider can change without touching the rest
 * of the app. Two drivers:
 *   - "r2"    Cloudflare R2 (S3-compatible). The production driver.
 *   - "local" a folder on disk, for development. Production refuses it unless STORAGE_DRIVER=local
 *             is set on purpose, because a serverless host has no durable disk.
 *
 * Object layout (the bucket is private; nothing here is ever public):
 *   <workspaceId>/<uuid>            a finished file
 *   pending/<workspaceId>/<uuid>    a browser upload that has not been checked yet (see DirectUpload).
 *                                   A bucket lifecycle rule deletes anything left under pending/ after a day.
 * Everything for one workspace sits under its own prefixes, which is what lets account deletion remove
 * a whole workspace's files even if a database row was lost.
 */

export interface OpenedObject {
  body: Uint8Array<ArrayBuffer> | ReadableStream<Uint8Array>;
  size: number | null;
}

/**
 * Browser-to-bucket uploads. Serverless hosts cap request bodies at a few MB, so for R2 the browser
 * uploads straight to the bucket with a short-lived signed URL, then asks our server to inspect and
 * accept the object. Nothing becomes a real file until `promote` runs after the checks pass.
 */
export interface DirectUpload {
  presign(pendingKey: string, opts: { contentType: string; size: number; expiresInSeconds?: number }): Promise<{ url: string; headers: Record<string, string> }>;
  /** Size and first bytes of an uploaded object, or null if nothing is there. */
  inspect(pendingKey: string): Promise<{ size: number; head: Buffer } | null>;
  promote(pendingKey: string, finalKey: string, contentType: string): Promise<void>;
  discard(pendingKey: string): Promise<void>;
}

export interface FileStorage {
  put(key: string, bytes: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  /** For serving a file to a browser. Large objects stream instead of being held in memory. */
  open(key: string): Promise<OpenedObject | null>;
  delete(key: string): Promise<void>;
  deleteWorkspace(workspaceId: string): Promise<void>;
  readonly direct: DirectUpload | null;
}

// ---------------------------------------------------------------- keys

const WORKSPACE_RE = /^[A-Za-z0-9_-]{8,64}$/;
const KEY_RE = /^[A-Za-z0-9_-]{8,64}\/[0-9a-f-]{36}$/;
const PENDING_RE = /^pending\/[A-Za-z0-9_-]{8,64}\/[0-9a-f-]{36}$/;

export function newFileKey(workspaceId: string) {
  if (!WORKSPACE_RE.test(workspaceId)) throw new Error("storage: bad workspace id");
  return `${workspaceId}/${randomUUID()}`;
}

export function newPendingKey(workspaceId: string) {
  if (!WORKSPACE_RE.test(workspaceId)) throw new Error("storage: bad workspace id");
  return `pending/${workspaceId}/${randomUUID()}`;
}

/** True only for a well-formed pending key that belongs to this workspace. */
export function pendingKeyBelongsTo(key: string, workspaceId: string) {
  return PENDING_RE.test(key) && key.startsWith(`pending/${workspaceId}/`);
}

export function finalKeyFromPending(pendingKey: string) {
  if (!PENDING_RE.test(pendingKey)) throw new Error("storage: bad pending key");
  return pendingKey.slice("pending/".length);
}

function assertKey(key: string) {
  if (!KEY_RE.test(key) && !PENDING_RE.test(key)) throw new Error("storage: bad key");
}

// ---------------------------------------------------------------- local disk (development)

class LocalDiskStorage implements FileStorage {
  readonly direct = null;

  constructor(private readonly root: string) {}

  private pathFor(key: string) {
    assertKey(key);
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) throw new Error("storage: bad key");
    return full;
  }

  async put(key: string, bytes: Buffer) {
    const file = this.pathFor(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  async get(key: string) {
    try {
      return await readFile(this.pathFor(key));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async open(key: string) {
    const bytes = await this.get(key);
    return bytes ? { body: new Uint8Array(bytes), size: bytes.length } : null;
  }

  async delete(key: string) {
    await rm(this.pathFor(key), { force: true });
  }

  async deleteWorkspace(workspaceId: string) {
    if (!WORKSPACE_RE.test(workspaceId)) throw new Error("storage: bad workspace id");
    await rm(path.resolve(this.root, workspaceId), { recursive: true, force: true });
    await rm(path.resolve(this.root, "pending", workspaceId), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- Cloudflare R2

interface R2Config {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function isNotFound(e: unknown) {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err?.name === "NoSuchKey" || err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404;
}

/** Reads R2 settings from the environment, or null if any are missing. */
function r2ConfigFromEnv(): R2Config | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_JURISDICTION, R2_ENDPOINT } = process.env;
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;
  // A jurisdiction (eu, fedramp) is fixed when the bucket is created and has its own address.
  const endpoint =
    R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}${R2_JURISDICTION ? `.${R2_JURISDICTION}` : ""}.r2.cloudflarestorage.com` : "");
  if (!endpoint) return null;
  return { bucket: R2_BUCKET, endpoint, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY };
}

class R2Storage implements FileStorage {
  private readonly client: S3Client;
  readonly direct: DirectUpload;

  constructor(private readonly cfg: R2Config) {
    this.client = new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      forcePathStyle: true,
      // Newer SDK versions add checksum trailers by default; only send them where the API requires one.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    this.direct = this.buildDirect();
  }

  async put(key: string, bytes: Buffer, contentType?: string) {
    assertKey(key);
    await this.client.send(new PutObjectCommand({ Bucket: this.cfg.bucket, Key: key, Body: bytes, ContentType: contentType }));
  }

  async get(key: string) {
    assertKey(key);
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async open(key: string) {
    assertKey(key);
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      return { body: res.Body!.transformToWebStream() as ReadableStream<Uint8Array>, size: res.ContentLength ?? null };
    } catch (e) {
      if (isNotFound(e)) return null;
      throw e;
    }
  }

  async delete(key: string) {
    assertKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
  }

  async deleteWorkspace(workspaceId: string) {
    if (!WORKSPACE_RE.test(workspaceId)) throw new Error("storage: bad workspace id");
    for (const prefix of [`${workspaceId}/`, `pending/${workspaceId}/`]) {
      let token: string | undefined;
      do {
        const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.cfg.bucket, Prefix: prefix, ContinuationToken: token }));
        const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
        if (keys.length) {
          const res = await this.client.send(new DeleteObjectsCommand({ Bucket: this.cfg.bucket, Delete: { Objects: keys, Quiet: true } }));
          // Erasure must never half-succeed silently.
          if (res.Errors?.length) throw new Error(`storage: could not delete ${res.Errors.length} object(s) for workspace`);
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    }
  }

  private buildDirect(): DirectUpload {
    const { client } = this;
    const Bucket = this.cfg.bucket;
    return {
      async presign(pendingKey, { contentType, size, expiresInSeconds = 300 }) {
        assertKey(pendingKey);
        const command = new PutObjectCommand({ Bucket, Key: pendingKey, ContentType: contentType, ContentLength: size });
        // Sign the type and the exact length, so the signed URL cannot be used to upload anything bigger.
        const url = await getSignedUrl(client, command, {
          expiresIn: expiresInSeconds,
          signableHeaders: new Set(["content-type", "content-length"]),
        });
        return { url, headers: { "Content-Type": contentType } };
      },

      async inspect(pendingKey) {
        assertKey(pendingKey);
        try {
          const head = await client.send(new HeadObjectCommand({ Bucket, Key: pendingKey }));
          const size = head.ContentLength ?? 0;
          if (size === 0) return { size, head: Buffer.alloc(0) };
          const part = await client.send(new GetObjectCommand({ Bucket, Key: pendingKey, Range: "bytes=0-15" }));
          return { size, head: Buffer.from(await part.Body!.transformToByteArray()) };
        } catch (e) {
          if (isNotFound(e)) return null;
          throw e;
        }
      },

      async promote(pendingKey, finalKey, contentType) {
        assertKey(pendingKey);
        assertKey(finalKey);
        // Copy under the real, sniffed type (not whatever the browser claimed), then drop the pending copy.
        await client.send(
          new CopyObjectCommand({ Bucket, Key: finalKey, CopySource: `${Bucket}/${pendingKey}`, ContentType: contentType, MetadataDirective: "REPLACE" }),
        );
        await client.send(new DeleteObjectCommand({ Bucket, Key: pendingKey }));
      },

      async discard(pendingKey) {
        assertKey(pendingKey);
        await client.send(new DeleteObjectCommand({ Bucket, Key: pendingKey }));
      },
    };
  }
}

// ---------------------------------------------------------------- choosing a driver

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not configured for this environment.");
  }
}

type DriverName = "r2" | "local" | null;

function chosenDriver(): DriverName {
  const explicit = process.env.STORAGE_DRIVER;
  if (explicit === "r2") return r2ConfigFromEnv() ? "r2" : null;
  if (explicit === "local") return "local";
  // Nothing chosen: local disk is fine for development, never for production.
  return process.env.NODE_ENV !== "production" ? "local" : null;
}

/** True when uploads can work here. Notes and links never need storage. */
export function isStorageConfigured() {
  return chosenDriver() !== null;
}

let r2Cache: { key: string; storage: R2Storage } | null = null;

export function getStorage(): FileStorage {
  const driver = chosenDriver();
  if (driver === "r2") {
    const cfg = r2ConfigFromEnv()!;
    const key = JSON.stringify(cfg);
    if (r2Cache?.key !== key) r2Cache = { key, storage: new R2Storage(cfg) };
    return r2Cache.storage;
  }
  if (driver === "local") return new LocalDiskStorage(process.env.STORAGE_DIR ?? path.join(process.cwd(), ".storage"));
  throw new StorageNotConfiguredError();
}
