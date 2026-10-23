import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { DeleteAccount } from "@/components/DeleteAccount";

const TYPE_LABEL = {
  MANAGER_AGENCY: "Manager or agency",
  INDIVIDUAL_CREATOR: "Individual creator",
} as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2.5 text-[14px]" style={{ borderBottom: "1px solid var(--aurora-border)" }}>
      <span style={{ color: "var(--aurora-text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, workspace } = await requireWorkspace();
  const { error } = await searchParams;
  const accepted = user.termsAcceptedAt
    ? user.termsAcceptedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="mkt max-w-[720px]">
      <h1 className="text-[26px] mb-6" style={{ fontWeight: 800 }}>
        Settings and privacy
      </h1>

      {error === "confirm" && (
        <p role="alert" className="text-[13.5px] mb-4" style={{ color: "#dc2626" }}>
          Type DELETE exactly to confirm.
        </p>
      )}
      {error === "demo" && (
        <p role="alert" className="text-[13.5px] mb-4" style={{ color: "#dc2626" }}>
          The demo workspace cannot be deleted.
        </p>
      )}

      <section className="mkt-card p-6 mb-5">
        <h2 className="text-[17px] mb-2" style={{ fontWeight: 700 }}>
          Your account
        </h2>
        <Row label="Name" value={user.name ?? "Not set"} />
        <Row label="Email" value={user.email} />
        <Row label="Workspace" value={workspace.name} />
        <Row label="Workspace type" value={TYPE_LABEL[workspace.type]} />
        <Row label="Currency" value={workspace.currency} />
        <Row label="Time zone" value={workspace.timezone} />
        <Row label="Country" value={workspace.country ?? "Not set"} />
      </section>

      <section className="mkt-card p-6 mb-5">
        <h2 className="text-[17px] mb-2" style={{ fontWeight: 700 }}>
          Your data
        </h2>
        <p className="text-[14px] mb-4" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.55 }}>
          Get a copy of everything we hold for your workspace, as one file you can keep or move.
        </p>
        <a href="/app/settings/export" download className="mkt-btn mkt-btn-ghost no-underline">
          Download my data
        </a>
      </section>

      <section className="mkt-card p-6 mb-5">
        <h2 className="text-[17px] mb-2" style={{ fontWeight: 700 }}>
          Terms and privacy
        </h2>
        <p className="text-[14px] m-0" style={{ color: "var(--aurora-text-muted)", lineHeight: 1.55 }}>
          {accepted ? `You accepted the Terms and Privacy Policy on ${accepted}.` : "Sample data in the demo workspace. No terms were accepted."}{" "}
          <Link href="/terms" className="mkt-link">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="mkt-link">
            Privacy Policy
          </Link>
        </p>
      </section>

      <section className="mkt-card p-6" style={{ borderColor: "#fecaca" }}>
        <h2 className="text-[17px] mb-2" style={{ fontWeight: 700, color: "#dc2626" }}>
          Delete my account
        </h2>
        <DeleteAccount disabled={workspace.isDemo} />
      </section>
    </div>
  );
}
