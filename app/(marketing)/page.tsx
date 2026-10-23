import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { articles } from "@/lib/content/insights";
import {
  DashboardPreview,
  CreatorProfilePreview,
  CampaignTimelinePreview,
  PaymentTrackingPreview,
  NotesInContextPreview,
} from "@/components/marketing/WalkthroughPreviews";

/** Chapter one: the mess. Short lines, one beat each. */
const MESS = [
  "Meet Freja. She manages ten creators.",
  "Monday, 9:00. She opens a sheet. Then WhatsApp. Then email. Then Notion.",
  "A brand asks: has the reel been approved? She scrolls for ten minutes to find out.",
  "A payment is three days late. Nobody noticed.",
];

/** Chapter two: the day with Ettuno. Each beat shows the screen it talks about. */
const DAY = [
  {
    time: "9:00",
    line: "She opens Ettuno. Her day is already listed.",
    detail: "Two approvals waiting. Five tasks due. One payment late.",
    Preview: DashboardPreview,
  },
  {
    time: "9:10",
    line: "A brand asks about the reel. She opens the campaign.",
    detail: "Every deliverable, date and status is on one timeline. She answers in a minute.",
    Preview: CampaignTimelinePreview,
  },
  {
    time: "11:30",
    line: "A creator asks what she is owed. Freja checks the payment.",
    detail: "Paid, due or late. Tied to the campaign. She tracks it, she never moves it.",
    Preview: PaymentTrackingPreview,
  },
  {
    time: "2:00",
    line: "She prepares for a call with one creator.",
    detail: "One profile: active work, earnings, and the notes from last time.",
    Preview: CreatorProfilePreview,
  },
  {
    time: "5:00",
    line: "She leaves a note for the new hire, right on the campaign.",
    detail: "Tomorrow, the answer is where the work is. Nobody has to ask.",
    Preview: NotesInContextPreview,
  },
];

export default function HomePage() {
  const stories = articles.filter((a) => a.type === "CASE_STUDY").slice(0, 3);

  return (
    <main className="mkt">
      {/* HERO */}
      <section className="max-w-[900px] mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-[50px] mb-6" style={{ fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.08, textWrap: "balance" }}>
          One workspace. <span className="mkt-gradient-text">Every creator you manage.</span>
        </h1>
        <p className="text-[18px] mx-auto mb-9 max-w-[520px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
          Campaigns, payments, deadlines and creators. All in one place. All current.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="mkt-btn mkt-btn-primary" style={{ padding: "13px 26px", fontSize: 15.5 }}>
            Start free
          </Link>
          <Link href="/solutions" className="mkt-btn mkt-btn-ghost" style={{ padding: "13px 26px", fontSize: 15.5 }}>
            See what it does
          </Link>
        </div>
        <p className="text-[14px] mt-10 mb-0" style={{ color: "var(--aurora-text-muted)" }}>
          Here is a Monday in the life of one talent manager.
        </p>
      </section>

      {/* CHAPTER ONE: THE MESS */}
      <section className="mkt-tint">
        <div className="max-w-[760px] mx-auto px-6 py-24 flex flex-col gap-8">
          {MESS.map((line, i) => (
            <ScrollReveal key={line} delayMs={i * 100}>
              <p className="m-0" style={{ fontSize: 27, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-.01em" }}>
                {line}
              </p>
            </ScrollReveal>
          ))}
          <ScrollReveal delayMs={400}>
            <p className="m-0" style={{ fontSize: 31, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-.015em" }}>
              Freja is good at her job. <span className="mkt-gradient-text">Her tools are not helping.</span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* CHAPTER TWO: THE TURN */}
      <section className="max-w-[760px] mx-auto px-6 pt-28 pb-10">
        <ScrollReveal>
          <h2 className="text-[36px] m-0 mb-4" style={{ fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
            Then she puts it all in <span className="mkt-gradient-text">one place.</span>
          </h2>
          <p className="text-[18px] m-0" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
            Same creators. Same brands. A different Monday.
          </p>
        </ScrollReveal>
      </section>

      {/* CHAPTER THREE: THE DAY */}
      <section className="max-w-[1100px] mx-auto px-6 pb-24 pt-10 flex flex-col gap-24">
        {DAY.map(({ time, line, detail, Preview }, i) => (
          <ScrollReveal key={time}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <div className="text-[15px] mb-3" style={{ fontWeight: 700, color: "var(--aurora-accent)" }}>
                  {time}
                </div>
                <p className="text-[28px] m-0 mb-3" style={{ fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.25 }}>
                  {line}
                </p>
                <p className="text-[16.5px] m-0" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
                  {detail}
                </p>
              </div>
              <div className="max-w-[440px] mx-auto w-full">
                <Preview />
              </div>
            </div>
          </ScrollReveal>
        ))}
      </section>

      {/* CHAPTER FOUR: A MONTH LATER */}
      <section style={{ background: "var(--aurora-gradient-soft)" }}>
        <div className="max-w-[760px] mx-auto px-6 py-24 text-center">
          <ScrollReveal>
            <h2 className="text-[34px] mb-8" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
              A month later
            </h2>
            <p className="text-[20px] m-0 mb-3" style={{ fontWeight: 500, lineHeight: 1.5 }}>
              Freja knows what is due today.
            </p>
            <p className="text-[20px] m-0 mb-3" style={{ fontWeight: 500, lineHeight: 1.5 }}>
              She knows who has been paid, and who has not.
            </p>
            <p className="text-[20px] m-0" style={{ fontWeight: 700, lineHeight: 1.5 }}>
              Nothing sits in someone&apos;s head anymore.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* WORKING ALONE */}
      <section className="max-w-[900px] mx-auto px-6 py-24">
        <ScrollReveal>
          <div className="mkt-card p-9 md:p-12">
            <h2 className="text-[30px] m-0 mb-3" style={{ fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.2 }}>
              Working alone? Same story, smaller.
            </h2>
            <p className="text-[17px] m-0 mb-6" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
              If you are the creator and you run your own brand deals, Ettuno gives you the same calm. Your deals,
              deadlines and invoices in one place.
            </p>
            <Link href="/solutions" className="mkt-link inline-flex items-center gap-1.5 text-[15px]" style={{ fontWeight: 600 }}>
              See what it does <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* RESOURCES TEASER */}
      <section className="mkt-tint">
        <div className="max-w-[1100px] mx-auto px-6 py-24">
          <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
            <h2 className="text-[30px] m-0" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
              How teams work with Ettuno
            </h2>
            <Link href="/resources" className="mkt-link inline-flex items-center gap-1.5 text-[14.5px]" style={{ fontWeight: 600 }}>
              All resources <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stories.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="w-full" style={{ background: "var(--aurora-gradient-primary)" }}>
        <div className="max-w-[760px] mx-auto px-6 py-24 text-center">
          <h2 className="text-[36px] mb-9" style={{ fontWeight: 800, letterSpacing: "-.02em", color: "#fff", lineHeight: 1.15 }}>
            Stop managing creators through five apps.
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login" className="mkt-btn mkt-btn-white" style={{ padding: "14px 28px", fontSize: 16 }}>
              Start free
            </Link>
            <Link href="/pricing" className="mkt-btn" style={{ padding: "14px 28px", fontSize: 16, color: "#fff", borderColor: "rgba(255,255,255,.6)" }}>
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
