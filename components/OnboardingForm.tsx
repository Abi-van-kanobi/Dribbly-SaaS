"use client";

import { useEffect, useRef, useState } from "react";
import { completeOnboardingAction } from "@/app/onboarding/actions";

type WorkspaceType = "MANAGER_AGENCY" | "INDIVIDUAL_CREATOR";

const CHOICES: { value: WorkspaceType; title: string; body: string }[] = [
  {
    value: "MANAGER_AGENCY",
    title: "I manage other creators",
    body: "Agencies and talent managers. Run every creator and campaign in one place.",
  },
  {
    value: "INDIVIDUAL_CREATOR",
    title: "I manage my own brand deals",
    body: "Solo creators. Keep deals, deadlines and payments in one place.",
  },
];

export function OnboardingForm({ error }: { error?: string }) {
  const [type, setType] = useState<WorkspaceType | "">("");
  const [agree, setAgree] = useState(false);
  const timezoneRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);

  // Detect time zone and country from the browser. No question is asked; the server re-checks both.
  useEffect(() => {
    try {
      if (timezoneRef.current) timezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const region = (navigator.language || "").split("-")[1]?.toUpperCase();
      if (countryRef.current && region && /^[A-Z]{2}$/.test(region)) countryRef.current.value = region;
    } catch {
      // Defaults apply on the server.
    }
  }, []);

  return (
    <form action={completeOnboardingAction} className="flex flex-col gap-5">
      <input ref={timezoneRef} type="hidden" name="timezone" defaultValue="UTC" />
      <input ref={countryRef} type="hidden" name="country" defaultValue="" />

      <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
        <legend className="sr-only">How will you use Ettuno?</legend>
        {CHOICES.map((choice) => {
          const selected = type === choice.value;
          return (
            <label
              key={choice.value}
              className="block cursor-pointer rounded-xl p-4"
              style={{
                border: selected ? "2px solid var(--aurora-accent)" : "2px solid var(--aurora-border)",
                background: selected ? "#f5f3ff" : "#fff",
              }}
            >
              <input
                type="radio"
                name="type"
                value={choice.value}
                checked={selected}
                onChange={() => setType(choice.value)}
                className="sr-only"
                required
              />
              <span className="block text-[15px]" style={{ fontWeight: 700 }}>
                {choice.title}
              </span>
              <span className="block text-[13px] mt-1" style={{ color: "var(--aurora-text-muted)" }}>
                {choice.body}
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="flex items-start gap-2.5 text-[13px] cursor-pointer" style={{ color: "var(--aurora-text)", lineHeight: 1.5 }}>
        <input
          type="checkbox"
          name="agree"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          required
          className="mt-0.5 w-4 h-4 flex-none"
          style={{ accentColor: "#7c3aed" }}
        />
        <span>
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="mkt-link">
            Terms
          </a>{" "}
          and the{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="mkt-link">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {error === "terms" && (
        <p role="alert" className="text-[13.5px] m-0" style={{ color: "#dc2626" }}>
          Tick the box to continue.
        </p>
      )}
      {error === "type" && (
        <p role="alert" className="text-[13.5px] m-0" style={{ color: "#dc2626" }}>
          Pick one of the two options.
        </p>
      )}

      <button type="submit" disabled={!type || !agree} className="mkt-btn mkt-btn-primary w-full">
        Create my workspace
      </button>
    </form>
  );
}
