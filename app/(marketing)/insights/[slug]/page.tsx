import { redirect } from "next/navigation";

// Old URL, kept so existing links still work. Insights is now Resources.
// Retitled articles got new slugs; an unknown slug lands on /resources/<slug> and 404s there.
const RENAMED: Record<string, string> = {
  "nirvana-talent-invoice-turnaround": "invoice-turnaround-three-weeks-to-four-days",
  "d2c-audio-brand-influencer-program-scaling": "audio-brand-influencer-program-three-to-forty",
};

export default async function LegacyInsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/resources/${RENAMED[slug] ?? slug}`);
}
