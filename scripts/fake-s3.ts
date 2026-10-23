/**
 * A tiny in-memory stand-in for an S3-compatible service (which is what Cloudflare R2 is), used only by
 * `npm run verify:tenancy` so the real R2 driver can be exercised without real credentials.
 *
 * It speaks the parts of the S3 protocol the app uses: put, get (with Range), head, delete, copy,
 * list (paged, to prove pagination works) and bulk delete. It does NOT check signatures, so it cannot
 * tell you whether real R2 credentials or CORS rules are right; only a real bucket can.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";

export interface FakeS3 {
  url: string;
  objects: Map<string, { bytes: Buffer; contentType: string }>;
  listCalls: () => number;
  close: () => Promise<void>;
}

const xml = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>${body}`;
const unescapeXml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function startFakeS3(opts: { bucket: string; pageSize: number }): Promise<FakeS3> {
  const objects = new Map<string, { bytes: Buffer; contentType: string }>();
  let listCalls = 0;

  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks);

    const url = new URL(req.url ?? "/", "http://fake");
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const [bucket, ...rest] = parts;
    const key = rest.join("/");
    const send = (status: number, payload = "", headers: Record<string, string> = {}) => {
      res.writeHead(status, { "Content-Type": "application/xml", ...headers });
      res.end(payload);
    };
    const notFound = () => send(404, xml("<Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>"));

    if (bucket !== opts.bucket) return send(404, xml("<Error><Code>NoSuchBucket</Code></Error>"));

    // List (ListObjectsV2), paged by a fixed size so callers must follow the continuation token.
    if (req.method === "GET" && !key && url.searchParams.get("list-type") === "2") {
      listCalls++;
      const prefix = url.searchParams.get("prefix") ?? "";
      const after = url.searchParams.get("continuation-token") ?? "";
      const all = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort();
      const startAt = after ? all.findIndex((k) => k > after) : 0;
      const slice = startAt < 0 ? [] : all.slice(startAt, startAt + opts.pageSize);
      const truncated = startAt >= 0 && startAt + opts.pageSize < all.length;
      return send(
        200,
        xml(
          `<ListBucketResult><Name>${bucket}</Name><Prefix>${escapeXml(prefix)}</Prefix><KeyCount>${slice.length}</KeyCount><MaxKeys>${opts.pageSize}</MaxKeys>` +
            `<IsTruncated>${truncated}</IsTruncated>` +
            (truncated ? `<NextContinuationToken>${escapeXml(slice[slice.length - 1])}</NextContinuationToken>` : "") +
            slice.map((k) => `<Contents><Key>${escapeXml(k)}</Key><Size>${objects.get(k)!.bytes.length}</Size></Contents>`).join("") +
            `</ListBucketResult>`,
        ),
      );
    }

    // Bulk delete.
    if (req.method === "POST" && url.searchParams.has("delete")) {
      const keys = [...body.toString().matchAll(/<Key>([\s\S]*?)<\/Key>/g)].map((m) => unescapeXml(m[1]));
      for (const k of keys) objects.delete(k);
      return send(200, xml(`<DeleteResult>${keys.map((k) => `<Deleted><Key>${escapeXml(k)}</Key></Deleted>`).join("")}</DeleteResult>`));
    }

    if (!key) return send(400, xml("<Error><Code>InvalidRequest</Code></Error>"));

    if (req.method === "PUT") {
      const copySource = req.headers["x-amz-copy-source"];
      if (typeof copySource === "string") {
        const from = decodeURIComponent(copySource).replace(/^\//, "").split("/").slice(1).join("/");
        const src = objects.get(from);
        if (!src) return notFound();
        const replace = req.headers["x-amz-metadata-directive"] === "REPLACE";
        objects.set(key, { bytes: src.bytes, contentType: replace ? String(req.headers["content-type"] ?? src.contentType) : src.contentType });
        return send(200, xml(`<CopyObjectResult><ETag>"fake"</ETag></CopyObjectResult>`));
      }
      objects.set(key, { bytes: body, contentType: String(req.headers["content-type"] ?? "application/octet-stream") });
      return send(200, "", { ETag: '"fake"' });
    }

    if (req.method === "GET" || req.method === "HEAD") {
      const obj = objects.get(key);
      if (!obj) return req.method === "HEAD" ? send(404) : notFound();
      let status = 200;
      let bytes = obj.bytes;
      const range = /^bytes=(\d+)-(\d+)$/.exec(String(req.headers.range ?? ""));
      if (range) {
        status = 206;
        bytes = obj.bytes.subarray(Number(range[1]), Number(range[2]) + 1);
      }
      res.writeHead(status, { "Content-Type": obj.contentType, "Content-Length": String(req.method === "HEAD" ? obj.bytes.length : bytes.length), ETag: '"fake"' });
      return res.end(req.method === "HEAD" ? undefined : bytes);
    }

    if (req.method === "DELETE") {
      objects.delete(key);
      return send(204);
    }

    send(405);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    objects,
    listCalls: () => listCalls,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
