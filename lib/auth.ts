/**
 * Edge-safe session token helpers (Web Crypto only — no Node `crypto`, no
 * Prisma) so this module can be imported from both middleware.ts (Edge
 * runtime) and server actions (Node runtime).
 */
export const SESSION_COOKIE = "drribly_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

const SESSION_SECRET = process.env.SESSION_SECRET || "drribly-dev-secret-change-me";
const encoder = new TextEncoder();

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "===".slice((padded.length + 3) % 4);
  const bin = atob(withPadding);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(managerId: string): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${managerId}.${expires}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${toBase64Url(encoder.encode(payload).buffer as ArrayBuffer)}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const payload = new TextDecoder().decode(fromBase64Url(payloadB64));
  const [managerId, expiresStr] = payload.split(".");
  if (!managerId || !expiresStr) return null;
  if (Date.now() > Number(expiresStr)) return null;

  const key = await getKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sigB64),
    encoder.encode(payload),
  );
  return valid ? managerId : null;
}
