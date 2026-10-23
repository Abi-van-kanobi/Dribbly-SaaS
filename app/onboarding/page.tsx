import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.kind === "user") redirect("/app");

  const { error } = await searchParams;

  return (
    <div className="mkt min-h-screen flex items-center justify-center px-6 py-16" style={{ background: "var(--aurora-bg-tint)" }}>
      <div
        className="w-full max-w-[460px] rounded-[20px] overflow-hidden"
        style={{ background: "var(--aurora-gradient-primary)", paddingTop: 4, boxShadow: "var(--aurora-shadow-md)" }}
      >
        <div className="p-8 flex flex-col gap-6" style={{ background: "#fff" }}>
          <div>
            <h1 className="text-[24px] mb-1" style={{ fontWeight: 800, letterSpacing: "-.01em" }}>
              One step left
            </h1>
            <p className="text-[14px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
              Signed in as <b style={{ color: "var(--aurora-text)" }}>{session.email}</b>. How will you use Ettuno?
            </p>
          </div>

          <OnboardingForm error={error} />

          <p className="text-[12px] m-0 text-center" style={{ color: "#a8a3b8" }}>
            Not you?{" "}
            <Link href="/api/session/clear" className="mkt-link">
              Use a different account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
