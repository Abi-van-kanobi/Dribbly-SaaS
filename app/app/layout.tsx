import { requireWorkspace } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { buildBoard } from "@/lib/aligner-board";
import { railCampaigns, type JumpItem } from "@/lib/jump";

const PAGES: JumpItem[] = [
  { id: "home", label: "Home", hint: "Today bar and Work Aligner", href: "/app", group: "Pages" },
  { id: "campaigns", label: "Campaigns", hint: "", href: "/app/campaigns", group: "Pages" },
  { id: "creators", label: "Creators", hint: "", href: "/app/creators", group: "Pages" },
  { id: "payments", label: "Payments", hint: "", href: "/app/payments", group: "Pages" },
  { id: "calendar", label: "Calendar", hint: "", href: "/app/calendar", group: "Pages" },
  { id: "notes", label: "Notes", hint: "", href: "/app/notes", group: "Pages" },
  { id: "contacts", label: "Contacts", hint: "", href: "/app/contacts", group: "Pages" },
  { id: "settings", label: "Settings and privacy", hint: "Download or delete your data", href: "/app/settings", group: "Pages" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, db } = await requireWorkspace();

  // The rail doubles as a status board: each active campaign gets a dot from the same rules as the Work Aligner.
  const [active, everyCampaign, creators] = await Promise.all([
    db.campaign.findMany({
      where: { status: { in: ["LIVE", "IN_REVIEW", "WRAPPING"] } },
      include: { brand: true, creator: true, deliverables: true, invoices: true, alignerItems: { select: { id: true } } },
    }),
    db.campaign.findMany({ select: { id: true, name: true, brand: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.creator.findMany({ select: { id: true, name: true, handle: true }, orderBy: { name: "asc" } }),
  ]);

  const { shown, hiddenCount } = railCampaigns(buildBoard(active, new Date()), 6);

  const jumpItems: JumpItem[] = [
    ...PAGES,
    ...everyCampaign.map((c): JumpItem => ({ id: c.id, label: c.name, hint: c.brand.name, href: `/app/campaigns/${c.id}`, group: "Campaigns" })),
    ...creators.map((c): JumpItem => ({ id: c.id, label: c.name, hint: c.handle, href: `/app/creators?selected=${c.id}`, group: "Creators" })),
  ];

  return (
    <AppShell userName={user.name ?? user.email} workspaceName={workspace.name} campaigns={shown} hiddenCampaigns={hiddenCount} jumpItems={jumpItems}>
      {children}
    </AppShell>
  );
}
