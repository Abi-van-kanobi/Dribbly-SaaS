"use client";

import { PushPin } from "@phosphor-icons/react";
import type { PinKind } from "@prisma/client";
import { FullBarDialog, usePinner } from "./pin-ui";

/** The pin icon on any task, deliverable or invoice. One tap pins it for today; another unpins it. */
export function PinButton({ kind, id, title, pinned }: { kind: PinKind; id: string; title: string; pinned: boolean }) {
  const pinner = usePinner();

  return (
    <>
      <button
        type="button"
        className="mkt-btn-icon"
        disabled={pinner.pending}
        aria-pressed={pinned}
        aria-label={pinned ? `Unpin "${title}" from today` : `Pin "${title}" for today`}
        title={pinned ? "Unpin from today" : "Pin for today"}
        onClick={() => (pinned ? pinner.unpin({ kind, id }) : pinner.pin({ kind, id }))}
        style={pinned ? { color: "var(--aurora-accent)", background: "var(--aurora-bg-tint)" } : undefined}
      >
        <PushPin size={16} weight={pinned ? "fill" : "regular"} />
      </button>
      {pinner.error && (
        <span role="alert" className="sr-only">
          {pinner.error}
        </span>
      )}
      <FullBarDialog full={pinner.full} onDrop={pinner.swap} onClose={pinner.closeFull} busy={pinner.pending} />
    </>
  );
}
