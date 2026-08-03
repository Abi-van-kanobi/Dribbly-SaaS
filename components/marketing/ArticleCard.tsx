import Link from "next/link";
import type { Article } from "@/lib/content/insights";
import { articleTypeLabel } from "@/lib/content/insights";

const typeStyle: Record<Article["type"], { bg: string; color: string }> = {
  GUIDE: { bg: "#ede9fe", color: "#7c3aed" },
  BLOG: { bg: "#fce7f3", color: "#c026d3" },
  CASE_STUDY: { bg: "#ffedd5", color: "#ea580c" },
};

export function ArticleCard({ article }: { article: Article }) {
  const style = typeStyle[article.type];
  return (
    <Link href={`/insights/${article.slug}`} className="mkt-card p-5 flex flex-col gap-3 no-underline" style={{ color: "inherit" }}>
      <div className="flex items-center gap-2">
        <span className="mkt-tag" style={{ background: style.bg, color: style.color }}>
          {articleTypeLabel[article.type]}
        </span>
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
      <div className="text-[12px] mt-auto pt-1" style={{ color: "#a8a3b8" }}>
        {article.author} ·{" "}
        {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </Link>
  );
}
