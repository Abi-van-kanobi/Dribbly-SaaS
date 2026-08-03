import Link from "next/link";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { articles, articleTypeLabel, type ArticleType } from "@/lib/content/insights";

const FILTERS: { key: ArticleType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "GUIDE", label: articleTypeLabel.GUIDE },
  { key: "BLOG", label: articleTypeLabel.BLOG },
  { key: "CASE_STUDY", label: articleTypeLabel.CASE_STUDY },
];

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = (type ?? "ALL") as ArticleType | "ALL";
  const filtered = activeType === "ALL" ? articles : articles.filter((a) => a.type === activeType);

  return (
    <main className="mkt max-w-[1200px] mx-auto px-6 py-20">
      <div className="text-[12px] uppercase mb-4 font-semibold" style={{ letterSpacing: ".12em", color: "var(--aurora-accent)" }}>
        Insights
      </div>
      <h1 className="text-[40px] mb-4" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
        Guides, case studies, and <span className="mkt-gradient-text">field notes</span>
      </h1>
      <p className="text-[15.5px] mb-10 max-w-[560px]" style={{ color: "var(--aurora-text-muted)" }}>
        Practical writing for talent managers and creator agencies — how other teams run their
        roster, and what to fix before it becomes a problem.
      </p>

      <div className="flex items-center gap-2 mb-10 flex-wrap">
        {FILTERS.map((f) => {
          const active = activeType === f.key;
          const href = f.key === "ALL" ? "/insights" : `/insights?type=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className="mkt-tag no-underline"
              style={
                active
                  ? { background: "var(--aurora-gradient-button)", color: "#fff", padding: "7px 15px", fontSize: 13 }
                  : { background: "var(--aurora-bg-tint)", color: "var(--aurora-text)", padding: "7px 15px", fontSize: 13 }
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
            Nothing in this category yet.
          </p>
        )}
      </div>
    </main>
  );
}
