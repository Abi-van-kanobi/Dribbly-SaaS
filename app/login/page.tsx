import Link from "next/link";
import { demoLoginAction } from "./actions";
import { isDemoEnabled } from "@/lib/demo-account";
import { isGoogleConfigured } from "@/lib/google";

const ERRORS: Record<string, string> = {
  google: "Google sign-in did not finish. Please try again.",
  "google-not-configured": "Google sign-in is not set up on this server yet.",
  "email-unverified": "Google says that email address is not verified. Verify it with Google, then try again.",
  "email-in-use": "That email already belongs to another account.",
  "no-workspace": "We could not find a workspace for that account. Contact support.",
  demo: "The demo workspace is not available right now.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const googleReady = isGoogleConfigured();
  const demoReady = isDemoEnabled();
  const devLogin = process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_LOGIN === "true";

  return (
    <div className="mkt min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT — visual panel, echoes the homepage hero */}
      <div
        className="hidden md:flex flex-col justify-center relative px-16 py-16 overflow-hidden"
        style={{ background: "var(--aurora-gradient-soft)" }}
      >
        <div
          className="absolute -bottom-24 -left-20 w-[420px] h-[420px] rounded-full"
          style={{ background: "var(--aurora-gradient-primary)", filter: "blur(90px)", opacity: 0.25 }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-10" style={{ fontWeight: 800, fontSize: 19, color: "var(--aurora-text)" }}>
            <span className="w-[26px] h-[26px] rounded-lg grid place-items-center text-white text-[13px] font-bold" style={{ background: "var(--aurora-gradient-primary)" }}>
              D
            </span>
            Ettuno
          </div>
          <h1 className="text-[36px] mb-5" style={{ fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
            One workspace. <span className="mkt-gradient-text">Every creator you manage.</span>
          </h1>
          <p className="text-[15.5px] max-w-[380px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
            Campaigns, payments, deliverables, creators. All visible. All current.
          </p>
        </div>
      </div>

      {/* RIGHT — sign in */}
      <div className="flex items-center justify-center px-6 py-16">
        <div
          className="w-full max-w-[380px] rounded-[20px] overflow-hidden"
          style={{ background: "var(--aurora-gradient-primary)", paddingTop: 4, boxShadow: "var(--aurora-shadow-md)" }}
        >
          <div className="p-8 flex flex-col gap-6" style={{ background: "#fff" }}>
            <div className="md:hidden flex items-center gap-2" style={{ fontWeight: 800, fontSize: 18, color: "var(--aurora-text)" }}>
              <span className="w-[24px] h-[24px] rounded-lg grid place-items-center text-white text-[12px] font-bold" style={{ background: "var(--aurora-gradient-primary)" }}>
                D
              </span>
              Ettuno
            </div>

            <div>
              <h2 className="text-[22px] mb-1" style={{ fontWeight: 700 }}>
                Welcome
              </h2>
              <p className="text-[14px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                Sign in with Google. No password to remember.
              </p>
            </div>

            {error && ERRORS[error] && (
              <p role="alert" className="text-[13.5px] m-0" style={{ color: "#dc2626" }}>
                {ERRORS[error]}
              </p>
            )}

            <div className="flex flex-col gap-3">
              {googleReady ? (
                <a href="/api/auth/google" className="mkt-btn mkt-btn-primary w-full no-underline">
                  Continue with Google
                </a>
              ) : (
                <button type="button" disabled className="mkt-btn mkt-btn-primary w-full" title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable">
                  Continue with Google
                </button>
              )}

              {demoReady && (
                <form action={demoLoginAction}>
                  <button type="submit" className="mkt-btn mkt-btn-ghost w-full">
                    Explore the demo workspace
                  </button>
                </form>
              )}

              {devLogin && (
                <a href="/api/auth/dev" className="mkt-link text-[13px] text-center">
                  Dev only: sign in as a fake Google user
                </a>
              )}
            </div>

            <p className="text-[12px] m-0" style={{ color: "#a8a3b8", lineHeight: 1.5 }}>
              New here? You will read and accept our{" "}
              <Link href="/terms" className="mkt-link">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="mkt-link">
                Privacy Policy
              </Link>{" "}
              before your account is created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
