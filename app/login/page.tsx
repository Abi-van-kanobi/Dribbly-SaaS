"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-account";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: false });

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
            Drrible
          </div>
          <h1 className="text-[36px] mb-5" style={{ fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
            One workspace. <span className="mkt-gradient-text">Every creator you manage.</span>
          </h1>
          <p className="text-[15.5px] max-w-[380px]" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.6 }}>
            Campaigns, payments, deliverables, creators. All visible. All current.
          </p>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="flex items-center justify-center px-6 py-16">
        {/* Nested-div trick for a thin gradient top edge without fighting border-image */}
        <div
          className="w-full max-w-[380px] rounded-[20px] overflow-hidden"
          style={{ background: "var(--aurora-gradient-primary)", paddingTop: 4, boxShadow: "var(--aurora-shadow-md)" }}
        >
          <div className="p-8 flex flex-col gap-6" style={{ background: "#fff" }}>
            <div className="md:hidden flex items-center gap-2" style={{ fontWeight: 800, fontSize: 18, color: "var(--aurora-text)" }}>
              <span className="w-[24px] h-[24px] rounded-lg grid place-items-center text-white text-[12px] font-bold" style={{ background: "var(--aurora-gradient-primary)" }}>
                D
              </span>
              Drrible
            </div>

            <div>
              <h2 className="text-[22px] mb-1" style={{ fontWeight: 700 }}>
                Welcome back
              </h2>
              <p className="text-[14px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
                Sign in to your talent-manager workspace.
              </p>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-[12.5px] mb-1.5 font-medium" style={{ color: "var(--aurora-text)" }}>
                  Email
                </label>
                <input id="email" name="email" type="email" className="mkt-input" defaultValue={DEMO_EMAIL} autoComplete="email" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-[12.5px] mb-1.5 font-medium" style={{ color: "var(--aurora-text)" }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="mkt-input"
                  defaultValue={DEMO_PASSWORD}
                  autoComplete="current-password"
                  required
                />
              </div>

              {state.error && (
                <p className="text-[13.5px] m-0" style={{ color: "#dc2626" }}>
                  Incorrect email or password.
                </p>
              )}

              <button type="submit" disabled={pending} className="mkt-btn mkt-btn-primary w-full" style={{ marginTop: 4 }}>
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="text-[12px] m-0" style={{ color: "#a8a3b8" }}>
              Demo account — the fields above are pre-filled. This is a local prototype; there is no
              real signup yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
