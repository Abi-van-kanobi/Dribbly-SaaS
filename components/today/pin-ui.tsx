"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PinKind } from "@prisma/client";
import { Modal } from "@/components/Modal";
import { pinAction, swapAction, unpinAction } from "@/lib/actions/pins";
import type { BarCard } from "@/lib/pin-service";

type Target = { kind: PinKind; id: string };

interface FullBar {
  target: Target;
  cards: BarCard[];
}

/** Pin, unpin and "bar is full" handling, shared by the pin button and the picker. */
export function usePinner(onPinned?: () => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [full, setFull] = useState<FullBar | null>(null);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    router.refresh();
    onPinned?.();
  };

  return {
    pending,
    full,
    error,
    closeFull: () => setFull(null),
    pin(target: Target) {
      setError(null);
      startTransition(async () => {
        const result = await pinAction(target);
        if (result.ok) done();
        else if ("full" in result) setFull({ target, cards: result.cards });
        else setError(result.error);
      });
    },
    unpin(target: Target) {
      setError(null);
      startTransition(async () => {
        const result = await unpinAction(target);
        if (result.ok) router.refresh();
        else setError(result.error);
      });
    },
    swap(dropPinId: string) {
      if (!full) return;
      const { target } = full;
      startTransition(async () => {
        const result = await swapAction({ dropPinId, ...target });
        setFull(null);
        if (result.ok) done();
        else if (!("full" in result)) setError(result.error);
      });
    },
  };
}

/** Shown when a sixth pin is attempted: the person chooses which pin to drop. */
export function FullBarDialog({ full, onDrop, onClose, busy }: { full: FullBar | null; onDrop: (pinId: string) => void; onClose: () => void; busy: boolean }) {
  return (
    <Modal open={full !== null} onClose={onClose} title="Your bar is full">
      <p className="text-[14px] m-0 mb-4" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.55 }}>
        The bar holds 5. Choose one to drop and the new item takes its place. Done items are the easiest to drop.
      </p>
      <div className="flex flex-col gap-2">
        {[...(full?.cards ?? [])]
          .sort((a, b) => Number(b.done) - Number(a.done))
          .map((card) => (
            <button
              key={card.pinId}
              type="button"
              disabled={busy}
              onClick={() => onDrop(card.pinId)}
              className="text-left px-3.5 py-2.5 rounded-xl cursor-pointer"
              style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }}
            >
              <div className="text-[14px]" style={{ fontWeight: 600, textDecoration: card.done ? "line-through" : "none" }}>
                {card.title}
              </div>
              <div className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
                {card.done ? "Done today. " : ""}
                Drop this one
              </div>
            </button>
          ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" className="mkt-btn mkt-btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
