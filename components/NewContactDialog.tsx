"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { createContact } from "@/lib/actions/contacts";

export function NewContactDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        Add contact
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add contact">
        <form
          action={async (formData) => {
            await createContact(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="ct-name">Name</label>
              <input id="ct-name" name="name" className="mkt-input" required />
            </div>
            <div className="mkt-field">
              <label htmlFor="ct-type">Type</label>
              <select id="ct-type" name="type" className="mkt-input">
                <option value="BRAND">Brand</option>
                <option value="AGENCY">Agency</option>
                <option value="CREATOR">Creator</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="ct-role">Role</label>
              <input id="ct-role" name="role" className="mkt-input" />
            </div>
            <div className="mkt-field">
              <label htmlFor="ct-org">Organization</label>
              <input id="ct-org" name="org" className="mkt-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="ct-email">Email</label>
              <input id="ct-email" name="email" type="email" className="mkt-input" />
            </div>
            <div className="mkt-field">
              <label htmlFor="ct-phone">Phone</label>
              <input id="ct-phone" name="phone" className="mkt-input" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Add contact
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
