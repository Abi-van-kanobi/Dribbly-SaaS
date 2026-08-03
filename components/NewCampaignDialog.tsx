"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { createCampaign } from "@/lib/actions/campaigns";

export function NewCampaignDialog({
  brands,
  creators,
}: {
  brands: { id: string; name: string }[];
  creators: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New campaign
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New campaign">
        <form
          action={async (formData) => {
            await createCampaign(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="mkt-field">
            <label htmlFor="nc-name">Campaign name</label>
            <input id="nc-name" name="name" className="mkt-input" required />
          </div>
          <div className="mkt-field">
            <label htmlFor="nc-brand">Brand</label>
            <select id="nc-brand" name="brandId" className="mkt-input">
              <option value="">— choose existing —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mkt-field">
            <label htmlFor="nc-new-brand">Or new brand name</label>
            <input id="nc-new-brand" name="newBrandName" className="mkt-input" placeholder="Only if not in the list above" />
          </div>
          <div className="mkt-field">
            <label htmlFor="nc-creator">Creator</label>
            <select id="nc-creator" name="creatorId" className="mkt-input" required>
              <option value="">— choose —</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="nc-value">Value (₹)</label>
              <input id="nc-value" name="value" type="number" min={0} className="mkt-input" required />
            </div>
            <div className="mkt-field">
              <label htmlFor="nc-deadline">Deadline</label>
              <input id="nc-deadline" name="deadline" type="date" className="mkt-input" required />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Create campaign
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
