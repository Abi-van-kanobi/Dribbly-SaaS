/**
 * Single source of truth for the facts the Privacy Policy and Terms refer to.
 * Anything in [SQUARE BRACKETS] is a placeholder that must be filled in before launch.
 */
export const BRAND_NAME = "Ettuno";

// Bump TERMS_VERSION whenever the Terms or Privacy Policy change in a way users must re-accept.
export const TERMS_VERSION = "2026-10-draft-2";
export const LEGAL_LAST_UPDATED = "10 October 2026";

// "draft" shows a visible "pending legal review" banner on both pages.
// Change to "reviewed" only after a lawyer has signed off on the final text.
export const LEGAL_STATUS: "draft" | "reviewed" = "draft";

export const COMPANY_NAME = "[COMPANY LEGAL NAME]";
export const COMPANY_ADDRESS = "[REGISTERED ADDRESS]";
export const PRIVACY_EMAIL = "[PRIVACY CONTACT EMAIL]";
export const GOVERNING_LAW = "[GOVERNING LAW AND COURTS]";
export const LIABILITY_CAP = "[LIABILITY CAP, e.g. fees paid in the last 12 months]";
export const RETENTION_AFTER_DELETE = "[NUMBER] days";
