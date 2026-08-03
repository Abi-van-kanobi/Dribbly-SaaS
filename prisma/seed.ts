import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function days(offset: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
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
  await prisma.contact.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.creator.deleteMany();

  // Upsert (not delete+recreate) so the manager's id — and therefore any
  // browser session cookie already pointing at it — survives a reseed.
  await prisma.manager.upsert({
    where: { email: "priya@drribly.app" },
    update: {},
    create: { name: "Priya Sharma", email: "priya@drribly.app" },
  });

  const [nykaa, boat, mamaearth, muscleblaze, myntra] = await Promise.all([
    prisma.brand.create({ data: { name: "Nykaa" } }),
    prisma.brand.create({ data: { name: "Boat" } }),
    prisma.brand.create({ data: { name: "Mamaearth" } }),
    prisma.brand.create({ data: { name: "MuscleBlaze" } }),
    prisma.brand.create({ data: { name: "Myntra" } }),
  ]);

  const aanya = await prisma.creator.create({
    data: {
      name: "Aanya Sharma",
      handle: "@aanya",
      category: "Beauty",
      instagram: 480000,
      youtube: 120000,
      status: "ACTIVE",
      ratecardNote: "Reel: ₹85k · Story set: ₹35k · Static post: ₹20k",
    },
  });
  const rohan = await prisma.creator.create({
    data: {
      name: "Rohan Mehta",
      handle: "@rohanm",
      category: "Fitness",
      instagram: 210000,
      status: "ACTIVE",
      ratecardNote: "Reel: ₹55k · Story set: ₹22k",
    },
  });
  const kabir = await prisma.creator.create({
    data: {
      name: "Kabir Talwar",
      handle: "@kabirt",
      category: "Lifestyle",
      instagram: 95000,
      status: "ACTIVE",
      ratecardNote: "Reel: ₹30k · Static post: ₹12k",
    },
  });
  await prisma.creator.create({
    data: {
      name: "Neha Dubey",
      handle: "@nehad",
      category: "Fashion",
      instagram: 320000,
      status: "IDLE",
      ratecardNote: "Reel: ₹70k · Story set: ₹28k",
    },
  });

  const summerGlow = await prisma.campaign.create({
    data: {
      name: "Summer Glow",
      status: "LIVE",
      value: 300000,
      deadline: days(9),
      brandId: nykaa.id,
      creatorId: aanya.id,
      deliverables: {
        create: [
          { title: "Concept & script", stage: "APPROVED", dueDate: days(-10), order: 0 },
          { title: "Reel #1 shoot & edit", stage: "LIVE", dueDate: days(-4), order: 1 },
          { title: "Story set", stage: "IN_REVIEW", dueDate: days(0), order: 2 },
          { title: "Reel #2", stage: "IN_PROGRESS", dueDate: days(2), isPaymentMilestone: true, order: 3 },
          { title: "Wrap post", stage: "PLANNED", dueDate: days(9), order: 4 },
        ],
      },
    },
  });

  const monsoonBeats = await prisma.campaign.create({
    data: {
      name: "Monsoon Beats",
      status: "IN_REVIEW",
      value: 160000,
      deadline: days(14),
      brandId: boat.id,
      creatorId: rohan.id,
      deliverables: {
        create: [
          { title: "Concept & script", stage: "APPROVED", dueDate: days(-6), order: 0 },
          { title: "Draft reel", stage: "IN_REVIEW", dueDate: days(0), isPaymentMilestone: true, order: 1 },
          { title: "Story set", stage: "PLANNED", dueDate: days(8), order: 2 },
          { title: "Wrap post", stage: "PLANNED", dueDate: days(14), order: 3 },
        ],
      },
    },
  });

  const glowRoutine = await prisma.campaign.create({
    data: {
      name: "Glow Routine",
      status: "WRAPPING",
      value: 220000,
      deadline: days(4),
      brandId: mamaearth.id,
      creatorId: aanya.id,
      deliverables: {
        create: [
          { title: "Concept & script", stage: "APPROVED", dueDate: days(-20), order: 0 },
          { title: "Reel #1", stage: "LIVE", dueDate: days(-12), order: 1 },
          { title: "Reel #2", stage: "LIVE", dueDate: days(-6), order: 2 },
          { title: "Story set", stage: "APPROVED", dueDate: days(-2), order: 3 },
          { title: "Wrap post", stage: "IN_PROGRESS", dueDate: days(4), isPaymentMilestone: true, order: 4 },
        ],
      },
    },
  });

  const fitFuel = await prisma.campaign.create({
    data: {
      name: "Fit Fuel",
      status: "LIVE",
      value: 120000,
      deadline: days(20),
      brandId: muscleblaze.id,
      creatorId: rohan.id,
      deliverables: {
        create: [
          { title: "Concept & script", stage: "APPROVED", dueDate: days(-8), order: 0 },
          { title: "Reel #1", stage: "LIVE", dueDate: days(-2), order: 1 },
          { title: "Story set", stage: "IN_PROGRESS", dueDate: days(6), order: 2 },
          { title: "Reel #2", stage: "PLANNED", dueDate: days(14), isPaymentMilestone: true, order: 3 },
          { title: "Wrap post", stage: "PLANNED", dueDate: days(20), order: 4 },
        ],
      },
    },
  });

  await prisma.campaign.create({
    data: {
      name: "Festive Edit",
      status: "DRAFT",
      value: 410000,
      deadline: days(38),
      brandId: myntra.id,
      creatorId: kabir.id,
      deliverables: {
        create: [{ title: "Concept & script", stage: "PLANNED", dueDate: days(20), order: 0 }],
      },
    },
  });

  await prisma.invoice.createMany({
    data: [
      { number: "204", amount: 180000, rail: "RAZORPAY", status: "OVERDUE", dueDate: days(-3), campaignId: summerGlow.id, brandId: nykaa.id, creatorId: aanya.id },
      { number: "211", amount: 95000, rail: "RAZORPAY", status: "PENDING", dueDate: days(5), campaignId: monsoonBeats.id, brandId: boat.id, creatorId: rohan.id },
      { number: "198", amount: 220000, rail: "WISE", status: "PAID", dueDate: days(-14), campaignId: glowRoutine.id, brandId: mamaearth.id, creatorId: aanya.id },
      { number: "215", amount: 120000, rail: "STRIPE", status: "PENDING", dueDate: days(10), campaignId: fitFuel.id, brandId: muscleblaze.id, creatorId: rohan.id },
      { number: "190", amount: 410000, rail: "STRIPE", status: "PAID", dueDate: days(-18), campaignId: summerGlow.id, brandId: myntra.id, creatorId: kabir.id },
    ],
  });

  // Historical paid invoices purely to give the dashboard earnings sparkline a real trend to plot.
  await prisma.invoice.createMany({
    data: [
      { number: "301", amount: 180000, rail: "RAZORPAY", status: "PAID", dueDate: monthsAgo(6), campaignId: summerGlow.id, brandId: nykaa.id, creatorId: aanya.id },
      { number: "302", amount: 210000, rail: "STRIPE", status: "PAID", dueDate: monthsAgo(5), campaignId: fitFuel.id, brandId: muscleblaze.id, creatorId: rohan.id },
      { number: "303", amount: 240000, rail: "WISE", status: "PAID", dueDate: monthsAgo(4), campaignId: glowRoutine.id, brandId: mamaearth.id, creatorId: aanya.id },
      { number: "304", amount: 260000, rail: "RAZORPAY", status: "PAID", dueDate: monthsAgo(3), campaignId: monsoonBeats.id, brandId: boat.id, creatorId: rohan.id },
      { number: "305", amount: 310000, rail: "STRIPE", status: "PAID", dueDate: monthsAgo(2), campaignId: summerGlow.id, brandId: nykaa.id, creatorId: aanya.id },
      { number: "306", amount: 340000, rail: "WISE", status: "PAID", dueDate: monthsAgo(1), campaignId: fitFuel.id, brandId: muscleblaze.id, creatorId: rohan.id },
    ],
  });

  await prisma.task.createMany({
    data: [
      { title: "Approve Reel draft — Aanya × Nykaa", dueAt: days(0, 14, 0), tag: "Approval", done: false, campaignId: summerGlow.id, creatorId: aanya.id, order: 0 },
      { title: "Send revised brief to Boat team", dueAt: days(0, 16, 30), tag: "Brief", done: false, campaignId: monsoonBeats.id, creatorId: rohan.id, order: 1 },
      { title: "Review payout batch — 3 creators", dueAt: days(0, 18, 0), tag: "Payments", done: false, order: 2 },
      { title: "Confirm shoot slot — Mamaearth", dueAt: days(0, 9, 0), tag: "Shoot", done: true, campaignId: glowRoutine.id, creatorId: aanya.id, order: 3 },
      { title: "Post campaign brief to Kabir", dueAt: days(0, 9, 30), tag: "Brief", done: true, creatorId: kabir.id, order: 4 },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        kind: "BRIEF",
        title: "Nykaa — Summer Glow brand brief",
        body: "Warm-toned summer look, no pastel backgrounds. Product must appear in first 3 seconds. CTA: swipe-up to Nykaa summer edit. Avoid comparing to competitor brands by name.",
        campaignId: summerGlow.id,
        brandId: nykaa.id,
      },
      {
        kind: "INTERNAL",
        title: "Rohan — working style notes",
        body: "Prefers fitness-focused hooks over lifestyle framing. Keep captions short. Usually turns drafts around within 48h once brief is clear.",
        campaignId: monsoonBeats.id,
        brandId: boat.id,
      },
      {
        kind: "INTERNAL",
        title: "Neha — follow-up reminder",
        body: "No active campaigns in 3 weeks. Reach out with the Q3 fashion brand list before she goes cold.",
      },
    ],
  });

  await prisma.contact.createMany({
    data: [
      { name: "Ritika Nair", role: "Brand Marketing Manager", org: "Nykaa", email: "ritika.nair@nykaa.com", type: "BRAND", brandId: nykaa.id },
      { name: "Devansh Rao", role: "Partnerships Lead", org: "Boat", email: "devansh@boat.co", type: "BRAND", brandId: boat.id },
      { name: "Simran Kaur", role: "Influencer Marketing", org: "Mamaearth", email: "simran@mamaearth.in", type: "BRAND", brandId: mamaearth.id },
      { name: "Aanya Sharma", role: "Creator", org: "@aanya", email: "aanya.creator@gmail.com", type: "CREATOR", creatorId: aanya.id },
      { name: "Rohan Mehta", role: "Creator", org: "@rohanm", email: "rohan.mehta@gmail.com", type: "CREATOR", creatorId: rohan.id },
      { name: "Legal & Contracts — Nirvana Talent", role: "Agency counsel", org: "Nirvana Talent", email: "legal@nirvanatalent.com", type: "AGENCY" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
