import Link from "next/link";
import type { Article, ArticleType } from "@/lib/content/insights";
import { articleTypeLabel } from "@/lib/content/insights";

export const articleTypeStyle: Record<ArticleType, { bg: string; color: string }> = {
  BLOG: { bg: "#fce7f3", color: "#a21caf" },
  CASE_STUDY: { bg: "#ffedd5", color: "#c2410c" },
  PRODUCT_INSIGHT: { bg: "#ede9fe", color: "#6d28d9" },
};

export function ArticleCard({ article }: { article: Article }) {
  const style = articleTypeStyle[article.type];
  return (
    <Link href={`/resources/${article.slug}`} className="mkt-card p-5 flex flex-col gap-3 no-underline" style={{ color: "inherit" }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="mkt-tag" style={{ background: style.bg, color: style.color }}>
          {articleTypeLabel[article.type]}
        </span>
        {article.illustrative && <span className="mkt-tag mkt-tag-neutral">Example</span>}
        <span className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
          {article.readMinutes} min read
        </span>
      </div>
      <h3 className="text-[17px] m-0" style={{ lineHeight: 1.3, fontWeight: 700 }}>
        {article.title}
      </h3>
      <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
        {article.excerpt}
      </p>
      <div className="text-[12px] mt-auto pt-1" style={{ color: "var(--aurora-text-muted)" }}>
        {article.author} ·{" "}
        {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
      </div>
    </Link>
  );
}
