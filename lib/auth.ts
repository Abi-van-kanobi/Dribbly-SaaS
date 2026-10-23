/**
 * Edge-safe signed session tokens (Web Crypto only: no Node `crypto`, no Prisma), so this
 * module can be imported from the request proxy and from server code alike.
 *
 * Two kinds of session exist:
 *  - "user":       a signed-in person with a workspace.
 *  - "onboarding": someone who proved their Google identity but has not yet accepted the
 *                  Terms and Privacy Policy. Nothing about them is stored in the database
 *                  until they do; their basic profile rides in this short-lived signed cookie.
 */
export const SESSION_COOKIE = "ettuno_session";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, seconds
export const ONBOARDING_SESSION_MAX_AGE = 60 * 60; // 1 hour, seconds

export type SessionData =
  | { kind: "user"; uid: string; wid: string }
  | { kind: "onboarding"; sub: string; email: string; name?: string; picture?: string };

function readSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    // Fail closed: a guessable signing key would let anyone forge a session.
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "ettuno-dev-secret-change-me";
}

const encoder = new TextEncoder();

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(readSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
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

export function sessionMaxAge(data: SessionData) {
  return data.kind === "user" ? USER_SESSION_MAX_AGE : ONBOARDING_SESSION_MAX_AGE;
}

export async function createSessionToken(data: SessionData): Promise<string> {
  const exp = Date.now() + sessionMaxAge(data) * 1000;
  const payload = JSON.stringify({ ...data, exp });
  const payloadBytes = encoder.encode(payload);
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionData | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  let payloadBytes: Uint8Array<ArrayBuffer>;
  try {
    payloadBytes = fromBase64Url(payloadB64) as Uint8Array<ArrayBuffer>;
  } catch {
    return null;
  }

  const key = await getKey();
  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(sigB64), payloadBytes);
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as SessionData & { exp?: number };
    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    if (parsed.kind === "user" && typeof parsed.uid === "string" && typeof parsed.wid === "string") {
      return { kind: "user", uid: parsed.uid, wid: parsed.wid };
    }
    if (parsed.kind === "onboarding" && typeof parsed.sub === "string" && typeof parsed.email === "string") {
      return { kind: "onboarding", sub: parsed.sub, email: parsed.email, name: parsed.name, picture: parsed.picture };
    }
    return null;
  } catch {
    return null;
  }
}
