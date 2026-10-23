import { Google } from "arctic";

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * The public address of this app. In production set APP_URL (e.g. https://app.example.com)
 * so the OAuth redirect URI is exact; locally it falls back to the address of the request.
 */
export function appOrigin(requestOrigin: string) {
  return (process.env.APP_URL ?? requestOrigin).replace(/\/$/, "");
}

export const GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";

export function googleClient(origin: string) {
  return new Google(
    process.env.GOOGLE_CLIENT_ID ?? "",
    process.env.GOOGLE_CLIENT_SECRET ?? "",
    `${origin}${GOOGLE_CALLBACK_PATH}`,
  );
}
