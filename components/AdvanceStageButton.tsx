"use client";

import { useTransition } from "react";
import { advanceDeliverableStage } from "@/lib/actions/campaigns";

export function AdvanceStageButton({ deliverableId, isFinal }: { deliverableId: string; isFinal: boolean }) {
  const [pending, startTransition] = useTransition();
  if (isFinal) return null;

  return (
    <button
      type="button"
      disabled={pending}
      className="mkt-btn mkt-btn-ghost"
      style={{ fontSize: 12.5, padding: "4px 10px" }}
      onClick={() => startTransition(() => advanceDeliverableStage(deliverableId))}
    >
      {pending ? "…" : "Advance →"}
    </button>
  );
}
