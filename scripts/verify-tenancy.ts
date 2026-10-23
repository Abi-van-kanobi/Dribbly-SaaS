/**
 * Proves tenant isolation, account deletion, data export and session-token safety.
 * Run with:  npm run verify:tenancy
 *
 * Uses a throwaway SQLite file (prisma/verify-tmp.db). It never touches your dev database.
 * Exits non-zero if any check fails.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATABASE_URL = "file:./verify-tmp.db";
// Uploaded files go to a throwaway folder, never the real .storage.
const storageDir = mkdtempSync(path.join(os.tmpdir(), "ettuno-verify-storage-"));
process.env.STORAGE_DIR = storageDir;
const dbFile = path.join(process.cwd(), "prisma", "verify-tmp.db");

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean) {
  if (ok) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}`);
  }
}

async function rejects(p: Promise<unknown>) {
  try {
    await p;
    return false;
  } catch {
    return true;
  }
}

async function main() {
  for (const f of [dbFile, `${dbFile}-journal`]) if (existsSync(f)) rmSync(f);
  execSync("npx prisma db push --skip-generate", { stdio: "pipe", env: process.env });

  const { PrismaClient } = await import("@prisma/client");
  const { tenantDb } = await import("../lib/tenant");
  const { deleteAccount, exportAccountData } = await import("../lib/gdpr");
  const { createSessionToken, verifySessionToken } = await import("../lib/auth");
  const { currencyForCountry, isCountryCode, isValidTimeZone } = await import("../lib/locale");
  const { getStorage, isStorageConfigured, newFileKey, newPendingKey } = await import("../lib/storage");
  const { saveUploadedFile, removeItem, finalizeDirectUpload } = await import("../lib/aligner-service");
  const { startFakeS3 } = await import("./fake-s3");
  const pins = await import("../lib/pin-service");
  const { filterJump, railCampaigns } = await import("../lib/jump");
  const { createCampaignCore, assignCreatorCore, handleFromName } = await import("../lib/campaign-service");
  const { dayInZone, addDays, daysBetween, dueInfo, carriedLabel, MAX_PINS } = await import("../lib/today");
  const { classifyLink, sniffFile, safeFileName, MAX_FILE_BYTES } = await import("../lib/aligner");
  const { buildBoard } = await import("../lib/aligner-board");
  const { monthGrid, parseMonth, shiftMonth, signalFor, buildCalendarEvents } = await import("../lib/calendar");
  const { SIGNAL } = await import("../lib/signal");
  const storage = getStorage();
  // A real 1x1 PNG.
  const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

  const raw = new PrismaClient();

  async function makeTenant(label: string, invoiceAmount: number) {
    const user = await raw.user.create({ data: { email: `${label}@test.local`, name: label, googleSub: `sub-${label}` } });
    const ws = await raw.workspace.create({ data: { name: `${label} ws`, type: "MANAGER_AGENCY" } });
    await raw.membership.create({ data: { userId: user.id, workspaceId: ws.id } });
    const W = ws.id;
    const brand = await raw.brand.create({ data: { name: `${label} brand`, workspaceId: W } });
    const creator = await raw.creator.create({ data: { name: `${label} creator`, handle: "@x", category: "c", workspaceId: W } });
    const campaign = await raw.campaign.create({
      data: { name: `${label} campaign`, value: 1, deadline: new Date(), brandId: brand.id, creatorId: creator.id, workspaceId: W },
    });
    const deliverable = await raw.deliverable.create({ data: { title: `${label} deliverable`, dueDate: new Date(), campaignId: campaign.id, workspaceId: W } });
    const invoice = await raw.invoice.create({
      data: { number: "1", amount: invoiceAmount, rail: "STRIPE", dueDate: new Date(), campaignId: campaign.id, brandId: brand.id, creatorId: creator.id, workspaceId: W },
    });
    const task = await raw.task.create({ data: { title: `${label} task`, workspaceId: W } });
    const note = await raw.note.create({ data: { title: `${label} note`, body: "b", workspaceId: W } });
    const contact = await raw.contact.create({ data: { name: `${label} contact`, type: "BRAND", workspaceId: W } });
    const alignerNote = await raw.alignerItem.create({ data: { kind: "NOTE", title: `${label} aligner note`, text: "t", workspaceId: W } });
    return { user, ws, brand, creator, campaign, deliverable, invoice, task, note, contact, alignerNote };
  }

  const A = await makeTenant("alpha", 100);
  const B = await makeTenant("bravo", 7);
  const dbA = tenantDb(A.ws.id);

  console.log("\nRead isolation: workspace A sees only its own rows");
  check("creators", (await dbA.creator.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.creator.count()) === 1);
  check("brands", (await dbA.brand.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.brand.count()) === 1);
  check("campaigns", (await dbA.campaign.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.campaign.count()) === 1);
  check("deliverables", (await dbA.deliverable.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.deliverable.count()) === 1);
  check("invoices", (await dbA.invoice.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.invoice.count()) === 1);
  check("tasks", (await dbA.task.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.task.count()) === 1);
  check("notes", (await dbA.note.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.note.count()) === 1);
  check("contacts", (await dbA.contact.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.contact.count()) === 1);
  check("a caller-supplied where cannot widen the scope", (await dbA.campaign.findMany({ where: { workspaceId: B.ws.id } })).length === 0);
  check("a caller-supplied OR cannot widen the scope", (await dbA.brand.findMany({ where: { OR: [{ id: B.brand.id }, { id: A.brand.id }] } })).length === 1);
  check("sum is A's only (100, not 107)", (await dbA.invoice.aggregate({ _sum: { amount: true } }))._sum.amount === 100);
  check("groupBy counts A's only", (await dbA.campaign.groupBy({ by: ["status"], _count: true })).reduce((n, g) => n + g._count, 0) === 1);

  console.log("\nLookup by ID: B's records are invisible to A (the attack on form IDs)");
  check("creator", (await dbA.creator.findUnique({ where: { id: B.creator.id } })) === null);
  check("brand", (await dbA.brand.findUnique({ where: { id: B.brand.id } })) === null);
  check("campaign", (await dbA.campaign.findUnique({ where: { id: B.campaign.id } })) === null);
  check("deliverable", (await dbA.deliverable.findUnique({ where: { id: B.deliverable.id } })) === null);
  check("invoice", (await dbA.invoice.findUnique({ where: { id: B.invoice.id } })) === null);
  check("task", (await dbA.task.findUnique({ where: { id: B.task.id } })) === null);
  check("note", (await dbA.note.findUnique({ where: { id: B.note.id } })) === null);
  check("contact", (await dbA.contact.findUnique({ where: { id: B.contact.id } })) === null);
  check("findUniqueOrThrow rejects", await rejects(dbA.campaign.findUniqueOrThrow({ where: { id: B.campaign.id } })));

  console.log("\nWrites: A cannot change or delete B's data");
  check("update of B's task is rejected", await rejects(dbA.task.update({ where: { id: B.task.id }, data: { done: true } })));
  check("B's task is unchanged", (await raw.task.findUniqueOrThrow({ where: { id: B.task.id } })).done === false);
  check("delete of B's brand is rejected", await rejects(dbA.brand.delete({ where: { id: B.brand.id } })));
  check("B's brand still exists", (await raw.brand.findUnique({ where: { id: B.brand.id } })) !== null);
  const bulk = await dbA.task.updateMany({ where: {}, data: { done: true } });
  check("updateMany with an empty filter touches only A's 1 row", bulk.count === 1);
  check("B's task still not done after A's bulk update", (await raw.task.findUniqueOrThrow({ where: { id: B.task.id } })).done === false);
  const wiped = await dbA.note.deleteMany({});
  check("deleteMany with an empty filter removes only A's 1 row", wiped.count === 1);
  check("B's note survives A's bulk delete", (await raw.note.findUnique({ where: { id: B.note.id } })) !== null);
  const spoofed = await dbA.brand.create({ data: { name: "spoof", workspaceId: B.ws.id } });
  check("create ignores a spoofed workspaceId (stamped as A)", spoofed.workspaceId === A.ws.id);
  await dbA.brand.update({ where: { id: A.brand.id }, data: { name: "renamed", workspaceId: B.ws.id } });
  check("update cannot move a record into another workspace", (await raw.brand.findUniqueOrThrow({ where: { id: A.brand.id } })).workspaceId === A.ws.id);
  check("tenantDb refuses an empty workspace id", (() => { try { tenantDb(""); return false; } catch { return true; } })());

  console.log("\nWork Aligner: isolation");
  check("A sees only its own aligner items", (await dbA.alignerItem.findMany()).every((r) => r.workspaceId === A.ws.id) && (await dbA.alignerItem.count()) === 1);
  check("B's aligner item is invisible by ID", (await dbA.alignerItem.findUnique({ where: { id: B.alignerNote.id } })) === null);
  check("A cannot update B's aligner item", await rejects(dbA.alignerItem.update({ where: { id: B.alignerNote.id }, data: { title: "hacked" } })));
  check("A cannot delete B's aligner item", await rejects(dbA.alignerItem.delete({ where: { id: B.alignerNote.id } })));
  check("B's aligner item is unchanged", (await raw.alignerItem.findUniqueOrThrow({ where: { id: B.alignerNote.id } })).title === "bravo aligner note");

  console.log("\nWork Aligner: uploads");
  const bFile = await saveUploadedFile({ db: tenantDb(B.ws.id), storage, workspaceId: B.ws.id, userId: B.user.id, name: "b-secret.png", bytes: PNG });
  const aFile = await saveUploadedFile({ db: dbA, storage, workspaceId: A.ws.id, userId: A.user.id, name: "../../evil name.png", bytes: PNG, campaignId: A.campaign.id });
  check("a real PNG is accepted", aFile.ok && bFile.ok);
  check("the stored file name is safe (no path parts)", aFile.ok && aFile.item.fileName === "evil name.png");
  check("the file is stored under its workspace folder", aFile.ok && aFile.item.fileKey!.startsWith(A.ws.id + "/") && (await storage.get(aFile.item.fileKey!)) !== null);
  check("filing at upload marks it FILED", aFile.ok && aFile.item.status === "FILED" && aFile.item.campaignId === A.campaign.id);
  const html = await saveUploadedFile({ db: dbA, storage, workspaceId: A.ws.id, userId: A.user.id, name: "page.png", bytes: Buffer.from("<html><script>alert(1)</script></html>") });
  check("HTML renamed to .png is refused (the type comes from the bytes)", !html.ok);
  const svg = await saveUploadedFile({ db: dbA, storage, workspaceId: A.ws.id, userId: A.user.id, name: "x.svg", bytes: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>") });
  check("SVG is refused", !svg.ok);
  const big = await saveUploadedFile({ db: dbA, storage, workspaceId: A.ws.id, userId: A.user.id, name: "big.png", bytes: Buffer.concat([PNG, Buffer.alloc(MAX_FILE_BYTES)]) });
  check("a file over 10 MB is refused", !big.ok);
  const empty = await saveUploadedFile({ db: dbA, storage, workspaceId: A.ws.id, userId: A.user.id, name: "e.png", bytes: Buffer.alloc(0) });
  check("an empty file is refused", !empty.ok);
  check("refused files left nothing in the database", (await raw.alignerItem.count({ where: { workspaceId: A.ws.id } })) === 2);
  check(
    "sniffing recognises PDF, JPEG, GIF and WebP",
    sniffFile(Buffer.from("%PDF-1.7 x"))?.mime === "application/pdf" &&
      sniffFile(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.mime === "image/jpeg" &&
      sniffFile(Buffer.from("GIF89a...."))?.mime === "image/gif" &&
      sniffFile(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]))?.mime === "image/webp",
  );
  check("sniffing refuses plain text and executables", sniffFile(Buffer.from("hello world")) === null && sniffFile(Buffer.from("MZ\x90\x00")) === null);
  check("file name cleaning", safeFileName('a"b<c>.PNG', "image/png") === "abc.png" && safeFileName("", "application/pdf") === "file.pdf");
  check("storage refuses path-traversal keys", (await rejects(storage.get("../../etc/passwd"))) && (await rejects(storage.get(A.ws.id + "/../../x"))));
  check("A cannot remove B's file through the scoped client", bFile.ok && (await removeItem({ db: dbA, storage, id: bFile.item.id })) === false && (await storage.get(bFile.item.fileKey!)) !== null);

  console.log("\nWork Aligner: links");
  check(
    "a Notion link is recognised and titled from its address",
    (() => {
      const l = classifyLink("https://www.notion.so/My-Brief-0123456789abcdef0123456789abcdef");
      return l?.kind === "NOTION" && l.title === "My Brief";
    })(),
  );
  check(
    "Google Doc and Sheet links are recognised",
    classifyLink("https://docs.google.com/document/d/abc/edit")?.kind === "GOOGLE_DOC" && classifyLink("https://docs.google.com/spreadsheets/d/abc/edit")?.kind === "GOOGLE_SHEET",
  );
  check(
    "a bare address gets https and a host title",
    (() => {
      const l = classifyLink("example.com/page");
      return l?.url === "https://example.com/page" && l.kind === "LINK" && l.title === "example.com";
    })(),
  );
  check("a typed title wins", classifyLink("https://example.com", "Brand deck")?.title === "Brand deck");
  check(
    "javascript:, data:, file: and ftp: links are refused",
    ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "ftp://x.com/f", "not a link", "", "localhost"].every((u) => classifyLink(u) === null),
  );

  console.log("\nWork Aligner: bird's-eye board");
  const now = new Date(2026, 9, 10, 12, 0, 0);
  const day = (n: number) => new Date(2026, 9, 10 + n, 9, 0, 0);
  const camp = (id: string, over: Record<string, unknown>) => ({
    id,
    name: id,
    status: "LIVE",
    deadline: day(30),
    brand: { name: "B" },
    creator: { name: "C" },
    deliverables: [],
    invoices: [],
    alignerItems: [],
    ...over,
  });
  const board = buildBoard(
    [
      camp("fine", { deliverables: [{ id: "d1", title: "Reel", stage: "IN_PROGRESS", dueDate: day(10) }] }),
      camp("late-invoice", { invoices: [{ id: "i1", number: "204", status: "OVERDUE", dueDate: day(-3) }] }),
      camp("late-work", { deliverables: [{ id: "d2", title: "Story set", stage: "PLANNED", dueDate: day(-2) }] }),
      camp("soon", { deliverables: [{ id: "d3", title: "Draft reel", stage: "IN_PROGRESS", dueDate: day(1) }] }),
      camp("review", { deliverables: [{ id: "d4", title: "Cut", stage: "IN_REVIEW", dueDate: day(8) }] }),
      camp("done", { deliverables: [{ id: "d5", title: "Post", stage: "LIVE", dueDate: day(-9) }], invoices: [{ id: "i2", number: "1", status: "PAID", dueDate: day(-5) }] }),
      camp("ending", { deadline: day(4), deliverables: [{ id: "d6", title: "Last post", stage: "IN_PROGRESS", dueDate: day(20) }] }),
    ] as never,
    now,
  );
  const lv = Object.fromEntries(board.map((r) => [r.id, r.level]));
  check("an overdue invoice is late", lv["late-invoice"] === "late");
  check("an overdue deliverable is late", lv["late-work"] === "late");
  check("a deliverable due tomorrow and in progress needs attention", lv["soon"] === "attention");
  check("a deliverable waiting for approval needs attention", lv["review"] === "attention");
  check("a campaign ending within a week with work left needs attention", lv["ending"] === "attention");
  check("nothing outstanding is on track", lv["fine"] === "ok" && lv["done"] === "ok");
  check("finished work in the past does not make a campaign late", board.find((r) => r.id === "done")!.signals.length === 0);
  check("late rows sort first and on-track rows last", board.slice(0, 2).every((r) => r.level === "late") && board[board.length - 1].level === "ok");
  check(
    "signal wording is plain",
    board.find((r) => r.id === "late-work")!.signals[0].text === "Story set was due 2 days ago" && board.find((r) => r.id === "late-invoice")!.signals[0].text === "Invoice #204 is 3 days late",
  );

  console.log("\nToday bar: days and time zones");
  const NOW = new Date("2026-10-12T10:00:00Z");
  const lateNight = new Date("2026-10-12T22:30:00Z");
  check("the same instant is a different day in different zones", dayInZone(lateNight, "Europe/Stockholm") === "2026-10-13" && dayInZone(lateNight, "America/Los_Angeles") === "2026-10-12" && dayInZone(lateNight, "UTC") === "2026-10-12");
  check("an invalid time zone falls back to UTC instead of crashing", dayInZone(lateNight, "Not/AZone") === "2026-10-12");
  check("day arithmetic crosses month and year ends", addDays("2026-02-28", 1) === "2026-03-01" && addDays("2026-12-31", 1) === "2027-01-01" && addDays("2026-03-01", -1) === "2026-02-28");
  check("days between two days", daysBetween("2026-10-12", "2026-10-15") === 3 && daysBetween("2026-10-15", "2026-10-12") === -3 && daysBetween("2026-10-24", "2026-10-26") === 2);
  const stockholm = "Europe/Stockholm";
  check("due text: late items say how late, in words", dueInfo(new Date("2026-10-09T10:00:00Z"), "2026-10-12", stockholm).text === "3 days late" && dueInfo(new Date("2026-10-11T10:00:00Z"), "2026-10-12", stockholm).text === "1 day late");
  check("due text: today, tomorrow and later", dueInfo(NOW, "2026-10-12", stockholm).text === "Due today" && dueInfo(new Date("2026-10-13T10:00:00Z"), "2026-10-12", stockholm).text === "Due tomorrow" && dueInfo(new Date("2026-10-20T10:00:00Z"), "2026-10-12", stockholm).text === "Due Oct 20");
  check("due text: tasks show the clock time in the workspace zone", dueInfo(new Date("2026-10-12T12:00:00Z"), "2026-10-12", stockholm, true).text === "Due today, 2:00 PM");
  check("no due date reads plainly and is never late", dueInfo(null, "2026-10-12", stockholm).text === "No due date" && !dueInfo(null, "2026-10-12", stockholm).late);
  check("carried-over wording", carriedLabel("2026-10-11", "2026-10-12") === "From yesterday" && carriedLabel("2026-10-09", "2026-10-12") === "From 3 days ago" && carriedLabel("2026-10-12", "2026-10-12") === null);

  console.log("\nToday bar: pinning rules");
  const ctx = (ws: typeof A, now: Date, tz = stockholm) => ({ workspaceId: ws.ws.id, userId: ws.user.id, timeZone: tz, now });
  const cA = ctx(A, NOW);
  const mkTask = (title: string, ws = A, dueAt: Date | null = NOW) => raw.task.create({ data: { title, dueAt, workspaceId: ws.ws.id } });
  const tasksA = await Promise.all([1, 2, 3, 4, 5, 6, 7].map((i) => mkTask(`pin task ${i}`)));
  const p1 = await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[0].id });
  check("a task can be pinned", p1.ok);
  const p1again = await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[0].id });
  check("pinning the same thing twice keeps one pin", p1again.ok && p1.ok && p1again.pinId === p1.pinId && (await raw.pin.count({ where: { workspaceId: A.ws.id } })) === 1);
  check("a deliverable and an invoice can be pinned too", (await pins.pinItem(dbA, cA, { kind: "DELIVERABLE", id: A.deliverable.id })).ok && (await pins.pinItem(dbA, cA, { kind: "INVOICE", id: A.invoice.id })).ok);
  let bar = await pins.loadBar(dbA, cA);
  check("the bar shows pins in the order they were pinned", bar.cards.length === 3 && bar.cards[0].kind === "TASK" && bar.cards[1].kind === "DELIVERABLE" && bar.cards[2].kind === "INVOICE");
  check("cards carry a title, a subtitle and where to open them", bar.cards[1].title === "alpha deliverable" && bar.cards[1].subtitle === "alpha campaign · alpha creator" && bar.cards[1].openHref === `/app/campaigns/${A.campaign.id}?tab=deliverables` && bar.cards[2].title === "Invoice #1 · renamed" && bar.cards[2].openHref === "/app/payments");
  await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[1].id });
  await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[2].id });
  const sixth = await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[3].id });
  check(`the bar holds at most ${MAX_PINS} and asks which one to drop`, !sixth.ok && "full" in sixth && sixth.cards.length === MAX_PINS);
  check("a refused sixth pin was not saved", (await raw.pin.count({ where: { workspaceId: A.ws.id } })) === MAX_PINS);
  const dropId = bar.cards[0].pinId;
  const swapped = await pins.swapPin(dbA, cA, { dropPinId: dropId, kind: "TASK", id: tasksA[3].id });
  bar = await pins.loadBar(dbA, cA);
  check("swapping drops the chosen pin and pins the new one", swapped.ok && bar.cards.length === MAX_PINS && !bar.cards.some((c) => c.pinId === dropId) && bar.cards.some((c) => c.targetId === tasksA[3].id));
  check("a dropped pin is gone from the database", (await raw.pin.count({ where: { id: dropId } })) === 0);

  const taskCard = bar.cards.find((c) => c.kind === "TASK")!;
  await pins.setDone(dbA, cA, { pinId: taskCard.pinId, done: true });
  bar = await pins.loadBar(dbA, cA);
  check("ticking a pinned task done strikes it on the bar and counts it", bar.cards.find((c) => c.pinId === taskCard.pinId)!.done && bar.doneCount === 1);
  check("ticking a pinned task also completes the task", (await raw.task.findUniqueOrThrow({ where: { id: taskCard.targetId } })).done === true);
  await pins.setDone(dbA, cA, { pinId: taskCard.pinId, done: false });
  check("ticking it back undoes both", (await raw.task.findUniqueOrThrow({ where: { id: taskCard.targetId } })).done === false && (await pins.loadBar(dbA, cA)).doneCount === 0);
  await raw.task.update({ where: { id: taskCard.targetId }, data: { done: true } });
  await pins.syncTaskPin(dbA, cA, taskCard.targetId, true);
  check("ticking the task elsewhere ticks its pin", (await pins.loadBar(dbA, cA)).cards.find((c) => c.pinId === taskCard.pinId)!.done);
  await pins.syncTaskPin(dbA, cA, taskCard.targetId, false);

  const deliverableCard = bar.cards.find((c) => c.kind === "DELIVERABLE")!;
  await pins.setDone(dbA, cA, { pinId: deliverableCard.pinId, done: true });
  check("ticking a pinned deliverable does not change the deliverable itself", (await raw.deliverable.findUniqueOrThrow({ where: { id: deliverableCard.targetId } })).stage === "PLANNED");

  console.log("\nToday bar: midnight, carry-over and time zones");
  const tomorrow = new Date(NOW.getTime() + 86400000);
  const unfinished = bar.cards.find((c) => c.pinId !== deliverableCard.pinId && !c.done && c.kind !== "INVOICE")!;
  const nextDay = await pins.loadBar(dbA, ctx(A, tomorrow));
  check("an unfinished pin carries over and says so", nextDay.cards.find((c) => c.pinId === unfinished.pinId)?.carried === "From yesterday");
  check("a pin ticked off yesterday is gone the next day", !nextDay.cards.some((c) => c.pinId === deliverableCard.pinId));
  check("a finished pin is no longer counted as pinned the next day", !(await pins.pinnedKeys(dbA, ctx(A, tomorrow))).has(`DELIVERABLE:${deliverableCard.targetId}`) && (await pins.pinnedKeys(dbA, cA)).has(`DELIVERABLE:${deliverableCard.targetId}`));
  const repin = await pins.pinItem(dbA, ctx(A, tomorrow), { kind: "DELIVERABLE", id: deliverableCard.targetId });
  check("re-pinning something finished earlier reuses its row, not a duplicate", repin.ok && repin.pinId === deliverableCard.pinId && (await raw.pin.count({ where: { deliverableId: deliverableCard.targetId } })) === 1);

  const lateInvoice = await raw.invoice.create({ data: { number: "L1", amount: 5, rail: "STRIPE", status: "OVERDUE", dueDate: new Date("2026-10-09T10:00:00Z"), campaignId: A.campaign.id, brandId: A.brand.id, creatorId: A.creator.id, workspaceId: A.ws.id } });
  const cardsBefore = (await pins.loadBar(dbA, cA)).cards;
  await pins.unpin(dbA, { pinId: cardsBefore[cardsBefore.length - 1].pinId });
  await pins.pinItem(dbA, cA, { kind: "INVOICE", id: lateInvoice.id });
  const lateCard = (await pins.loadBar(dbA, cA)).cards.find((c) => c.targetId === lateInvoice.id)!;
  check("a late pin says how late", lateCard.due.late && lateCard.due.text === "3 days late");
  await pins.setDone(dbA, cA, { pinId: lateCard.pinId, done: true });
  check("a finished pin is no longer shown as late", !(await pins.loadBar(dbA, cA)).cards.find((c) => c.targetId === lateInvoice.id)!.due.late);

  const snoozeId = (await pins.loadBar(dbA, cA)).cards.find((c) => !c.done)!.pinId;
  await pins.snooze(dbA, cA, { pinId: snoozeId });
  check("Tomorrow takes a pin off today's bar", !(await pins.loadBar(dbA, cA)).cards.some((c) => c.pinId === snoozeId));
  const tomorrowBar = await pins.loadBar(dbA, ctx(A, tomorrow));
  check("and puts it on tomorrow's bar, not marked as carried over", tomorrowBar.cards.find((c) => c.pinId === snoozeId)?.carried === null);
  check("a snoozed pin still counts as pinned (the button shows pinned)", [...(await pins.pinnedKeys(dbA, cA))].length > 0 && (await raw.pin.findUniqueOrThrow({ where: { id: snoozeId } })).showOn === "2026-10-13");

  const lax = ctx(A, lateNight, stockholm);
  const la = ctx(A, lateNight, "America/Los_Angeles");
  await raw.pin.deleteMany({ where: { workspaceId: A.ws.id } });
  const zonePin = await pins.pinItem(dbA, lax, { kind: "TASK", id: tasksA[4].id });
  check("a pin made at 00:30 in Stockholm is for the 13th", zonePin.ok && (await raw.pin.findUniqueOrThrow({ where: { id: zonePin.pinId } })).showOn === "2026-10-13");
  check("the same instant is still the 12th in Los Angeles, so that pin is not on its bar yet", (await pins.loadBar(dbA, la)).cards.length === 0 && (await pins.loadBar(dbA, lax)).cards.length === 1);

  console.log("\nToday bar: candidates and cleanup");
  await raw.pin.deleteMany({ where: { workspaceId: A.ws.id } });
  await pins.pinItem(dbA, cA, { kind: "INVOICE", id: lateInvoice.id });
  const veryLate = await raw.invoice.create({ data: { number: "L2", amount: 5, rail: "STRIPE", status: "OVERDUE", dueDate: new Date("2026-10-07T10:00:00Z"), campaignId: A.campaign.id, brandId: A.brand.id, creatorId: A.creator.id, workspaceId: A.ws.id } });
  const cands = await pins.loadCandidates(dbA, cA);
  check("the picker offers the most overdue item first", cands.length > 0 && cands[0].id === veryLate.id && cands[0].due.late && cands[0].due.text === "5 days late");
  check("the picker leaves out what is already pinned", !cands.some((c) => c.kind === "INVOICE" && c.id === lateInvoice.id));
  check("the picker only offers this workspace's records", cands.every((c) => !c.title.includes("bravo")));
  const doomed = await mkTask("doomed task");
  await pins.pinItem(dbA, cA, { kind: "TASK", id: doomed.id });
  await raw.task.delete({ where: { id: doomed.id } });
  check("deleting a task removes its pin", (await raw.pin.count({ where: { taskId: doomed.id } })) === 0);
  await pins.unpinTarget(dbA, { kind: "INVOICE", id: lateInvoice.id });
  check("unpinning by item removes the pin", (await raw.pin.count({ where: { invoiceId: lateInvoice.id } })) === 0);

  console.log("\nToday bar: isolation");
  const cB = ctx(B, NOW);
  const dbB = tenantDb(B.ws.id);
  const bTask = await mkTask("bravo pin task", B);
  const bPin = await pins.pinItem(dbB, cB, { kind: "TASK", id: bTask.id });
  check("A cannot pin B's records", !(await pins.pinItem(dbA, cA, { kind: "TASK", id: bTask.id })).ok && !(await pins.pinItem(dbA, cA, { kind: "INVOICE", id: B.invoice.id })).ok && !(await pins.pinItem(dbA, cA, { kind: "DELIVERABLE", id: B.deliverable.id })).ok);
  check("A's bar never shows B's pins", !(await pins.loadBar(dbA, cA)).cards.some((c) => c.title.includes("bravo")));
  const bId = bPin.ok ? bPin.pinId : "";
  check("A cannot unpin, tick off, snooze or swap away B's pin", !(await pins.unpin(dbA, { pinId: bId })).ok && !(await pins.setDone(dbA, cA, { pinId: bId, done: true })).ok && !(await pins.snooze(dbA, cA, { pinId: bId })).ok && !(await pins.swapPin(dbA, cA, { dropPinId: bId, kind: "TASK", id: tasksA[5].id })).ok);
  check("B's pin is untouched by all of that", (await raw.pin.findUniqueOrThrow({ where: { id: bId } })).doneOn === null);
  await pins.pinItem(dbA, cA, { kind: "TASK", id: tasksA[5].id });

  console.log("\nSide navigation: Jump to and the campaign rail");
  const J = (id: string, label: string, hint: string, group: "Pages" | "Campaigns" | "Creators") => ({ id, label, hint, href: `/x/${id}`, group });
  const jumpItems = [
    J("p1", "Payments", "", "Pages"),
    J("c1", "Summer Glow", "Lumen Beauty", "Campaigns"),
    J("c2", "Glow Routine", "Greenleaf Naturals", "Campaigns"),
    J("c3", "Autumn Beats", "Northwave Audio", "Campaigns"),
    J("r1", "Elin Lindqvist", "@elinlindqvist", "Creators"),
    J("r2", "Oskar Bergström", "@oskarb", "Creators"),
  ];
  check("an empty search shows the first items in the order given", filterJump(jumpItems, "").map((i) => i.id).join() === "p1,c1,c2,c3,r1,r2");
  check("the limit is respected", filterJump(jumpItems, "", 3).length === 3 && filterJump(jumpItems, "o", 2).length === 2);
  check("names that start with the typed text come first", filterJump(jumpItems, "glow").map((i) => i.id).join() === "c2,c1");
  check("matching ignores capitals and extra spaces", filterJump(jumpItems, "  ELIN ").map((i) => i.id).join() === "r1");
  check("a later word in a name matches", filterJump(jumpItems, "lind")[0]?.id === "r1" && filterJump(jumpItems, "beats")[0]?.id === "c3");
  check("typing part of a name in the middle still finds it", filterJump(jumpItems, "ments")[0]?.id === "p1");
  check("a brand or handle in the hint finds the campaign or creator", filterJump(jumpItems, "northwave")[0]?.id === "c3" && filterJump(jumpItems, "@oskarb")[0]?.id === "r2");
  check("no match gives an empty list, not an error", filterJump(jumpItems, "zzzz").length === 0);
  const mkRow = (id: string, level: "late" | "attention" | "ok", note: string | null) => ({ id, name: id, brand: "B", creator: "C", level, signals: note ? [{ level: level as "late" | "attention", text: note }] : [], deliverablesDone: 0, deliverablesTotal: 0, nextDue: null, filedCount: 0 });
  const rail = railCampaigns([mkRow("a", "late", "Invoice #1 is 2 days late"), mkRow("b", "attention", "Cut is waiting for approval"), mkRow("c", "ok", null), mkRow("d", "ok", null)], 3);
  check("the rail keeps the board's order (most urgent first)", rail.shown.map((r) => r.id).join() === "a,b,c");
  check("the rail caps its length and says how many are hidden", rail.shown.length === 3 && rail.hiddenCount === 1 && railCampaigns([mkRow("a", "ok", null)], 6).hiddenCount === 0);
  check("each rail row carries its status and the first reason", rail.shown[0].level === "late" && rail.shown[0].note === "Invoice #1 is 2 days late" && rail.shown[2].note === null);

  console.log("\nCampaigns: no creator needed");
  const fixedNow = new Date("2026-10-12T10:00:00Z");
  const countOf = async (ws: typeof A) => ({
    campaigns: await raw.campaign.count({ where: { workspaceId: ws.ws.id } }),
    brands: await raw.brand.count({ where: { workspaceId: ws.ws.id } }),
    creators: await raw.creator.count({ where: { workspaceId: ws.ws.id } }),
  });
  const before0 = await countOf(A);
  const noCreator = await createCampaignCore(dbA, A.ws.id, { name: "Brief first", newBrandName: "Fresh Brand Co" }, fixedNow);
  const row0 = noCreator.ok ? await raw.campaign.findUniqueOrThrow({ where: { id: noCreator.campaignId } }) : null;
  check("a campaign needs only a name and a brand", noCreator.ok && row0 !== null);
  check("with no creator it is saved without one", row0?.creatorId === null && row0?.status === "DRAFT");
  check("value defaults to 0 and the deadline to 30 days out", row0?.value === 0 && row0?.deadline.toISOString() === new Date(fixedNow.getTime() + 30 * 86400000).toISOString());
  check("a typed new brand is created for the workspace", (await countOf(A)).brands === before0.brands + 1 && (await raw.brand.findFirstOrThrow({ where: { name: "Fresh Brand Co" } })).workspaceId === A.ws.id);

  const withNew = await createCampaignCore(dbA, A.ws.id, { name: "With a new creator", newBrandName: "fresh brand co", newCreatorName: "Lena Åkesson", value: "1500", deadline: "2026-11-30" }, fixedNow);
  const row1 = withNew.ok ? await raw.campaign.findUniqueOrThrow({ where: { id: withNew.campaignId }, include: { creator: true } }) : null;
  check("a typed brand that already exists (ignoring capitals) is reused, not duplicated", (await countOf(A)).brands === before0.brands + 1);
  check("a typed new creator is created and linked", row1?.creator?.name === "Lena Åkesson" && row1.creator.workspaceId === A.ws.id && row1.creator.category === "General");
  check("the new creator gets a handle made from the name", row1?.creator?.handle === "@lenaakesson" && handleFromName("Elin Lindqvist") === "@elinlindqvist" && handleFromName("   ") === "@creator");
  check("value and deadline are used when given", row1?.value === 1500 && row1?.deadline.toISOString().slice(0, 10) === "2026-11-30");
  const again = await createCampaignCore(dbA, A.ws.id, { name: "Same creator again", newBrandName: "x", newCreatorName: "  LENA åkesson " }, fixedNow);
  check("typing an existing creator's name again reuses them", again.ok && (await raw.creator.count({ where: { workspaceId: A.ws.id, name: "Lena Åkesson" } })) === 1);
  const picked = await createCampaignCore(dbA, A.ws.id, { name: "Picked creator", brandId: A.brand.id, creatorId: A.creator.id }, fixedNow);
  check("an existing brand and creator can still be picked", picked.ok && (await raw.campaign.findUniqueOrThrow({ where: { id: picked.campaignId } })).creatorId === A.creator.id);
  check("a negative or non-numeric value becomes 0", (await (async () => { const r = await createCampaignCore(dbA, A.ws.id, { name: "neg", newBrandName: "x", value: "-50" }, fixedNow); const r2 = await createCampaignCore(dbA, A.ws.id, { name: "nan", newBrandName: "x", value: "abc" }, fixedNow); return r.ok && r2.ok && (await raw.campaign.findUniqueOrThrow({ where: { id: r.campaignId } })).value === 0 && (await raw.campaign.findUniqueOrThrow({ where: { id: r2.campaignId } })).value === 0; })()));

  const countsBeforeRefusals = await countOf(A);
  const refusals = [
    await createCampaignCore(dbA, A.ws.id, { name: "", newBrandName: "x" }, fixedNow),
    await createCampaignCore(dbA, A.ws.id, { name: "No brand" }, fixedNow),
    await createCampaignCore(dbA, A.ws.id, { name: "Bad date", newBrandName: "Brand That Must Not Appear", deadline: "not-a-date" }, fixedNow),
    await createCampaignCore(dbA, A.ws.id, { name: "Foreign brand", brandId: B.brand.id }, fixedNow),
    await createCampaignCore(dbA, A.ws.id, { name: "Foreign creator", newBrandName: "Brand That Must Not Appear", creatorId: B.creator.id }, fixedNow),
    await createCampaignCore(dbA, A.ws.id, { name: "x".repeat(121), newBrandName: "x" }, fixedNow),
  ];
  check("a missing name, a missing brand and a bad date are refused with a message", refusals.slice(0, 3).every((r) => !r.ok && r.error.length > 0));
  check("another workspace's brand or creator is refused", !refusals[3].ok && !refusals[4].ok);
  check("an over-long name is refused", !refusals[5].ok);
  const countsAfterRefusals = await countOf(A);
  check("refused requests create nothing, not even a stray brand or creator", JSON.stringify(countsBeforeRefusals) === JSON.stringify(countsAfterRefusals) && (await raw.brand.count({ where: { name: "Brand That Must Not Appear" } })) === 0);

  console.log("\nCampaigns: assigning a creator later");
  const unassigned = noCreator.ok ? noCreator.campaignId : "";
  const unpaid = await raw.invoice.create({ data: { number: "U1", amount: 10, rail: "STRIPE", status: "PENDING", dueDate: new Date(), campaignId: unassigned, brandId: A.brand.id, creatorId: null, workspaceId: A.ws.id } });
  const paid = await raw.invoice.create({ data: { number: "U2", amount: 10, rail: "STRIPE", status: "PAID", dueDate: new Date(), campaignId: unassigned, brandId: A.brand.id, creatorId: A.creator.id, workspaceId: A.ws.id } });
  check("an invoice can exist on a campaign that has no creator yet", unpaid.creatorId === null);
  const assigned = await assignCreatorCore(dbA, A.ws.id, { campaignId: unassigned, creatorId: A.creator.id });
  check("a creator can be assigned afterwards", assigned.ok && (await raw.campaign.findUniqueOrThrow({ where: { id: unassigned } })).creatorId === A.creator.id);
  check("unpaid invoices follow the new creator and paid ones keep theirs", (await raw.invoice.findUniqueOrThrow({ where: { id: unpaid.id } })).creatorId === A.creator.id && (await raw.invoice.findUniqueOrThrow({ where: { id: paid.id } })).creatorId === A.creator.id);
  const changed = await assignCreatorCore(dbA, A.ws.id, { campaignId: unassigned, newCreatorName: "Brand New Person" });
  const newPerson = await raw.creator.findFirst({ where: { workspaceId: A.ws.id, name: "Brand New Person" } });
  check("the creator can be changed to a newly typed name", changed.ok && newPerson !== null && (await raw.campaign.findUniqueOrThrow({ where: { id: unassigned } })).creatorId === newPerson.id);
  check("on a change, the unpaid invoice moves and the paid one stays put", (await raw.invoice.findUniqueOrThrow({ where: { id: unpaid.id } })).creatorId === newPerson?.id && (await raw.invoice.findUniqueOrThrow({ where: { id: paid.id } })).creatorId === A.creator.id);
  check("assigning with nothing chosen is refused", !(await assignCreatorCore(dbA, A.ws.id, { campaignId: unassigned })).ok);
  check("another workspace's campaign or creator cannot be used", !(await assignCreatorCore(dbA, A.ws.id, { campaignId: B.campaign.id, creatorId: A.creator.id })).ok && !(await assignCreatorCore(dbA, A.ws.id, { campaignId: unassigned, creatorId: B.creator.id })).ok);
  check("B's campaign was not changed by those attempts", (await raw.campaign.findUniqueOrThrow({ where: { id: B.campaign.id } })).creatorId === B.creator.id);

  console.log("\nExport: only the owner's own data");
  const exported = await exportAccountData(raw, A.user.id, A.ws.id, storage);
  const exportedText = JSON.stringify(exported);
  check("contains A's campaign", exportedText.includes("alpha campaign"));
  check("contains none of B's data", !exportedText.includes("bravo") && !exportedText.includes(B.ws.id));
  check("includes A's uploaded file bytes", exportedText.includes(PNG.toString("base64")) && exportedText.includes("evil name.png"));
  check("never leaks internal storage keys", !exportedText.includes("fileKey"));
  check("includes A's pins and none of B's", exportedText.includes('"pins"') && exportedText.includes(tasksA[5].id) && !exportedText.includes(bTask.id));

  console.log("\nAccount deletion (right to erasure)");
  await deleteAccount(raw, B.user.id, storage);
  const left = {
    user: await raw.user.count({ where: { id: B.user.id } }),
    workspace: await raw.workspace.count({ where: { id: B.ws.id } }),
    membership: await raw.membership.count({ where: { workspaceId: B.ws.id } }),
    creator: await raw.creator.count({ where: { workspaceId: B.ws.id } }),
    brand: await raw.brand.count({ where: { workspaceId: B.ws.id } }),
    campaign: await raw.campaign.count({ where: { workspaceId: B.ws.id } }),
    deliverable: await raw.deliverable.count({ where: { workspaceId: B.ws.id } }),
    invoice: await raw.invoice.count({ where: { workspaceId: B.ws.id } }),
    task: await raw.task.count({ where: { workspaceId: B.ws.id } }),
    note: await raw.note.count({ where: { workspaceId: B.ws.id } }),
    contact: await raw.contact.count({ where: { workspaceId: B.ws.id } }),
    alignerItem: await raw.alignerItem.count({ where: { workspaceId: B.ws.id } }),
    pin: await raw.pin.count({ where: { workspaceId: B.ws.id } }),
  };
  check("every one of B's rows is gone from the database", Object.values(left).every((n) => n === 0));
  check("B's uploaded files are gone from storage", bFile.ok && (await storage.get(bFile.item.fileKey!)) === null);
  check("A's uploaded file survives B's deletion", aFile.ok && (await storage.get(aFile.item.fileKey!)) !== null);
  check("A's account is untouched", (await raw.user.count({ where: { id: A.user.id } })) === 1 && (await dbA.campaign.count()) === (await raw.campaign.count({ where: { workspaceId: A.ws.id } })) && (await dbA.campaign.count()) > 1);

  console.log("\nStorage driver selection");
  const envKeys = ["STORAGE_DRIVER", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_JURISDICTION", "R2_ENDPOINT", "NODE_ENV"] as const;
  const savedStorageEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  const penv = process.env as Record<string, string | undefined>;
  const resetEnv = () => {
    for (const k of envKeys) {
      if (savedStorageEnv[k] === undefined) delete penv[k];
      else penv[k] = savedStorageEnv[k];
    }
  };
  const clearStorageEnv = () => {
    for (const k of envKeys) if (k !== "NODE_ENV") delete penv[k];
  };
  clearStorageEnv();
  penv.NODE_ENV = "production";
  check("production with no driver chosen refuses uploads", !isStorageConfigured());
  penv.STORAGE_DRIVER = "r2";
  check("r2 chosen but credentials missing refuses uploads", !isStorageConfigured());
  Object.assign(penv, { R2_ACCOUNT_ID: "acct123", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_BUCKET: "bkt" });
  check("r2 with all settings is ready", isStorageConfigured());
  delete penv.R2_BUCKET;
  check("r2 missing the bucket name refuses uploads", !isStorageConfigured());
  clearStorageEnv();
  penv.STORAGE_DRIVER = "local";
  check("local disk is allowed in production only when chosen explicitly", isStorageConfigured());
  clearStorageEnv();
  penv.NODE_ENV = "development";
  check("development defaults to local disk", isStorageConfigured());
  resetEnv();

  console.log("\nCloudflare R2 driver (against a fake S3 server)");
  const fake = await startFakeS3({ bucket: "ettuno-test", pageSize: 3 });
  Object.assign(penv, {
    STORAGE_DRIVER: "r2",
    R2_ENDPOINT: fake.url,
    R2_ACCESS_KEY_ID: "test-key",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_BUCKET: "ettuno-test",
  });
  delete penv.R2_ACCOUNT_ID;
  delete penv.R2_JURISDICTION;
  const r2 = getStorage();
  const r2dbA = tenantDb(A.ws.id);

  // Signing is done offline, so a presigned URL shows which address the driver would really call.
  const hostFor = async (extra: Record<string, string>) => {
    const saved = { endpoint: penv.R2_ENDPOINT };
    delete penv.R2_ENDPOINT;
    delete penv.R2_JURISDICTION;
    Object.assign(penv, { R2_ACCOUNT_ID: "acct123", ...extra });
    try {
      const url = (await getStorage().direct!.presign(newPendingKey(A.ws.id), { contentType: "image/png", size: 10 })).url;
      return new URL(url).host;
    } finally {
      delete penv.R2_ACCOUNT_ID;
      delete penv.R2_JURISDICTION;
      penv.R2_ENDPOINT = saved.endpoint;
    }
  };
  check("an EU jurisdiction bucket uses the EU address", (await hostFor({ R2_JURISDICTION: "eu" })) === "acct123.eu.r2.cloudflarestorage.com");
  check("a default bucket uses the standard address", (await hostFor({})) === "acct123.r2.cloudflarestorage.com");

  const k1 = newFileKey(A.ws.id);
  await r2.put(k1, PNG, "image/png");
  check("put then get returns the same bytes", (await r2.get(k1))?.equals(PNG) === true);
  const opened = await r2.open(k1);
  const streamed = opened ? Buffer.from(await new Response(opened.body).arrayBuffer()) : null;
  check("open streams the same bytes with their size", streamed?.equals(PNG) === true && opened?.size === PNG.length);
  check("get of a missing key is null, not an error", (await r2.get(newFileKey(A.ws.id))) === null && (await r2.open(newFileKey(A.ws.id))) === null);
  await r2.delete(k1);
  check("delete removes the object, and deleting again is harmless", (await r2.get(k1)) === null && (await r2.delete(k1).then(() => true).catch(() => false)));
  check("bad keys are refused before any network call", (await rejects(r2.get("../x"))) && (await rejects(r2.put("a/b", PNG))));

  const keep = newFileKey(B.ws.id);
  await r2.put(keep, PNG);
  const other = newPendingKey(B.ws.id);
  await r2.put(other, PNG);
  for (let i = 0; i < 5; i++) await r2.put(newFileKey(A.ws.id), PNG);
  for (let i = 0; i < 4; i++) await r2.put(newPendingKey(A.ws.id), PNG);
  const listsBefore = fake.listCalls();
  await r2.deleteWorkspace(A.ws.id);
  const remaining = [...fake.objects.keys()];
  check("deleteWorkspace follows paging and removes every file and pending upload", !remaining.some((k) => k.includes(A.ws.id)) && fake.listCalls() - listsBefore >= 4);
  check("deleteWorkspace leaves other workspaces' files alone", remaining.includes(keep) && remaining.includes(other));
  await r2.deleteWorkspace(B.ws.id);

  console.log("\nCloudflare R2: browser-to-bucket uploads");
  const direct = r2.direct!;
  check("the driver offers direct uploads", !!direct);
  const pk = newPendingKey(A.ws.id);
  const signed = await direct.presign(pk, { contentType: "image/png", size: PNG.length });
  const signedUrl = new URL(signed.url);
  const signedHeaders = (signedUrl.searchParams.get("X-Amz-SignedHeaders") ?? "").split(";");
  check("the upload URL is signed and expires in 5 minutes", signedUrl.searchParams.has("X-Amz-Signature") && signedUrl.searchParams.get("X-Amz-Expires") === "300");
  check("the signature covers the content type and exact length", signedHeaders.includes("content-type") && signedHeaders.includes("content-length"));
  check("the upload URL points at the pending folder of this workspace", signedUrl.pathname.includes(`/pending/${A.ws.id}/`));
  const put = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: new Uint8Array(PNG) });
  check("the browser can upload to the signed URL", put.ok && fake.objects.has(pk));
  const seen = await direct.inspect(pk);
  check("inspect reports the size and first bytes", seen?.size === PNG.length && seen.head.equals(PNG.subarray(0, 16)));
  check("inspect of nothing is null", (await direct.inspect(newPendingKey(A.ws.id))) === null);

  const before = await raw.alignerItem.count({ where: { workspaceId: A.ws.id } });
  const ok = await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: pk, name: "Chat photo.PNG", campaignId: A.campaign.id });
  check("a good upload is accepted and filed", ok.ok && ok.item.status === "FILED" && ok.item.mimeType === "image/png" && ok.item.fileName === "Chat photo.png");
  check("it moved from pending to the real folder", ok.ok && !fake.objects.has(pk) && fake.objects.has(ok.item.fileKey!) && ok.item.fileKey!.startsWith(`${A.ws.id}/`));
  check("it is stored under the type found from its bytes", ok.ok && fake.objects.get(ok.item.fileKey!)?.contentType === "image/png");
  check("exactly one database row was added", (await raw.alignerItem.count({ where: { workspaceId: A.ws.id } })) === before + 1);
  check("completing the same upload twice fails", !(await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: pk, name: "x.png" })).ok);

  const fakePending = newPendingKey(A.ws.id);
  await r2.put(fakePending, Buffer.from("<html><script>alert(1)</script></html>"), "image/png");
  const bad = await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: fakePending, name: "evil.png" });
  check("HTML uploaded as a PNG is refused and its object deleted", !bad.ok && !fake.objects.has(fakePending));

  const bigPending = newPendingKey(A.ws.id);
  await r2.put(bigPending, Buffer.concat([PNG, Buffer.alloc(MAX_FILE_BYTES)]), "image/png");
  const tooBig = await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: bigPending, name: "big.png" });
  check("an oversize upload is refused and deleted", !tooBig.ok && !fake.objects.has(bigPending));

  const emptyPending = newPendingKey(A.ws.id);
  await r2.put(emptyPending, Buffer.alloc(0), "image/png");
  check("an empty upload is refused and deleted", !(await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: emptyPending, name: "e.png" })).ok && !fake.objects.has(emptyPending));

  const foreign = newPendingKey(B.ws.id);
  await r2.put(foreign, PNG, "image/png");
  const stolen = await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: foreign, name: "steal.png" });
  check("another workspace's pending upload cannot be claimed", !stolen.ok && fake.objects.has(foreign));
  check("a malformed key is refused", !(await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: "../../etc/passwd", name: "x.png" })).ok);

  const quotaPending = newPendingKey(A.ws.id);
  await r2.put(quotaPending, PNG, "image/png");
  penv.ALIGNER_WORKSPACE_LIMIT_MB = "0.00001";
  const overQuota = await finalizeDirectUpload({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, pendingKey: quotaPending, name: "q.png" });
  const overQuotaServer = await saveUploadedFile({ db: r2dbA, storage: r2, workspaceId: A.ws.id, userId: A.user.id, name: "q2.png", bytes: PNG });
  delete penv.ALIGNER_WORKSPACE_LIMIT_MB;
  check("the per-workspace storage limit blocks direct uploads and deletes the object", !overQuota.ok && /storage limit/.test(overQuota.error) && !fake.objects.has(quotaPending));
  check("the per-workspace storage limit blocks server uploads too", !overQuotaServer.ok && /storage limit/.test(overQuotaServer.error));

  const removed = ok.ok ? await removeItem({ db: r2dbA, storage: r2, id: ok.item.id }) : false;
  check("deleting an item removes its object from the bucket", removed && ok.ok && !fake.objects.has(ok.item.fileKey!));

  await fake.close();
  resetEnv();

  console.log("\nSession tokens");
  const userToken = await createSessionToken({ kind: "user", uid: "u1", wid: "w1" });
  const back = await verifySessionToken(userToken);
  check("user token round-trips", back?.kind === "user" && back.uid === "u1" && back.wid === "w1");
  const onboardingToken = await createSessionToken({ kind: "onboarding", sub: "s1", email: "a@b.co", name: "Ann" });
  const onb = await verifySessionToken(onboardingToken);
  check("onboarding token round-trips", onb?.kind === "onboarding" && onb.email === "a@b.co");
  const [payload, sig] = userToken.split(".");
  const flipped = sig.slice(0, -2) + (sig.endsWith("AA") ? "BB" : "AA");
  check("tampered signature is rejected", (await verifySessionToken(`${payload}.${flipped}`)) === null);
  const forgedPayload = Buffer.from(JSON.stringify({ kind: "user", uid: "u1", wid: "OTHER", exp: Date.now() + 1e9 })).toString("base64url");
  check("a payload edited without re-signing is rejected", (await verifySessionToken(`${forgedPayload}.${sig}`)) === null);
  check("garbage is rejected", (await verifySessionToken("not-a-token")) === null && (await verifySessionToken("")) === null && (await verifySessionToken(undefined)) === null);
  const realNow = Date.now;
  Date.now = () => realNow() + 31 * 24 * 3600 * 1000;
  check("a 31-day-old user token is expired", (await verifySessionToken(userToken)) === null);
  Date.now = () => realNow() + 2 * 3600 * 1000;
  check("a 2-hour-old onboarding token is expired", (await verifySessionToken(onboardingToken)) === null);
  Date.now = realNow;
  const savedSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "a-different-secret";
  check("a token signed with another secret is rejected", (await verifySessionToken(userToken)) === null);
  const env = process.env as Record<string, string | undefined>;
  const savedEnv = env.NODE_ENV;
  delete env.SESSION_SECRET;
  env.NODE_ENV = "production";
  check("production refuses to run without SESSION_SECRET", await rejects(createSessionToken({ kind: "user", uid: "u", wid: "w" })));
  env.NODE_ENV = savedEnv;
  if (savedSecret) env.SESSION_SECRET = savedSecret;

  console.log("\nCalendar");
  const grid = monthGrid(2026, 9);
  check("calendar grid is six full weeks starting on a Sunday", grid.length === 42 && new Date(`${grid[0]}T00:00:00Z`).getUTCDay() === 0);
  check("October 2026 grid starts on Sun 27 Sep and covers the whole month", grid[0] === "2026-09-27" && grid.includes("2026-10-01") && grid.includes("2026-10-31"));
  check("calendar grid days are consecutive", grid.every((d, i) => i === 0 || daysBetween(grid[i - 1], d) === 1));
  check("month parameter: valid, invalid and missing", parseMonth("2026-03", "2026-10-15").key === "2026-03" && parseMonth("2026-13", "2026-10-15").key === "2026-10" && parseMonth(undefined, "2026-10-15").key === "2026-10" && parseMonth("junk", "2026-10-15").month === 9);
  check("month arrows cross the year", shiftMonth(2026, 11, 1) === "2027-01" && shiftMonth(2026, 0, -1) === "2025-12");
  const TODAY = "2026-10-15";
  check("calendar colour: past and not done is late", signalFor("2026-10-14", TODAY, false) === "late");
  check("calendar colour: today through 3 days out needs attention", signalFor("2026-10-15", TODAY, false) === "attention" && signalFor("2026-10-18", TODAY, false) === "attention");
  check("calendar colour: 4 days out is neutral", signalFor("2026-10-19", TODAY, false) === "neutral");
  check("calendar colour: done is green whatever the date", signalFor("2026-09-01", TODAY, true) === "ok" && signalFor("2026-12-01", TODAY, true) === "ok");
  const calBrand = { name: "Lumen Beauty" };
  const evs = buildCalendarEvents(
    {
      deliverables: [
        { id: "d1", title: "Reel #1", stage: "APPROVED", dueDate: new Date("2026-10-10T10:00:00Z"), campaignId: "c1", campaign: { name: "Glow", brand: calBrand, creator: { name: "Elin" } } },
        { id: "d2", title: "Story set", stage: "PLANNED", dueDate: new Date("2026-10-12T10:00:00Z"), campaignId: "c1", campaign: { name: "Glow", brand: calBrand, creator: null } },
        // 23:30 UTC is already the 16th in Stockholm, still the 15th in Los Angeles.
        { id: "d3", title: "Late night post", stage: "IN_PROGRESS", dueDate: new Date("2026-10-15T23:30:00Z"), campaignId: "c1", campaign: { name: "Glow", brand: calBrand, creator: null } },
      ],
      campaigns: [
        { id: "c1", name: "Glow", status: "LIVE", deadline: new Date("2026-10-12T10:00:00Z"), brand: calBrand, creator: null },
        { id: "c2", name: "Done deal", status: "COMPLETED", deadline: new Date("2026-10-01T10:00:00Z"), brand: calBrand, creator: { name: "Elin" } },
      ],
      invoices: [
        { id: "i1", number: "INV-1", status: "PAID", dueDate: new Date("2026-10-05T10:00:00Z"), brand: calBrand, creator: { name: "Elin" } },
        { id: "i2", number: "INV-2", status: "OVERDUE", dueDate: new Date("2026-10-25T10:00:00Z"), brand: calBrand, creator: null },
      ],
    },
    TODAY,
    "Europe/Stockholm",
  );
  const ev = (id: string) => evs.find((e) => e.id === id)!;
  check("calendar shows deliverables, campaign deadlines and invoices", new Set(evs.map((e) => e.kind)).size === 3 && evs.length === 7);
  check("an approved deliverable is green", ev("d-d1").signal === "ok");
  check("a late deliverable is red", ev("d-d2").signal === "late");
  check("a live campaign past its deadline is red, a completed one green", ev("c-c1").signal === "late" && ev("c-c2").signal === "ok");
  check("a paid invoice is green, an overdue one red even if its date is ahead", ev("i-i1").signal === "ok" && ev("i-i2").signal === "late");
  check("calendar days follow the workspace time zone", ev("d-d3").day === "2026-10-16");
  const laEvents = buildCalendarEvents({ deliverables: [{ id: "d3", title: "x", stage: "PLANNED", dueDate: new Date("2026-10-15T23:30:00Z"), campaignId: "c1", campaign: { name: "Glow", brand: calBrand, creator: null } }], campaigns: [], invoices: [] }, TODAY, "America/Los_Angeles");
  check("the same instant lands on the 15th in Los Angeles", laEvents[0].day === "2026-10-15");
  check("every calendar item names its creator, or says there is none", ev("d-d1").detail.includes("Elin") && ev("d-d2").detail.includes("No creator yet") && ev("i-i2").detail.includes("No creator yet") && ev("c-c2").detail.includes("Elin"));
  check("calendar items open the right place", ev("d-d1").href === "/app/campaigns/c1?tab=deliverables" && ev("c-c1").href === "/app/campaigns/c1" && ev("i-i1").href === "/app/payments");
  const sameDay = evs.filter((e) => e.day === "2026-10-12").map((e) => e.signal);
  check("within a day, late items come first", sameDay.length === 2 && sameDay.every((s) => s === "late"));
  check("one colour language is shared", SIGNAL.late.dot === "#dc2626" && SIGNAL.attention.dot === "#ea580c" && SIGNAL.ok.dot === "#16a34a");

  console.log("\nLocale helpers");
  check("India -> INR", currencyForCountry("IN") === "INR");
  check("Germany -> EUR", currencyForCountry("DE") === "EUR");
  check("UK -> GBP, UAE -> AED", currencyForCountry("GB") === "GBP" && currencyForCountry("AE") === "AED");
  check("unknown or missing -> USD", currencyForCountry("US") === "USD" && currencyForCountry(undefined) === "USD" && currencyForCountry("ZZ") === "USD");
  check("time zone validation", isValidTimeZone("Asia/Kolkata") && !isValidTimeZone("Not/AZone") && !isValidTimeZone(""));
  check("country code validation", isCountryCode("IN") && !isCountryCode("india") && !isCountryCode("i"));

  await raw.$disconnect();
  try {
    rmSync(storageDir, { recursive: true, force: true });
  } catch {}
  // Windows can keep the file locked briefly; a leftover temp file is harmless and is wiped on the next run.
  try {
    for (const f of [dbFile, `${dbFile}-journal`]) if (existsSync(f)) rmSync(f);
  } catch {}

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("Failed:\n - " + failures.join("\n - "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
