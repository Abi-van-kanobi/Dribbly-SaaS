"use client";

import { useTransition } from "react";
import { markInvoicePaid } from "@/lib/actions/invoices";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="mkt-btn mkt-btn-ghost"
      style={{ fontSize: 12.5, padding: "4px 10px" }}
      onClick={() => startTransition(() => markInvoicePaid(invoiceId))}
    >
      {pending ? "…" : "Mark paid"}
    </button>
  );
}
