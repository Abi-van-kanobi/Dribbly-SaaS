export type ArticleType = "BLOG" | "CASE_STUDY" | "PRODUCT_INSIGHT";

export interface Article {
  slug: string;
  type: ArticleType;
  title: string;
  excerpt: string;
  body: string[];
  author: string;
  date: string; // ISO
  readMinutes: number;
  /** Example scenarios, not real customers. Shown with a visible note. Remove once a real customer signs off. */
  illustrative?: boolean;
}

export const articleTypeLabel: Record<ArticleType, string> = {
  BLOG: "Blog",
  CASE_STUDY: "Case study",
  PRODUCT_INSIGHT: "Product insight",
};

export const articleTypePlural: Record<ArticleType, string> = {
  BLOG: "Blog",
  CASE_STUDY: "Case studies",
  PRODUCT_INSIGHT: "Product insights",
};

const TEAM = "Ettuno Team";

export const articles: Article[] = [
  // ---------- Blog ----------
  {
    slug: "signs-your-agency-outgrew-spreadsheets",
    type: "BLOG",
    title: "5 signs your agency has outgrown spreadsheets",
    excerpt:
      "If campaign status lives in someone's head and payment status lives in three different tabs, you've already outgrown the tool. You just haven't replaced it yet.",
    author: TEAM,
    date: "2026-06-02",
    readMinutes: 5,
    body: [
      "Every talent management agency starts the same way: a shared sheet, a WhatsApp group per brand deal, and a founder who remembers which creator owes which deliverable. It works, right up until it doesn't.",
      "The first sign is usually a missed deadline nobody saw coming. The sheet said 'in progress,' but 'in progress' meant three different things depending on who last touched the row.",
      "The second is a payment that goes out twice, or not at all, because the advance was tracked in one tab and the balance in another, and nobody reconciled them against the actual bank statement.",
      "The third is a creator who quietly goes idle for a month because no one had a system for surfacing 'hey, we haven't talked to this person in a while.'",
      "The fourth is a brand brief that got buried in an email thread from six weeks ago, and the creator ships the wrong creative direction as a result.",
      "The fifth, and the one that finally forces the switch, is a new hire who takes two weeks just to understand where anything lives. At that point, the spreadsheet isn't saving time anymore. It's costing it.",
    ],
  },
  {
    slug: "rate-card-that-protects-your-margin",
    type: "BLOG",
    title: "How to structure a creator rate card that protects your margin",
    excerpt:
      "A rate card isn't just a price list. It decides whether a campaign is profitable before you've said yes to it.",
    author: TEAM,
    date: "2026-06-18",
    readMinutes: 7,
    body: [
      "Most agencies price by deliverable type (a Reel, a Story set, a static post) and stop there. That's a reasonable starting point, but it leaves money on the table in two specific ways.",
      "First: usage rights. A brand that wants to run your creator's Reel as a paid ad for six months should pay more than a brand that wants organic-only posting. Build a usage-rights multiplier into the card from day one, not as an awkward renegotiation later.",
      "Second: turnaround time. A brief that lands on a Monday with a Wednesday deadline costs your creator (and by extension, you) more than a brief with two weeks of runway. A rush multiplier protects against brands treating your roster as an on-demand content farm.",
      "Third: exclusivity. If a brand wants a category lock, where your creator can't post for a competitor for 60 days, that's inventory you're giving up elsewhere. Price it as its own line item.",
      "The agencies that scale past a handful of creators are the ones whose rate card does this thinking once, up front, so every new deal starts from a defensible number instead of a gut-feel negotiation.",
    ],
  },
  {
    slug: "real-cost-of-whatsapp-payment-chasing",
    type: "BLOG",
    title: "The real cost of chasing brand payments over WhatsApp",
    excerpt:
      "It's not just the awkward follow-up messages. Nobody in your agency can answer 'what are we owed right now?' without doing archaeology first.",
    author: TEAM,
    date: "2026-07-10",
    readMinutes: 4,
    body: [
      "WhatsApp is a fine tool for a quick creative approval. It is a terrible system of record for money.",
      "When 'has the brand paid?' lives in a scroll of chat history, answering it takes minutes even when you know exactly which thread to check, and most agencies are running six, eight, ten of these threads at once.",
      "The deeper cost shows up at the worst possible time: when a brand disputes an invoice, or when you're trying to close your own books at month-end and need a single, trustworthy number for 'total pending.'",
      "A dedicated payments view doesn't need to be complicated. It needs three things WhatsApp structurally can't give you: a status that's the same for everyone looking at it, a total that updates itself, and a history that doesn't scroll away.",
    ],
  },
  {
    slug: "onboarding-checklist-new-creator",
    type: "BLOG",
    title: "A manager's checklist for onboarding a new creator",
    excerpt:
      "The first two weeks with a new creator set the tone for the whole relationship. Here's what to have ready before the first brief goes out.",
    author: TEAM,
    date: "2026-07-15",
    readMinutes: 5,
    body: [
      "Get the rate card conversation done before the first brand deal, not during it. Negotiating pricing under brand deadline pressure is how agencies end up underpricing their own roster.",
      "Collect the boring paperwork early: tax and invoicing details, preferred payout method, and a signed management agreement. Chasing this mid-campaign is a needless delay.",
      "Set expectations on turnaround times and revision rounds explicitly, in writing, before the first brief, not as a reaction to the first time it becomes a problem.",
      "Log their social handles, follower counts, and content categories somewhere structured from day one, so 'who do we have for a fitness brand' is a filter, not a memory exercise.",
      "Finally, put a placeholder check-in on the calendar for 30 days out, even if nothing's active yet. The creators who go quietly idle are almost always the ones nobody scheduled a reason to talk to.",
    ],
  },

  // ---------- Case studies (illustrative scenarios) ----------
  {
    slug: "invoice-turnaround-three-weeks-to-four-days",
    type: "CASE_STUDY",
    illustrative: true,
    title: "A 12-creator agency cut invoice turnaround from 3 weeks to 4 days",
    excerpt:
      "How an agency stopped losing a full day a week to payment checking across three payout methods.",
    author: TEAM,
    date: "2026-07-01",
    readMinutes: 6,
    body: [
      "This agency manages twelve creators across beauty, fitness, and lifestyle, working with brands that pay through different methods depending on where the brand is based.",
      "Before using one workspace, their ops lead spent roughly a day a week just answering 'has this brand paid yet?' That meant checking three separate bank dashboards, cross-referencing a spreadsheet, and chasing overdue invoices by email.",
      "The biggest cost wasn't the checking. It was the lag between a brand paying and the agency knowing about it. Creator payouts routinely slipped a week or more past what was promised.",
      "After moving invoice tracking into one place, with every invoice tagged to its campaign and status from the moment it's created, the weekly reconciliation became a five-minute daily glance.",
      "The result in this scenario: the time from 'brand invoice marked paid' to 'creator payout confirmed' dropped from about three weeks to four days. Payments didn't get faster. Nothing sat unnoticed anymore.",
    ],
  },
  {
    slug: "audio-brand-influencer-program-three-to-forty",
    type: "CASE_STUDY",
    illustrative: true,
    title: "A D2C brand's influencer program: scaling from 3 to 40 creators",
    excerpt:
      "What changes when a brand-side influencer program grows past the size where one person can hold it all in their head.",
    author: TEAM,
    date: "2026-07-20",
    readMinutes: 6,
    body: [
      "When an influencer program is three creators, a spreadsheet and a shared inbox are genuinely fine. The failure isn't a tool problem. It's a scale problem, and it shows up around the 15 to 20 creator mark.",
      "At that size, briefs start colliding. Two creators post the same angle in the same week because nobody can see the whole roster's schedule at once.",
      "Deliverable tracking becomes the bottleneck first. Someone has to know, at a glance, which of 40 creators are on track, which are late, and which haven't started. A shared inbox can't show that.",
      "The fix in this scenario wasn't more headcount. It was a single timeline per campaign, with payment milestones tied to deliverable stages. 'Is this creator ready to be paid' stopped being a Slack question and became a status you could look up.",
    ],
  },
  {
    slug: "solo-creator-five-brand-deals",
    type: "CASE_STUDY",
    illustrative: true,
    title: "A solo creator ran five brand deals without missing a deadline",
    excerpt:
      "No manager, no assistant. Just one place that showed what was due, what was approved and what was owed.",
    author: TEAM,
    date: "2026-08-05",
    readMinutes: 4,
    body: [
      "This creator handles their own brand deals. At peak, five were running at once, each with its own brief, its own approval steps and its own payment date.",
      "Before, the details lived in email threads and a notes app. Every Monday started with a search: which post is due, which brand still owes an approval, which invoice is late.",
      "Now each deal is one campaign with its deliverables, dates and invoice in the same place. The first screen shows what is due today.",
      "In this scenario the biggest change was not speed. It was that nothing surprised them. A late invoice showed up as late the day it slipped, not a month later.",
    ],
  },

  // ---------- Product insights ----------
  {
    slug: "why-ettuno-tracks-payments-and-never-moves-them",
    type: "PRODUCT_INSIGHT",
    title: "Why Ettuno tracks payments and never moves them",
    excerpt: "We show who owes what and what is late. Your money stays where it already is.",
    author: TEAM,
    date: "2026-09-20",
    readMinutes: 3,
    body: [
      "Ettuno records invoices, due dates and whether they are paid. It does not hold, send or receive money.",
      "We chose this on purpose. Moving money means licences, liability and a new place for your cash to sit. Managers don't need another bank. They need to know, at a glance, what is owed and what is late.",
      "So the money keeps moving through the bank, card or payout service you already use. Ettuno is where you see the whole picture.",
      "If you want a payout rail built in one day, that is a different product. This one is about clarity.",
    ],
  },
  {
    slug: "why-the-first-screen-is-today",
    type: "PRODUCT_INSIGHT",
    title: "Why the first screen is Today",
    excerpt: "Most tools open on a list of everything. Ettuno opens on what needs you right now.",
    author: TEAM,
    date: "2026-09-28",
    readMinutes: 3,
    body: [
      "Open most work tools and you get everything: every project, every task, every status. You then spend ten minutes working out what matters.",
      "Ettuno opens on today. Approvals waiting. Tasks due. Payments due. Active campaigns and the next deadlines sit below.",
      "Everything else is one click away. We think the first screen should answer one question: what do I do now?",
    ],
  },
  {
    slug: "one-workspace-not-one-more-tool",
    type: "PRODUCT_INSIGHT",
    title: "One workspace should not mean one more tool",
    excerpt: "Your work already lives in sheets, chats and drives. The goal is to see it in one place, not to move house.",
    author: TEAM,
    date: "2026-10-02",
    readMinutes: 4,
    body: [
      "A creator manager's work is spread across Google Sheets, Drive, Notion, WhatsApp and more. Nobody is going to give all of that up for a new app.",
      "So the aim is not to replace those tools. It is to bring what matters from them into one view: dates, deliverables, who owes what.",
      "We are starting with Google sign-in, then importing campaigns from Google Sheets and linking Google Docs to a campaign. Those are coming next, not live yet.",
      "Whatever tools you use, the answer to 'what is going on today?' should live in one place.",
    ],
  },
  {
    slug: "we-do-not-read-your-email",
    type: "PRODUCT_INSIGHT",
    title: "We do not read your email",
    excerpt: "Signing in with Google gives us your name and email address. That is all.",
    author: TEAM,
    date: "2026-10-05",
    readMinutes: 2,
    body: [
      "When you sign in with Google, Ettuno receives your name and your email address so we can create your account.",
      "We do not read your inbox, and we do not ask for access to it.",
      "You can download everything we hold about your workspace, and delete your account and all of it, from Settings at any time.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function isArticleType(value: string | undefined): value is ArticleType {
  return value === "BLOG" || value === "CASE_STUDY" || value === "PRODUCT_INSIGHT";
}
