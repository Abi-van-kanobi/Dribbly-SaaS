"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { createNote } from "@/lib/actions/notes";

export function NewNoteDialog({
  campaigns,
  brands,
}: {
  campaigns: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New note
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New note">
        <form
          action={async (formData) => {
            await createNote(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="mkt-field">
            <label htmlFor="note-title">Title</label>
            <input id="note-title" name="title" className="mkt-input" required />
          </div>
          <div className="mkt-field">
            <label htmlFor="note-kind">Type</label>
            <select id="note-kind" name="kind" className="mkt-input">
              <option value="INTERNAL">Internal</option>
              <option value="BRIEF">Brief</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="note-campaign">Campaign (optional)</label>
              <select id="note-campaign" name="campaignId" className="mkt-input">
                <option value="">—</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mkt-field">
              <label htmlFor="note-brand">Brand (optional)</label>
              <select id="note-brand" name="brandId" className="mkt-input">
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mkt-field">
            <label htmlFor="note-body">Body</label>
            <textarea id="note-body" name="body" className="mkt-input" required />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Add note
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
