"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, ArrowUUpLeft, CalendarBlank, Check, Plus, PushPin, Warning, X } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { doneAction, tomorrowAction, unpinAction } from "@/lib/actions/pins";
import type { Bar, BarCard, Candidate } from "@/lib/pin-service";
import { MAX_PINS } from "@/lib/today";
import { FullBarDialog, usePinner } from "./pin-ui";

const KIND_LABEL = { TASK: "Task", DELIVERABLE: "Deliverable", INVOICE: "Invoice" } as const;

function Card({ card }: { card: BarCard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const late = card.due.late && !card.done;
  const tone = late
    ? { bg: "#fef2f2", border: "#fecaca", accent: "#b91c1c" }
    : card.done
      ? { bg: "var(--aurora-bg-tint)", border: "var(--aurora-border)", accent: "#15803d" }
      : { bg: "#fff", border: "var(--aurora-border)", accent: "var(--aurora-accent)" };

  return (
    <li
      className="rounded-[13px] p-3.5 flex flex-col gap-2 list-none"
      style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderLeft: `4px solid ${tone.accent}`, opacity: pending ? 0.6 : 1 }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] flex items-center gap-1.5 flex-wrap" style={{ color: "var(--aurora-text-muted)", fontWeight: 600 }}>
            {KIND_LABEL[card.kind]}
            {card.carried && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                {card.carried}
              </span>
            )}
          </div>
          <div
            className="text-[14.5px] mt-0.5"
            style={{ fontWeight: 600, textDecoration: card.done ? "line-through" : "none", color: card.done ? "var(--aurora-text-muted)" : "var(--aurora-text)" }}
          >
            {card.title}
          </div>
          {card.subtitle && (
            <div className="text-[12.5px] truncate" style={{ color: "var(--aurora-text-muted)" }}>
              {card.subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          className="mkt-btn-icon"
          aria-label={`Unpin "${card.title}"`}
          title="Unpin"
          disabled={pending}
          onClick={() => run(() => unpinAction({ pinId: card.pinId }))}
          style={{ width: 26, height: 26 }}
        >
          <X size={13} />
        </button>
      </div>

      <div className="text-[12.5px] flex items-center gap-1.5" style={{ color: late ? "#b91c1c" : "var(--aurora-text-muted)", fontWeight: late ? 700 : 500 }}>
        {late && <Warning size={13} weight="fill" aria-hidden="true" />}
        {card.done ? "Done today" : card.due.text}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {card.done ? (
          <button type="button" className="mkt-btn mkt-btn-ghost" style={{ padding: "5px 10px", fontSize: 12.5 }} disabled={pending} onClick={() => run(() => doneAction({ pinId: card.pinId, done: false }))}>
            <ArrowUUpLeft size={13} />
            Undo
          </button>
        ) : (
          <>
            <button
              type="button"
              className="mkt-btn mkt-btn-ghost"
              style={{ padding: "5px 10px", fontSize: 12.5 }}
              disabled={pending}
              title={card.kind === "TASK" ? "Mark this task done" : "Tick this off the bar. Open it to change its status."}
              onClick={() => run(() => doneAction({ pinId: card.pinId, done: true }))}
            >
              <Check size={13} weight="bold" />
              Done
            </button>
            <button type="button" className="mkt-btn mkt-btn-ghost" style={{ padding: "5px 10px", fontSize: 12.5 }} disabled={pending} onClick={() => run(() => tomorrowAction({ pinId: card.pinId }))}>
              <CalendarBlank size={13} />
              Tomorrow
            </button>
          </>
        )}
        {card.openHref && (
          <Link href={card.openHref} className="mkt-btn mkt-btn-ghost no-underline" style={{ padding: "5px 10px", fontSize: 12.5 }}>
            <ArrowSquareOut size={13} />
            Open
          </Link>
        )}
      </div>
      {error && (
        <div role="alert" className="text-[12px]" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}
    </li>
  );
}

function Picker({ open, onClose, candidates }: { open: boolean; onClose: () => void; candidates: Candidate[] }) {
  const pinner = usePinner(onClose);
  return (
    <>
      <Modal open={open && pinner.full === null} onClose={onClose} title="Pin for today">
        <p className="text-[13.5px] m-0 mb-3" style={{ color: "var(--aurora-text-muted)" }}>
          Late items first, then what is due soon.
        </p>
        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
          {candidates.map((c) => (
            <div key={`${c.kind}:${c.id}`} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: "var(--aurora-bg-tint)", border: "1px solid var(--aurora-border)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ fontWeight: 600 }}>
                  {c.title}
                </div>
                <div className="text-[12.5px] truncate" style={{ color: c.due.late ? "#b91c1c" : "var(--aurora-text-muted)", fontWeight: c.due.late ? 700 : 400 }}>
                  {KIND_LABEL[c.kind]} · {c.due.text}
                  {c.subtitle ? ` · ${c.subtitle}` : ""}
                </div>
              </div>
              <button type="button" className="mkt-btn mkt-btn-ghost" style={{ padding: "5px 10px", fontSize: 12.5 }} disabled={pinner.pending} onClick={() => pinner.pin({ kind: c.kind, id: c.id })}>
                <PushPin size={13} />
                Pin for today
              </button>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
              Nothing due soon to pin. You can also pin from any campaign or from Payments.
            </p>
          )}
        </div>
        {pinner.error && (
          <p role="alert" className="text-[13px] mt-3 mb-0" style={{ color: "#b91c1c" }}>
            {pinner.error}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" className="mkt-btn mkt-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
      <FullBarDialog
        full={pinner.full}
        onDrop={pinner.swap}
        onClose={() => {
          pinner.closeFull();
          onClose();
        }}
        busy={pinner.pending}
      />
    </>
  );
}

export function TodayBarView({ bar, candidates }: { bar: Bar; candidates: Candidate[] }) {
  const [picking, setPicking] = useState(false);
  const total = bar.cards.length;

  return (
    <section aria-labelledby="today-bar-title" className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid var(--aurora-border)" }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 id="today-bar-title" className="text-[16px] m-0 flex items-center gap-2" style={{ fontWeight: 800 }}>
          <PushPin size={17} weight="fill" style={{ color: "var(--aurora-accent)" }} />
          Important today
        </h2>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-[12.5px]" style={{ color: "var(--aurora-text-muted)" }}>
              {bar.doneCount} of {total} done
            </span>
          )}
          {total > 0 && total < MAX_PINS && (
            <button type="button" className="mkt-btn mkt-btn-ghost" style={{ padding: "5px 12px", fontSize: 12.5 }} onClick={() => setPicking(true)}>
              <Plus size={13} />
              Pin
            </button>
          )}
        </div>
      </div>
      <p className="text-[12.5px] mt-0 mb-3" style={{ color: "var(--aurora-text-muted)" }}>
        What you chose to get done today. Pin up to {MAX_PINS} things.
      </p>

      {total === 0 ? (
        <div className="flex items-center justify-between gap-4 flex-wrap px-1 py-2">
          <p className="m-0 text-[14.5px]" style={{ color: "var(--aurora-text-muted)" }}>
            Nothing pinned. What has to happen today?
          </p>
          <button type="button" className="mkt-btn mkt-btn-primary" style={{ padding: "8px 16px", fontSize: 13.5 }} onClick={() => setPicking(true)}>
            <PushPin size={14} />
            Pin something
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-0 m-0">
          {bar.cards.map((card) => (
            <Card key={card.pinId} card={card} />
          ))}
        </ul>
      )}

      <Picker open={picking} onClose={() => setPicking(false)} candidates={candidates} />
    </section>
  );
}
