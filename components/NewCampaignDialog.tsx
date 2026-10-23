"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { useOpenFromNew } from "@/components/useOpenFromNew";
import { createCampaign } from "@/lib/actions/campaigns";

export function NewCampaignDialog({
  brands,
  creators,
  currency,
  selfCreatorId = null,
}: {
  brands: { id: string; name: string }[];
  creators: { id: string; name: string }[];
  currency: string;
  /** In a solo creator's workspace, the one creator is the owner, so the question is skipped. */
  selfCreatorId?: string | null;
}) {
  const [open, setOpen] = useOpenFromNew("campaign");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New campaign
      </button>
      <Modal open={open} onClose={close} title="New campaign">
        <form
          action={async (formData) => {
            setPending(true);
            setError(null);
            const result = await createCampaign(formData);
            setPending(false);
            if (result.ok) close();
            else setError(result.error);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="mkt-field">
            <label htmlFor="nc-name">Campaign name</label>
            <input id="nc-name" name="name" className="mkt-input" required autoFocus />
          </div>

          <div className="mkt-field">
            <label htmlFor="nc-brand">Brand</label>
            <select id="nc-brand" name="brandId" className="mkt-input">
              <option value="">{brands.length ? "Choose a brand" : "No brands yet. Type a name below"}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mkt-field">
            <label htmlFor="nc-new-brand">Or new brand name</label>
            <input id="nc-new-brand" name="newBrandName" className="mkt-input" placeholder="Only if it is not in the list" />
          </div>

          {selfCreatorId ? (
            <input type="hidden" name="creatorId" value={selfCreatorId} />
          ) : (
            <>
              <div className="mkt-field">
                <label htmlFor="nc-creator">Creator</label>
                <select id="nc-creator" name="creatorId" className="mkt-input" defaultValue="">
                  <option value="">No creator yet</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mkt-field">
                <label htmlFor="nc-new-creator">Or new creator name</label>
                <input id="nc-new-creator" name="newCreatorName" className="mkt-input" placeholder="Added to your creators for you" />
                <p className="text-[12.5px] m-0 mt-1" style={{ color: "var(--aurora-text-muted)" }}>
                  You can pick or change the creator later from the campaign.
                </p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="nc-value">Value ({currency}, optional)</label>
              <input id="nc-value" name="value" type="number" min={0} className="mkt-input" />
            </div>
            <div className="mkt-field">
              <label htmlFor="nc-deadline">Deadline (optional)</label>
              <input id="nc-deadline" name="deadline" type="date" className="mkt-input" />
            </div>
          </div>
          <p className="text-[12.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
            No deadline set means 30 days from today.
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
              {pending ? "Creating..." : "Create campaign"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
