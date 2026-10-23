import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import {
  DashboardPreview,
  CreatorProfilePreview,
  CampaignTimelinePreview,
  PaymentTrackingPreview,
  NotesInContextPreview,
} from "@/components/marketing/WalkthroughPreviews";

export const metadata: Metadata = { title: "Solutions · Ettuno" };

const FEATURES = [
  {
    id: "today",
    title: "See what needs you today",
    body: [
      "Open Ettuno and the first thing you see is today: approvals waiting, tasks due, payments due.",
      "Active campaigns and the next deadlines sit right below. No digging.",
    ],
    Preview: DashboardPreview,
  },
  {
    id: "campaigns",
    title: "Run every campaign on one timeline",
    body: [
      "Each campaign has its brand, creator, deliverables, dates and progress in one place.",
      "Move a deliverable from planned to posted. See what is late before the brand asks.",
    ],
    Preview: CampaignTimelinePreview,
  },
  {
    id: "creators",
    title: "Keep one profile for every creator",
    body: [
      "Handle, category, active work and earnings, together.",
      "Know who is busy, who is free and who you haven't spoken to in a while.",
    ],
    Preview: CreatorProfilePreview,
  },
  {
    id: "payments",
    title: "Track every payment",
    body: [
      "Every invoice is tied to its campaign. See what is paid, what is due and what is late.",
      "Ettuno tracks payments. It never moves your money.",
    ],
    Preview: PaymentTrackingPreview,
  },
  {
    id: "notes",
    title: "Keep notes where the work is",
    body: [
      "Notes and contacts live next to the campaign and creator they belong to.",
      "A new teammate can find the answer without asking you.",
    ],
    Preview: NotesInContextPreview,
  },
];

const AUDIENCES = [
  {
    title: "Talent managers and agencies",
    body: "Run a roster of creators and many brand deals at once. See every creator, campaign and payment in one place.",
  },
  {
    title: "Individual creators",
    body: "Run your own brand deals. Your own campaigns, deadlines and invoices, without a spreadsheet.",
  },
];

export default function SolutionsPage() {
  return (
    <main className="mkt">
      <section className="max-w-[820px] mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-[46px] mb-5" style={{ fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1, textWrap: "balance" }}>
          Everything creator work needs, <span className="mkt-gradient-text">in one place</span>
        </h1>
        <p className="text-[17px] mx-auto mb-9 max-w-[520px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
          Campaigns, creators, payments and notes. Built for people who manage creator work, not for big companies.
        </p>
        <Link href="/login" className="mkt-btn mkt-btn-primary" style={{ padding: "13px 26px", fontSize: 15.5 }}>
          Start free
        </Link>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 pb-12 flex flex-col gap-24">
        {FEATURES.map(({ id, title, body, Preview }, i) => (
          <ScrollReveal key={id}>
            <div
              id={id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center scroll-mt-24 ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <h2 className="text-[30px] mb-4" style={{ fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.25 }}>
                  {title}
                </h2>
                {body.map((line) => (
                  <p key={line} className="text-[16.5px] m-0 mb-2" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="max-w-[440px] mx-auto w-full">
                <Preview />
              </div>
            </div>
          </ScrollReveal>
        ))}
      </section>

      <section className="mkt-tint">
        <div className="max-w-[1000px] mx-auto px-6 py-20">
          <h2 className="text-[30px] text-center mb-10" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
            Who it is for
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="mkt-card p-7">
                <h3 className="text-[19px] m-0 mb-2" style={{ fontWeight: 700 }}>
                  {a.title}
                </h3>
                <p className="m-0 text-[15px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mkt-card p-7">
          <h3 className="text-[19px] m-0 mb-2" style={{ fontWeight: 700 }}>
            Your data stays yours
          </h3>
          <p className="m-0 text-[15px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
            Sign in with Google. We never read your email. Download everything or delete your account from Settings,
            any time.
          </p>
        </div>
        <div className="mkt-card p-7">
          <h3 className="text-[19px] m-0 mb-2" style={{ fontWeight: 700 }}>
            Coming next
          </h3>
          <p className="m-0 text-[15px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
            Import campaigns from Google Sheets, and link Google Docs to a campaign. Not live yet.
          </p>
        </div>
      </section>

      <section className="w-full" style={{ background: "var(--aurora-gradient-primary)" }}>
        <div className="max-w-[760px] mx-auto px-6 py-20 text-center">
          <h2 className="text-[34px] mb-8" style={{ fontWeight: 800, letterSpacing: "-.02em", color: "#fff", lineHeight: 1.15 }}>
            Add a creator. Create a campaign. Start today.
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
