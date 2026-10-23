"use client";

import { Plus } from "@phosphor-icons/react";
import { Modal } from "@/components/Modal";
import { useOpenFromNew } from "@/components/useOpenFromNew";
import { createInvoice } from "@/lib/actions/invoices";

export function NewInvoiceDialog({
  campaigns,
  currency,
}: {
  campaigns: { id: string; name: string; brandName: string }[];
  currency: string;
}) {
  const [open, setOpen] = useOpenFromNew("invoice");

  return (
    <>
      <button className="mkt-btn mkt-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New invoice
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New invoice">
        <form
          action={async (formData) => {
            await createInvoice(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3.5"
        >
          <div className="mkt-field">
            <label htmlFor="inv-campaign">Campaign</label>
            <select id="inv-campaign" name="campaignId" className="mkt-input" required>
              <option value="">— choose —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName} · {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="mkt-field">
              <label htmlFor="inv-amount">Amount ({currency})</label>
              <input id="inv-amount" name="amount" type="number" min={0} className="mkt-input" required />
            </div>
            <div className="mkt-field">
              <label htmlFor="inv-rail">Rail</label>
              <select id="inv-rail" name="rail" className="mkt-input">
                <option value="RAZORPAY">Razorpay</option>
                <option value="STRIPE">Stripe</option>
                <option value="WISE">Wise</option>
                <option value="PAYPAL">PayPal</option>
              </select>
            </div>
          </div>
          <div className="mkt-field">
            <label htmlFor="inv-due">Due date</label>
            <input id="inv-due" name="dueDate" type="date" className="mkt-input" required />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" className="mkt-btn mkt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="mkt-btn mkt-btn-primary">
              Create invoice
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
