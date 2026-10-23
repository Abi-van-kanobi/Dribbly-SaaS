"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { assignCreator } from "@/lib/actions/campaigns";

/** Pick, change or add the creator on a campaign after it exists. */
export function AssignCreatorDialog({
  campaignId,
  creators,
  currentId,
}: {
  campaignId: string;
  creators: { id: string; name: string }[];
  currentId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="mkt-btn mkt-btn-ghost" style={{ padding: "4px 10px", fontSize: 12.5 }} onClick={() => setOpen(true)}>
        {currentId ? "Change" : "Assign creator"}
      </button>
      <Modal open={open} onClose={close} title={currentId ? "Change creator" : "Assign a creator"}>
        <form
          action={async (formData) => {
            setPending(true);
            setError(null);
            const result = await assignCreator(formData);
            setPending(false);
            if (result.ok) close();
            else setError(result.error);
          }}
          className="flex flex-col gap-3.5"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <div className="mkt-field">
            <label htmlFor="ac-creator">Creator</label>
            <select id="ac-creator" name="creatorId" className="mkt-input" defaultValue={currentId ?? ""}>
              <option value="">{creators.length ? "Choose a creator" : "No creators yet. Type a name below"}</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mkt-field">
            <label htmlFor="ac-new-creator">Or new creator name</label>
            <input id="ac-new-creator" name="newCreatorName" className="mkt-input" placeholder="Added to your creators for you" />
          </div>
          <p className="text-[12.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
            Unpaid invoices on this campaign move to the new creator. Paid ones keep theirs.
          </p>
          {error && (
            <p role="alert" className="text-[13.5px] m-0" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
