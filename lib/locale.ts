/**
 * Launch currencies (from the discovery questionnaire): USD, GBP, EUR, INR, AED.
 * Anything else falls back to USD until it is added here.
 */
export const LAUNCH_CURRENCIES = ["USD", "GBP", "EUR", "INR", "AED"] as const;
export type LaunchCurrency = (typeof LAUNCH_CURRENCIES)[number];

const EURO_COUNTRIES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

export function currencyForCountry(country: string | null | undefined): LaunchCurrency {
  const cc = (country ?? "").toUpperCase();
  if (cc === "IN") return "INR";
  if (cc === "GB") return "GBP";
  if (cc === "AE") return "AED";
  if (EURO_COUNTRIES.has(cc)) return "EUR";
  return "USD";
}

export function isLaunchCurrency(value: string): value is LaunchCurrency {
  return (LAUNCH_CURRENCIES as readonly string[]).includes(value);
}

/** True for a real IANA time zone name such as "Asia/Kolkata". */
export function isValidTimeZone(value: string) {
  if (!value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isCountryCode(value: string) {
  return /^[A-Z]{2}$/.test(value);
}
