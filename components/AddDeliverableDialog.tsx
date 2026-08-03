"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { addDeliverable } from "@/lib/actions/campaigns";

export function AddDeliverableDialog({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Deliverable
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New deliverable">
        <form
          action={async (formData) => {
            await addDeliverable(campaignId, formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="mkt-field">
            <label htmlFor="dl-title">Title</label>
            <input id="dl-title" name="title" className="mkt-input" required />
          </div>
          <div className="mkt-field">
            <label htmlFor="dl-due">Due date</label>
            <input id="dl-due" name="dueDate" type="date" className="mkt-input" required />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Add deliverable
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
