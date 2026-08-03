import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { articles, articleTypeLabel, getArticle, type Article } from "@/lib/content/insights";

const typeStyle: Record<Article["type"], { bg: string; color: string }> = {
  GUIDE: { bg: "#ede9fe", color: "#7c3aed" },
  BLOG: { bg: "#fce7f3", color: "#c026d3" },
  CASE_STUDY: { bg: "#ffedd5", color: "#ea580c" },
};

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const style = typeStyle[article.type];

  return (
    <main className="mkt max-w-[760px] mx-auto px-6 py-20">
      <Link href="/insights" className="mkt-underline-hover inline-flex items-center gap-1.5 text-[13.5px] mb-10">
        <ArrowLeft size={14} />
        All insights
      </Link>

      <div className="flex items-center gap-2 mb-5">
        <span className="mkt-tag" style={{ background: style.bg, color: style.color }}>
          {articleTypeLabel[article.type]}
        </span>
        <span className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
          {article.readMinutes} min read
        </span>
      </div>

      <h1 className="text-[38px] mb-5" style={{ fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
        {article.title}
      </h1>

      <div className="text-[13.5px] mb-12" style={{ color: "var(--aurora-text-muted)" }}>
        {article.author} ·{" "}
        {new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>

      <div className="flex flex-col gap-5">
        {article.body.map((paragraph, i) => (
          <p key={i} className="text-[16.5px] m-0" style={{ color: "var(--aurora-text)", lineHeight: 1.75 }}>
            {paragraph}
          </p>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-20 pt-12" style={{ borderTop: "1px solid var(--aurora-border)" }}>
          <h2 className="text-[22px] mb-6" style={{ fontWeight: 700 }}>
            Keep reading
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
