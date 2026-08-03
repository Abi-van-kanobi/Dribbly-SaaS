"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { createCreator } from "@/lib/actions/creators";

export function NewCreatorDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add creator
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add creator">
        <form
          action={async (formData) => {
            await createCreator(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="cr-name">Name</label>
              <input id="cr-name" name="name" className="mkt-input" required />
            </div>
            <div className="mkt-field">
              <label htmlFor="cr-handle">Handle</label>
              <input id="cr-handle" name="handle" className="mkt-input" placeholder="@handle" required />
            </div>
          </div>
          <div className="mkt-field">
            <label htmlFor="cr-category">Category</label>
            <input id="cr-category" name="category" className="mkt-input" placeholder="Beauty, Fitness, Fashion…" required />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="cr-ig">Instagram followers</label>
              <input id="cr-ig" name="instagram" type="number" min={0} className="mkt-input" />
            </div>
            <div className="mkt-field">
              <label htmlFor="cr-yt">YouTube followers</label>
              <input id="cr-yt" name="youtube" type="number" min={0} className="mkt-input" />
            </div>
          </div>
          <div className="mkt-field">
            <label htmlFor="cr-rate">Rate card note</label>
            <textarea id="cr-rate" name="ratecardNote" className="mkt-input" placeholder="Reel: ₹Xk · Story: ₹Xk" />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Add creator
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
