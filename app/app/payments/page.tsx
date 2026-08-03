import { prisma } from "@/lib/prisma";
import { invoiceStatus, payRail } from "@/lib/labels";
import { formatINR, formatShortDate } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { NewInvoiceDialog } from "@/components/NewInvoiceDialog";
import { MarkPaidButton } from "@/components/MarkPaidButton";
import { CurrencyInr, Clock, WarningCircle, Wallet, Plus } from "@phosphor-icons/react/dist/ssr";

export default async function PaymentsPage() {
  const [invoices, campaigns] = await Promise.all([
    prisma.invoice.findMany({
      include: { campaign: true, brand: true, creator: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.campaign.findMany({ include: { brand: true }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const receivedThisMonth = invoices
    .filter((i) => i.status === "PAID" && new Date(i.dueDate).getMonth() === now.getMonth() && new Date(i.dueDate).getFullYear() === now.getFullYear())
    .reduce((sum, i) => sum + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((sum, i) => sum + i.amount, 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);

  const connectedRails = Array.from(new Set(invoices.map((i) => i.rail)));

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4.5" style={{ marginBottom: 18 }}>
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Payments
        </h1>
        <NewInvoiceDialog campaigns={campaigns.map((c) => ({ id: c.id, name: c.name, brandName: c.brand.name }))} />
      </div>

      <h4 className="text-[12.5px] uppercase mb-2.5 font-semibold" style={{ letterSpacing: ".06em", color: "var(--aurora-text-muted)" }}>
        Connected payout rails
      </h4>
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        {connectedRails.map((rail) => (
          <span key={rail} className="mkt-tag mkt-tag-good">
            ● {payRail[rail]}
          </span>
        ))}
        <span className="mkt-tag mkt-tag-neutral" style={{ opacity: 0.7 }}>
          <Plus size={11} style={{ marginRight: 4 }} />
          Connect rail
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <StatTile icon={<CurrencyInr size={15} />} label="Received this month" value={formatINR(receivedThisMonth)} valueColor="#15803d" />
        <StatTile icon={<Clock size={15} />} label="Pending" value={formatINR(pending)} valueColor="#c2410c" />
        <StatTile icon={<WarningCircle size={15} />} label="Overdue" value={formatINR(overdue)} valueColor="#dc2626" />
        <StatTile icon={<Wallet size={15} />} label="Total invoiced" value={formatINR(totalInvoiced)} />
      </div>

      <div className="mkt-card p-0 overflow-hidden">
        <table className="mkt-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Campaign</th>
              <th>Brand</th>
              <th>Creator</th>
              <th>Amount</th>
              <th>Rail</th>
              <th>Status</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 600 }}>#{inv.number}</td>
                <td>{inv.campaign.name}</td>
                <td>{inv.brand.name}</td>
                <td>{inv.creator.name}</td>
                <td>{formatINR(inv.amount)}</td>
                <td>{payRail[inv.rail]}</td>
                <td>
                  <span className={`mkt-tag ${invoiceStatus[inv.status].tag}`}>{invoiceStatus[inv.status].label}</span>
                </td>
                <td>{formatShortDate(inv.dueDate)}</td>
                <td>{inv.status !== "PAID" && <MarkPaidButton invoiceId={inv.id} />}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
