import { LEGAL_LAST_UPDATED, LEGAL_STATUS } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="max-w-[760px] mx-auto px-6 py-16">
      {LEGAL_STATUS === "draft" && (
        <div
          role="note"
          className="mkt-card p-4 mb-8 text-[13.5px]"
          style={{ background: "#FFF8E6", borderColor: "#F5D78A", lineHeight: 1.55 }}
        >
          <b>Draft, pending legal review.</b> This text has not yet been reviewed by a lawyer. Items in
          [SQUARE BRACKETS] are placeholders to be completed before launch.
        </div>
      )}
      <h1 className="text-[34px] mb-2" style={{ fontWeight: 800 }}>
        {title}
      </h1>
      <p className="text-[13px] mb-10" style={{ color: "var(--aurora-text-muted)" }}>
        Last updated {LEGAL_LAST_UPDATED}
      </p>
      <div className="legal-body text-[15px]" style={{ lineHeight: 1.65 }}>
        {children}
      </div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[19px] mb-2" style={{ fontWeight: 700 }}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
