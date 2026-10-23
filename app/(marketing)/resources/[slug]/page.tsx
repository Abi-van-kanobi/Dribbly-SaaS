import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard, articleTypeStyle } from "@/components/marketing/ArticleCard";
import { articles, articleTypeLabel, getArticle } from "@/lib/content/insights";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? `${article.title} · Ettuno` : "Resources · Ettuno", description: article?.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const sameType = articles.filter((a) => a.slug !== article.slug && a.type === article.type);
  const others = articles.filter((a) => a.slug !== article.slug && a.type !== article.type);
  const related = [...sameType, ...others].slice(0, 3);
  const style = articleTypeStyle[article.type];

  return (
    <main className="mkt max-w-[760px] mx-auto px-6 py-20">
      <Link href="/resources" className="mkt-underline-hover inline-flex items-center gap-1.5 text-[13.5px] mb-10">
        <ArrowLeft size={14} />
        All resources
      </Link>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
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

      <div className="text-[13.5px] mb-8" style={{ color: "var(--aurora-text-muted)" }}>
        {article.author} ·{" "}
        {new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
      </div>

      {article.illustrative && (
        <div role="note" className="mkt-card p-4 mb-8 text-[13.5px]" style={{ background: "var(--aurora-bg-tint)", lineHeight: 1.55 }}>
          <b>Example scenario.</b> This is an illustration based on common agency workflows. It is not a real customer
          and the numbers are not measured results.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {article.body.map((paragraph, i) => (
          <p key={i} className="text-[16.5px] m-0" style={{ color: "var(--aurora-text)", lineHeight: 1.75 }}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mkt-card p-6 mt-14 flex items-center justify-between gap-4 flex-wrap" style={{ background: "var(--aurora-bg-tint)" }}>
        <p className="m-0 text-[16px]" style={{ fontWeight: 600 }}>
          Run your creator work in one place.
        </p>
        <Link href="/login" className="mkt-btn mkt-btn-primary">
          Start free
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-16 pt-12" style={{ borderTop: "1px solid var(--aurora-border)" }}>
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
