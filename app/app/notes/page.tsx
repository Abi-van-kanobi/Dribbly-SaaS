import { prisma } from "@/lib/prisma";
import { NewNoteDialog } from "@/components/NewNoteDialog";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string; brandId?: string }>;
}) {
  const params = await searchParams;

  const [notes, campaigns, brands] = await Promise.all([
    prisma.note.findMany({
      where: { campaignId: params.campaignId, brandId: params.brandId },
      include: { campaign: true, brand: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mkt">
      <div className="flex items-center justify-between mb-4.5" style={{ marginBottom: 18 }}>
        <h1 className="text-[26px]" style={{ fontWeight: 800 }}>
          Notes
        </h1>
        <NewNoteDialog campaigns={campaigns} brands={brands} />
      </div>

      <div className="flex flex-col gap-3">
        {notes.map((note) => (
          <div key={note.id} className="mkt-card p-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="mkt-tag mkt-tag-outline">{note.kind === "BRIEF" ? "Brief" : "Internal"}</span>
              {note.campaign && (
                <span className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
                  {note.campaign.name}
                </span>
              )}
              {note.brand && (
                <span className="text-[12px]" style={{ color: "var(--aurora-text-muted)" }}>
                  {note.brand.name}
                </span>
              )}
              <h4 className="text-[14.5px] m-0" style={{ marginLeft: "auto", fontWeight: 600 }}>
                {note.title}
              </h4>
            </div>
            <p className="text-[13.5px] m-0" style={{ color: "var(--aurora-text-muted)" }}>
              {note.body}
            </p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
            No notes yet — add your first brief or internal note.
          </p>
        )}
      </div>
    </div>
  );
}
