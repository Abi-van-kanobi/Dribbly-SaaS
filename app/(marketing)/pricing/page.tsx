import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { tiers } from "@/lib/pricing";

export const metadata: Metadata = { title: "Pricing · Ettuno" };

const FAQ = [
  {
    q: "Does Ettuno move money?",
    a: "No. Ettuno tracks invoices and payments. Your money moves through the bank or payout service you already use.",
  },
  {
    q: "Can I take my data with me?",
    a: "Yes. Download everything in your workspace as a file, or delete your account and all of it, from Settings at any time.",
  },
  {
    q: "Which plan should I pick?",
    a: "Working for yourself, pick Creator. Managing other people, pick Manager. Running a team, pick Agency.",
  },
];

export default function PricingPage() {
  return (
    <main className="mkt">
      <section className="max-w-[1100px] mx-auto px-6 pt-20 pb-24">
        <h1 className="text-[44px] mb-4 text-center" style={{ fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1 }}>
          Simple plans for <span className="mkt-gradient-text">how you work</span>
        </h1>
        <p className="text-[17px] text-center mx-auto mb-14 max-w-[480px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
          Pick the one that matches your work. Change it later.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="mkt-card p-8 flex flex-col"
              style={
                tier.highlight
                  ? { borderColor: "var(--aurora-accent)", boxShadow: "var(--aurora-shadow-lg)" }
                  : undefined
              }
            >
              <h2 className="text-[22px] m-0 mb-1" style={{ fontWeight: 800 }}>
                {tier.name}
              </h2>
              <p className="text-[14px] m-0 mb-6" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.5, minHeight: 42 }}>
                {tier.forWho}
              </p>

              {/* Price slot. Blank until a price is set in lib/pricing.ts. */}
              <div
                className="mb-6 flex items-baseline gap-1.5 rounded-xl px-4"
                style={{
                  minHeight: 64,
                  alignItems: "center",
                  border: tier.price ? "none" : "1.5px dashed var(--aurora-border)",
                  padding: tier.price ? 0 : undefined,
                }}
              >
                {tier.price ? (
                  <>
                    <span className="text-[38px]" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-[14px]" style={{ color: "var(--aurora-text-muted)" }}>
                        {tier.period}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="sr-only">Price not set yet</span>
                )}
              </div>

              <Link
                href="/login"
                className={`mkt-btn ${tier.highlight ? "mkt-btn-primary" : "mkt-btn-ghost"} w-full mb-7`}
              >
                {tier.cta}
              </Link>

              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[14.5px]" style={{ lineHeight: 1.45 }}>
                    <Check size={16} weight="bold" className="flex-none mt-0.5" style={{ color: "var(--aurora-accent)" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-tint">
        <div className="max-w-[720px] mx-auto px-6 py-20">
          <h2 className="text-[28px] mb-8" style={{ fontWeight: 800, letterSpacing: "-.02em" }}>
            Common questions
          </h2>
          <div className="flex flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="text-[17px] m-0 mb-1.5" style={{ fontWeight: 700 }}>
                  {item.q}
                </h3>
                <p className="m-0 text-[15px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.65 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
