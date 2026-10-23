"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/app/settings/actions";

export function DeleteAccount({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  if (disabled) {
    return (
      <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
        This is the shared demo workspace, so it cannot be deleted.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="mkt-btn mkt-btn-ghost" style={{ color: "#dc2626", borderColor: "#fecaca" }} onClick={() => setOpen(true)}>
        Delete my account
      </button>
    );
  }

  return (
    <form action={deleteAccountAction} className="flex flex-col gap-3 max-w-[420px]">
      <p className="text-[13.5px] m-0" style={{ lineHeight: 1.55 }}>
        This deletes your account and everything in your workspace: campaigns, creators, brands, invoices,
        tasks, notes and contacts. It cannot be undone. Download your data first if you want a copy.
      </p>
      <label htmlFor="confirm" className="text-[12.5px] font-medium">
        Type <b>DELETE</b> to confirm
      </label>
      <input id="confirm" name="confirm" className="mkt-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={typed.trim() !== "DELETE"}
          className="mkt-btn"
          style={{ background: "#dc2626", color: "#fff" }}
        >
          Delete everything
        </button>
        <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => { setOpen(false); setTyped(""); }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
