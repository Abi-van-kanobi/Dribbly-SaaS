import { redirect } from "next/navigation";
import { isArticleType } from "@/lib/content/insights";

// Old URL, kept so existing links still work. Insights is now Resources.
export default async function LegacyInsightsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  redirect(isArticleType(type) ? `/resources?type=${type}` : "/resources");
}
