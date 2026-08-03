import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { VideoSection } from "@/components/marketing/VideoSection";
import { articles, articleTypeLabel } from "@/lib/content/insights";
import {
  DashboardPreview,
  CreatorProfilePreview,
  CampaignTimelinePreview,
  PaymentTrackingPreview,
  NotesInContextPreview,
} from "@/components/marketing/WalkthroughPreviews";

const WALKTHROUGHS = [
  { line: "One dashboard, every answer.", Preview: DashboardPreview },
  { line: "Every creator, one profile.", Preview: CreatorProfilePreview },
  { line: "Every campaign, one timeline.", Preview: CampaignTimelinePreview },
  { line: "Every payment, tracked.", Preview: PaymentTrackingPreview },
  { line: "Every note, in context.", Preview: NotesInContextPreview },
];

const PROBLEM_LINES = [
  { text: "Two creators, a few spreadsheets, some DMs. Manageable.", gradient: null },
  { text: "Ten creators, five brands, three tools. Not manageable.", gradient: "Not manageable." },
  { text: "Deadlines slip. Payments get missed. Notes live in someone's head.", gradient: null },
  { text: "Growth shouldn't feel like this.", gradient: null },
];

export default function HomePage() {
  return (
    <main className="mkt">
      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div>
            <h1 className="text-[48px] mb-6" style={{ fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.08 }}>
              One workspace. <span className="mkt-gradient-text">Every creator you manage.</span>
            </h1>
            <p className="text-[17px] mb-9 max-w-[480px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
              Sheets, WhatsApp, email, Notion. Somewhere in that mess is your next deadline. Drrible
              pulls it into one place. Campaigns, payments, deliverables, creators. All visible. All
              current.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/login" className="mkt-btn mkt-btn-primary" style={{ padding: "13px 26px", fontSize: 15.5 }}>
                Start free
              </Link>
              <Link href="#video" className="mkt-btn mkt-btn-ghost" style={{ padding: "13px 26px", fontSize: 15.5 }}>
                See how it works
              </Link>
            </div>
          </div>

          {/* Floating product mockup */}
          <div className="relative">
            <div
              className="absolute -inset-10 rounded-full -z-10"
              style={{ background: "var(--aurora-gradient-soft)", filter: "blur(50px)", opacity: 0.9 }}
            />
            <div className="mkt-card p-6" style={{ boxShadow: "var(--aurora-shadow-lg)", transform: "rotate(-1.5deg)" }}>
              <div className="text-[12px] mb-3" style={{ color: "var(--aurora-text-muted)" }}>
                Today
              </div>
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ border: "1px solid var(--aurora-border)" }}>
                  <span className="w-4 h-4 rounded-[5px] flex-none" style={{ border: "1.5px solid #cfc9e0" }} />
                  <span className="text-[13px]">Approve Reel draft — Aanya × Nykaa</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "var(--aurora-bg-tint)" }}>
                  <span className="w-4 h-4 rounded-[5px] flex-none grid place-items-center" style={{ background: "var(--aurora-accent)" }} />
                  <span className="text-[13px]" style={{ color: "var(--aurora-text-muted)", textDecoration: "line-through" }}>
                    Confirm shoot slot — Mamaearth
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Active", value: "12" },
                  { label: "Approvals", value: "3" },
                  { label: "Due", value: "₹4.2L" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3" style={{ background: "var(--aurora-bg-tint)" }}>
                    <div className="text-[11px]" style={{ color: "var(--aurora-text-muted)" }}>
                      {s.label}
                    </div>
                    <div className="text-[19px] font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mkt-tint">
        <div className="max-w-[820px] mx-auto px-6 py-24 flex flex-col gap-7">
          {PROBLEM_LINES.map((line, i) => (
            <ScrollReveal key={line.text} delayMs={i * 120}>
              <p
                className="m-0"
                style={{
                  fontSize: i === 3 ? 30 : 26,
                  fontWeight: i === 3 ? 800 : 600,
                  lineHeight: 1.35,
                  letterSpacing: "-.01em",
                  color: "var(--aurora-text)",
                }}
              >
                {line.gradient
                  ? line.text
                      .split(line.gradient)
                      .flatMap((part, idx, arr) =>
                        idx < arr.length - 1 ? [part, <span key={idx} className="mkt-gradient-text">{line.gradient}</span>] : [part],
                      )
                  : line.text}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="max-w-[900px] mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-center text-[34px] mb-10" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          See <span className="mkt-gradient-text">Drrible</span> in action
        </h2>
        <VideoSection />
      </section>

      {/* WHAT CHANGES — the product tour */}
      <section id="product" className="max-w-[1100px] mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-center text-[34px] mb-16" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          What changes <span className="mkt-gradient-text">with Drrible</span>
        </h2>
        <div className="flex flex-col gap-24">
          {WALKTHROUGHS.map(({ line, Preview }, i) => {
            const reversed = i % 2 === 1;
            return (
              <ScrollReveal key={line}>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <div className={reversed ? "lg:text-right" : ""}>
                    <p className="text-[30px] m-0" style={{ fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.25 }}>
                      {line}
                    </p>
                  </div>
                  <div className="max-w-[440px] mx-auto w-full">
                    <Preview />
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* BUILT FOR AGENCIES — the services fit */}
      <section id="services" className="scroll-mt-20" style={{ background: "var(--aurora-gradient-soft)" }}>
        <div className="max-w-[760px] mx-auto px-6 py-24 text-center">
          <h2 className="text-[34px] mb-6" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
            Built for agencies, <span className="mkt-gradient-text">not enterprises</span>
          </h2>
          <p className="text-[18px] m-0 mb-2" style={{ color: "var(--aurora-text)", fontWeight: 500 }}>
            No CRM to configure. No onboarding call required.
          </p>
          <p className="text-[18px] m-0" style={{ color: "var(--aurora-text)", fontWeight: 500 }}>
            Add a creator. Create a campaign. Start today.
          </p>
        </div>
      </section>

      {/* STORIES — case-study spotlights pulled from Insights */}
      <section id="stories" className="max-w-[1100px] mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-center text-[34px] mb-3" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
          How agencies <span className="mkt-gradient-text">use Drrible</span>
        </h2>
        <p className="text-center text-[15.5px] mb-14 max-w-[520px] mx-auto" style={{ color: "var(--aurora-text-muted)" }}>
          Real workflows from talent managers and agencies running their roster on Drrible.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles
            .filter((a) => a.type === "CASE_STUDY")
            .map((story) => (
              <Link
                key={story.slug}
                href={`/insights/${story.slug}`}
                className="mkt-card p-7 no-underline flex flex-col gap-3"
                style={{ color: "inherit" }}
              >
                <span className="mkt-tag mkt-tag-warn" style={{ alignSelf: "flex-start" }}>
                  {articleTypeLabel[story.type]}
                </span>
                <h3 className="text-[20px] m-0" style={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {story.title}
                </h3>
                <p className="text-[14px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                  {story.excerpt}
                </p>
                <span className="text-[13.5px] flex items-center gap-1 mt-1" style={{ color: "var(--aurora-accent)", fontWeight: 500 }}>
                  Read the full story
                  <ArrowRight size={13} />
                </span>
              </Link>
            ))}
        </div>
      </section>

      {/* WHY NOW */}
      <section className="max-w-[760px] mx-auto px-6 py-24 text-center">
        <div className="text-[12px] uppercase mb-4 font-semibold" style={{ letterSpacing: ".12em", color: "var(--aurora-accent)" }}>
          Why now
        </div>
        <p className="text-[20px] m-0 mb-4" style={{ color: "var(--aurora-text)", lineHeight: 1.55 }}>
          India&apos;s creator economy is moving fast. Deals are getting bigger. Rosters are growing.
        </p>
        <p className="text-[20px] m-0 mb-4" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.55 }}>
          Most agencies are still running this on tools built for something else.
        </p>
        <p className="text-[20px] m-0" style={{ fontWeight: 700, lineHeight: 1.55 }}>
          Drrible is <span className="mkt-gradient-text">built for this, specifically.</span>
        </p>
      </section>

      {/* CLOSING CTA — the one full-page gradient moment */}
      <section className="w-full" style={{ background: "var(--aurora-gradient-primary)" }}>
        <div className="max-w-[760px] mx-auto px-6 py-24 text-center">
          <h2 className="text-[36px] mb-9" style={{ fontWeight: 800, letterSpacing: "-.02em", color: "#fff", lineHeight: 1.15 }}>
            Stop managing creators through five apps.
          </h2>
          <Link href="/login" className="mkt-btn mkt-btn-white" style={{ padding: "14px 28px", fontSize: 16 }}>
            Start free — no credit card
          </Link>
        </div>
      </section>
    </main>
  );
}
