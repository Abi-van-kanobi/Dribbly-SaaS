import { prisma } from "@/lib/prisma";
import { NewContactDialog } from "@/components/NewContactDialog";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { name: "asc" },
    include: { brand: true, creator: true },
  });

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4.5" style={{ marginBottom: 18 }}>
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Contacts
        </h1>
        <NewContactDialog />
      </div>

      <div className="mkt-card p-0 overflow-hidden">
        <table className="mkt-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.role ?? "—"}</td>
                <td>{c.brand?.name ?? c.creator?.name ?? c.org ?? "—"}</td>
                <td>
                  <span className="mkt-tag mkt-tag-neutral">{c.type.charAt(0) + c.type.slice(1).toLowerCase()}</span>
                </td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--aurora-text-muted)", padding: 24 }}>
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
