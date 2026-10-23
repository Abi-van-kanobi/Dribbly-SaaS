/**
 * Pricing tiers. Prices are deliberately blank. Fill `price` (and optionally `period`) to show them;
 * leave empty and the card shows an empty price slot.
 * Items marked "(coming)" are planned, not live. Remove the marker when the feature ships.
 */
export interface Tier {
  name: string;
  forWho: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

export const tiers: Tier[] = [
  {
    name: "Creator",
    forWho: "For one creator running their own brand deals.",
    price: "",
    period: "",
    features: [
      "Your campaigns and deliverables",
      "Deadlines and approvals in one view",
      "Invoice and payment tracking",
      "Notes and contacts",
      "Download or delete your data any time",
    ],
    cta: "Get started",
  },
  {
    name: "Manager",
    forWho: "For a talent manager with a roster.",
    price: "",
    period: "",
    features: [
      "Everything in Creator",
      "A profile for every creator on your roster",
      "A timeline for every campaign",
      "One Today view across the whole roster",
      "Google Sheets import (coming)",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Agency",
    forWho: "For teams running many creators and brands.",
    price: "",
    period: "",
    features: [
      "Everything in Manager",
      "Team members in one workspace (coming)",
      "Google Docs linked to campaigns (coming)",
    ],
    cta: "Get started",
  },
];
