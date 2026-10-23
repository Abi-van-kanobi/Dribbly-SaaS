export const DEMO_EMAIL = "freja@ettuno.example";

/**
 * The demo workspace is one shared, writable sandbox filled with sample data. It is on by
 * default in development and OFF by default in production: set DEMO_ENABLED=true to expose
 * it deliberately.
 */
export function isDemoEnabled() {
  const flag = process.env.DEMO_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}
