import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { articles, articleTypePlural, isArticleType, type ArticleType } from "@/lib/content/insights";

export const metadata: Metadata = { title: "Resources · Ettuno" };

const TABS: { key: ArticleType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BLOG", label: articleTypePlural.BLOG },
  { key: "CASE_STUDY", label: articleTypePlural.CASE_STUDY },
  { key: "PRODUCT_INSIGHT", label: articleTypePlural.PRODUCT_INSIGHT },
];

const BLURB: Record<ArticleType | "ALL", string> = {
  ALL: "Practical writing for talent managers and creators, plus the thinking behind the product.",
  BLOG: "Short, practical posts on running creator work.",
  CASE_STUDY: "How teams run their work in one place. These are example scenarios, not real customers.",
  PRODUCT_INSIGHT: "Why Ettuno works the way it does.",
};

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const active: ArticleType | "ALL" = isArticleType(type) ? type : "ALL";
  const filtered = (active === "ALL" ? articles : articles.filter((a) => a.type === active)).toSorted((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <main className="mkt max-w-[1200px] mx-auto px-6 py-20">
      <h1 className="text-[40px] mb-4" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
        Resources
      </h1>
      <p className="text-[16px] mb-10 max-w-[560px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
        {BLURB[active]}
      </p>

      <nav aria-label="Resource types" className="flex items-center gap-2 mb-10 flex-wrap">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "ALL" ? "/resources" : `/resources?type=${t.key}`}
              aria-current={isActive ? "page" : undefined}
              className="mkt-tag no-underline"
              style={
                isActive
                  ? { background: "var(--aurora-gradient-button)", color: "#fff", padding: "7px 15px", fontSize: 13 }
                  : { background: "var(--aurora-bg-tint)", color: "var(--aurora-text)", padding: "7px 15px", fontSize: 13 }
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </main>
  );
}
