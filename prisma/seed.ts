import { PrismaClient } from "@prisma/client";
import { deleteAccount, deleteWorkspaceData } from "../lib/gdpr";
import { addDays, dayInZone } from "../lib/today";

const prisma = new PrismaClient();

const DEMO_EMAIL = "freja@ettuno.example";
// The first demo account used a different person and email. It is retired on every reseed so no
// leftover demo workspace or login is kept around.
const LEGACY_DEMO_EMAILS = ["priya@drribly.app", "freja@drribly.app"];

// Every demo date is built in the demo workspace's own time zone, not the zone of the computer running
// the seed, so "due today at 2:00 PM" really reads 2:00 PM to the people viewing the demo.
const DEMO_TIME_ZONE = "Europe/Stockholm";

function zonedInstant(ymd: string, hour: number, minute: number, timeZone: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (wall - guess));
}

function days(offset: number, hour = 9, minute = 0) {
  const ymd = addDays(dayInZone(new Date(), DEMO_TIME_ZONE), offset);
  return zonedInstant(ymd, hour, minute, DEMO_TIME_ZONE);
}

function monthsAgo(n: number, day = 15) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  for (const email of LEGACY_DEMO_EMAILS) {
    const legacy = await prisma.user.findUnique({ where: { email } });
    if (legacy) await deleteAccount(prisma, legacy.id);
  }

  // The demo person and workspace are kept (found, not recreated) so their ids, and any
  // session already pointing at them, survive a reseed.
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Freja Nyström" },
  });

  const existing = await prisma.membership.findFirst({
    where: { userId: user.id, workspace: { isDemo: true } },
    include: { workspace: true },
  });

  let workspace = existing?.workspace;
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Northlight Talent (demo)",
        type: "MANAGER_AGENCY",
        currency: "USD",
        timezone: DEMO_TIME_ZONE,
        country: "SE",
        isDemo: true,
      },
    });
    await prisma.membership.create({ data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" } });
  }

  // Reset ONLY the demo workspace. Every other customer's data is left alone.
  await deleteWorkspaceData(prisma, workspace.id);

  const W = workspace.id;
  const ws = <T extends object>(rows: T[]) => rows.map((r) => ({ ...r, workspaceId: W }));

  // Fictional brands only. Amounts are US dollars (the demo workspace's currency).
  const [lumen, northwave, greenleaf, peakfuel, atelier] = await Promise.all([
    prisma.brand.create({ data: { name: "Lumen Beauty", workspaceId: W } }),
    prisma.brand.create({ data: { name: "Northwave Audio", workspaceId: W } }),
    prisma.brand.create({ data: { name: "Greenleaf Naturals", workspaceId: W } }),
    prisma.brand.create({ data: { name: "PeakFuel Nutrition", workspaceId: W } }),
    prisma.brand.create({ data: { name: "Atelier Nord", workspaceId: W } }),
  ]);

  const elin = await prisma.creator.create({
    data: {
      name: "Elin Lindqvist",
      handle: "@elinlindqvist",
      category: "Beauty",
      instagram: 480000,
      youtube: 120000,
      status: "ACTIVE",
      ratecardNote: "Reel: $1,200 · Story set: $500 · Static post: $300",
      workspaceId: W,
    },
  });
  const oskar = await prisma.creator.create({
    data: {
      name: "Oskar Bergström",
      handle: "@oskarb",
      category: "Fitness",
      instagram: 210000,
      status: "ACTIVE",
      ratecardNote: "Reel: $800 · Story set: $350",
      workspaceId: W,
    },
  });
  const mateo = await prisma.creator.create({
    data: {
      name: "Mateo Alvarez",
      handle: "@mateoalvarez",
      category: "Lifestyle",
      instagram: 95000,
      status: "ACTIVE",
      ratecardNote: "Reel: $450 · Static post: $180",
      workspaceId: W,
    },
  });
  await prisma.creator.create({
    data: {
      name: "Hannah Brooks",
      handle: "@hannahbrooks",
      category: "Fashion",
      instagram: 320000,
      status: "IDLE",
      ratecardNote: "Reel: $1,000 · Story set: $400",
      workspaceId: W,
    },
  });

  const summerGlow = await prisma.campaign.create({
    data: {
      name: "Summer Glow",
      status: "LIVE",
      value: 4500,
      deadline: days(9),
      brandId: lumen.id,
      creatorId: elin.id,
      workspaceId: W,
      deliverables: {
        create: ws([
          { title: "Concept & script", stage: "APPROVED" as const, dueDate: days(-10), order: 0 },
          { title: "Reel #1 shoot & edit", stage: "LIVE" as const, dueDate: days(-4), order: 1 },
          { title: "Story set", stage: "IN_REVIEW" as const, dueDate: days(0), order: 2 },
          { title: "Reel #2", stage: "IN_PROGRESS" as const, dueDate: days(2), isPaymentMilestone: true, order: 3 },
          { title: "Wrap post", stage: "PLANNED" as const, dueDate: days(9), order: 4 },
        ]),
      },
    },
  });

  const autumnBeats = await prisma.campaign.create({
    data: {
      name: "Autumn Beats",
      status: "IN_REVIEW",
      value: 2400,
      deadline: days(14),
      brandId: northwave.id,
      creatorId: oskar.id,
      workspaceId: W,
      deliverables: {
        create: ws([
          { title: "Concept & script", stage: "APPROVED" as const, dueDate: days(-6), order: 0 },
          { title: "Draft reel", stage: "IN_REVIEW" as const, dueDate: days(0), isPaymentMilestone: true, order: 1 },
          { title: "Story set", stage: "PLANNED" as const, dueDate: days(8), order: 2 },
          { title: "Wrap post", stage: "PLANNED" as const, dueDate: days(14), order: 3 },
        ]),
      },
    },
  });

  const glowRoutine = await prisma.campaign.create({
    data: {
      name: "Glow Routine",
      status: "WRAPPING",
      value: 3300,
      deadline: days(4),
      brandId: greenleaf.id,
      creatorId: elin.id,
      workspaceId: W,
      deliverables: {
        create: ws([
          { title: "Concept & script", stage: "APPROVED" as const, dueDate: days(-20), order: 0 },
          { title: "Reel #1", stage: "LIVE" as const, dueDate: days(-12), order: 1 },
          { title: "Reel #2", stage: "LIVE" as const, dueDate: days(-6), order: 2 },
          { title: "Story set", stage: "APPROVED" as const, dueDate: days(-2), order: 3 },
          { title: "Wrap post", stage: "IN_PROGRESS" as const, dueDate: days(4), isPaymentMilestone: true, order: 4 },
        ]),
      },
    },
  });

  const fitFuel = await prisma.campaign.create({
    data: {
      name: "Fit Fuel",
      status: "LIVE",
      value: 1800,
      deadline: days(20),
      brandId: peakfuel.id,
      creatorId: oskar.id,
      workspaceId: W,
      deliverables: {
        create: ws([
          { title: "Concept & script", stage: "APPROVED" as const, dueDate: days(-8), order: 0 },
          { title: "Reel #1", stage: "LIVE" as const, dueDate: days(-2), order: 1 },
          { title: "Story set", stage: "IN_PROGRESS" as const, dueDate: days(6), order: 2 },
          { title: "Reel #2", stage: "PLANNED" as const, dueDate: days(14), isPaymentMilestone: true, order: 3 },
          { title: "Wrap post", stage: "PLANNED" as const, dueDate: days(20), order: 4 },
        ]),
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Holiday Edit",
      status: "DRAFT",
      value: 6200,
      deadline: days(38),
      brandId: atelier.id,
      creatorId: mateo.id,
      workspaceId: W,
      deliverables: {
        create: ws([{ title: "Concept & script", stage: "PLANNED" as const, dueDate: days(20), order: 0 }]),
      },
    },
  });

  // A campaign that started from a brand's brief, before any creator was chosen.
  await prisma.campaign.create({
    data: {
      name: "Spring Capsule",
      status: "DRAFT",
      value: 2800,
      deadline: days(45),
      brandId: atelier.id,
      workspaceId: W,
      deliverables: {
        create: ws([{ title: "Creative brief", stage: "PLANNED" as const, dueDate: days(25), order: 0 }]),
      },
    },
  });

  await prisma.invoice.createMany({
    data: ws([
      { number: "204", amount: 2700, rail: "PAYPAL" as const, status: "OVERDUE" as const, dueDate: days(-3), campaignId: summerGlow.id, brandId: lumen.id, creatorId: elin.id },
      { number: "211", amount: 1400, rail: "PAYPAL" as const, status: "PENDING" as const, dueDate: days(5), campaignId: autumnBeats.id, brandId: northwave.id, creatorId: oskar.id },
      { number: "198", amount: 3300, rail: "WISE" as const, status: "PAID" as const, dueDate: days(-14), campaignId: glowRoutine.id, brandId: greenleaf.id, creatorId: elin.id },
      { number: "215", amount: 1800, rail: "STRIPE" as const, status: "PENDING" as const, dueDate: days(10), campaignId: fitFuel.id, brandId: peakfuel.id, creatorId: oskar.id },
      { number: "190", amount: 6200, rail: "STRIPE" as const, status: "PAID" as const, dueDate: days(-18), campaignId: summerGlow.id, brandId: atelier.id, creatorId: mateo.id },
    ]),
  });

  // Historical paid invoices purely to give the dashboard earnings sparkline a real trend to plot.
  await prisma.invoice.createMany({
    data: ws([
      { number: "301", amount: 2700, rail: "PAYPAL" as const, status: "PAID" as const, dueDate: monthsAgo(6), campaignId: summerGlow.id, brandId: lumen.id, creatorId: elin.id },
      { number: "302", amount: 3200, rail: "STRIPE" as const, status: "PAID" as const, dueDate: monthsAgo(5), campaignId: fitFuel.id, brandId: peakfuel.id, creatorId: oskar.id },
      { number: "303", amount: 3600, rail: "WISE" as const, status: "PAID" as const, dueDate: monthsAgo(4), campaignId: glowRoutine.id, brandId: greenleaf.id, creatorId: elin.id },
      { number: "304", amount: 3900, rail: "PAYPAL" as const, status: "PAID" as const, dueDate: monthsAgo(3), campaignId: autumnBeats.id, brandId: northwave.id, creatorId: oskar.id },
      { number: "305", amount: 4700, rail: "STRIPE" as const, status: "PAID" as const, dueDate: monthsAgo(2), campaignId: summerGlow.id, brandId: lumen.id, creatorId: elin.id },
      { number: "306", amount: 5100, rail: "WISE" as const, status: "PAID" as const, dueDate: monthsAgo(1), campaignId: fitFuel.id, brandId: peakfuel.id, creatorId: oskar.id },
    ]),
  });

  await prisma.task.createMany({
    data: ws([
      { title: "Approve Reel draft — Elin × Lumen Beauty", dueAt: days(0, 14, 0), tag: "Approval", done: false, campaignId: summerGlow.id, creatorId: elin.id, order: 0 },
      { title: "Send revised brief to Northwave team", dueAt: days(0, 16, 30), tag: "Brief", done: false, campaignId: autumnBeats.id, creatorId: oskar.id, order: 1 },
      { title: "Review payout batch — 3 creators", dueAt: days(0, 18, 0), tag: "Payments", done: false, order: 2 },
      { title: "Confirm shoot slot — Greenleaf Naturals", dueAt: days(0, 9, 0), tag: "Shoot", done: true, campaignId: glowRoutine.id, creatorId: elin.id, order: 3 },
      { title: "Post campaign brief to Mateo", dueAt: days(0, 9, 30), tag: "Brief", done: true, creatorId: mateo.id, order: 4 },
    ]),
  });

  await prisma.note.createMany({
    data: ws([
      {
        kind: "BRIEF" as const,
        title: "Lumen Beauty — Summer Glow brand brief",
        body: "Warm-toned summer look, no pastel backgrounds. Product must appear in first 3 seconds. CTA: link in bio to the summer edit. Avoid comparing to competitor brands by name.",
        campaignId: summerGlow.id,
        brandId: lumen.id,
      },
      {
        kind: "INTERNAL" as const,
        title: "Oskar — working style notes",
        body: "Prefers fitness-focused hooks over lifestyle framing. Keep captions short. Usually turns drafts around within 48h once brief is clear.",
        campaignId: autumnBeats.id,
        brandId: northwave.id,
      },
      {
        kind: "INTERNAL" as const,
        title: "Hannah — follow-up reminder",
        body: "No active campaigns in 3 weeks. Reach out with the Q4 fashion brand list before she goes cold.",
      },
    ]),
  });

  // Example addresses use the reserved ".example" domain, so none of them can be a real mailbox.
  await prisma.contact.createMany({
    data: ws([
      { name: "Sofia Andersson", role: "Brand Marketing Manager", org: "Lumen Beauty", email: "sofia.andersson@lumenbeauty.example", type: "BRAND" as const, brandId: lumen.id },
      { name: "James Carter", role: "Partnerships Lead", org: "Northwave Audio", email: "james.carter@northwave.example", type: "BRAND" as const, brandId: northwave.id },
      { name: "Lena Karlsson", role: "Influencer Marketing", org: "Greenleaf Naturals", email: "lena.karlsson@greenleaf.example", type: "BRAND" as const, brandId: greenleaf.id },
      { name: "Elin Lindqvist", role: "Creator", org: "@elinlindqvist", email: "elin@creator.example", type: "CREATOR" as const, creatorId: elin.id },
      { name: "Oskar Bergström", role: "Creator", org: "@oskarb", email: "oskar@creator.example", type: "CREATOR" as const, creatorId: oskar.id },
      { name: "Legal & Contracts — Northlight Talent", role: "Agency counsel", org: "Northlight Talent", email: "legal@northlighttalent.example", type: "AGENCY" as const },
    ]),
  });

  // Important Today bar samples: one of each state (open, late, carried over, done), with one slot left free.
  const today = dayInZone(new Date(), DEMO_TIME_ZONE);
  const taskByTitle = async (title: string) => prisma.task.findFirstOrThrow({ where: { workspaceId: W, title } });
  const approve = await taskByTitle("Approve Reel draft — Elin × Lumen Beauty");
  const brief = await taskByTitle("Send revised brief to Northwave team");
  const shoot = await taskByTitle("Confirm shoot slot — Greenleaf Naturals");
  const overdueInvoice = await prisma.invoice.findFirstOrThrow({ where: { workspaceId: W, number: "204" } });
  await prisma.pin.createMany({
    data: [
      { kind: "TASK" as const, taskId: approve.id, showOn: today, order: 0 },
      { kind: "INVOICE" as const, invoiceId: overdueInvoice.id, showOn: today, order: 1 },
      { kind: "TASK" as const, taskId: brief.id, showOn: addDays(today, -1), order: 2 },
      { kind: "TASK" as const, taskId: shoot.id, showOn: today, doneOn: today, order: 3 },
    ].map((p) => ({ ...p, workspaceId: W, pinnedById: user.id })),
  });

  // Work Aligner samples: links and notes only. Uploads are switched off in the shared demo.
  const alignerSamples = [
    { kind: "NOTION" as const, title: "Summer Glow creative brief", url: "https://www.notion.so/Summer-Glow-creative-brief-0123456789abcdef0123456789abcdef", campaignId: summerGlow.id },
    { kind: "GOOGLE_DOC" as const, title: "Lumen Beauty contract (signed)", url: "https://docs.google.com/document/d/demo-contract/edit", campaignId: summerGlow.id },
    { kind: "NOTE" as const, title: "Northwave asked for a second draft", text: "Northwave asked for a second draft of the reel with a shorter intro. Oskar to send by Thursday.", campaignId: autumnBeats.id },
    { kind: "NOTE" as const, title: "Call Greenleaf about usage rights", text: "Call Greenleaf about extending usage rights by 3 months before the wrap post goes live.", campaignId: null },
  ];
  for (const item of alignerSamples) {
    await prisma.alignerItem.create({
      data: { ...item, status: item.campaignId ? "FILED" : "INBOX", filedAt: item.campaignId ? new Date() : null, workspaceId: workspace.id },
    });
  }

  console.log("Seed complete (demo workspace only).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
