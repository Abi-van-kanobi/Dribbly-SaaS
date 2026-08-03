export type ArticleType = "GUIDE" | "BLOG" | "CASE_STUDY";

export interface Article {
  slug: string;
  type: ArticleType;
  title: string;
  excerpt: string;
  body: string[];
  author: string;
  date: string; // ISO
  readMinutes: number;
}

export const articleTypeLabel: Record<ArticleType, string> = {
  GUIDE: "Guide",
  BLOG: "Blog",
  CASE_STUDY: "Case study",
};

export const articles: Article[] = [
  {
    slug: "signs-your-agency-outgrew-spreadsheets",
    type: "BLOG",
    title: "5 signs your agency has outgrown spreadsheets",
    excerpt:
      "If campaign status lives in someone's head and payment status lives in three different tabs, you've already outgrown the tool — you just haven't replaced it yet.",
    author: "Meera Iyer",
    date: "2026-06-02",
    readMinutes: 5,
    body: [
      "Every talent management agency starts the same way: a shared sheet, a WhatsApp group per brand deal, and a founder who remembers which creator owes which deliverable. It works — right up until it doesn't.",
      "The first sign is usually a missed deadline nobody saw coming. The sheet said 'in progress,' but 'in progress' meant three different things depending on who last touched the row.",
      "The second is a payment that goes out twice, or not at all, because the advance was tracked in one tab and the balance in another, and nobody reconciled them against the actual bank statement.",
      "The third is a creator who quietly goes idle for a month because no one had a system for surfacing 'hey, we haven't talked to this person in a while.'",
      "The fourth is a brand brief that got buried in an email thread from six weeks ago, and the creator ships the wrong creative direction as a result.",
      "The fifth — and the one that finally forces the switch — is a new hire who takes two weeks just to understand where anything lives. At that point, the spreadsheet isn't saving time anymore. It's costing it.",
    ],
  },
  {
    slug: "rate-card-that-protects-your-margin",
    type: "GUIDE",
    title: "How to structure a creator rate card that protects your margin",
    excerpt:
      "A rate card isn't just a price list — it's the document that decides whether a campaign is profitable before you've said yes to it.",
    author: "Rohit Malhotra",
    date: "2026-06-18",
    readMinutes: 7,
    body: [
      "Most agencies price by deliverable type — a Reel, a Story set, a static post — and stop there. That's a reasonable starting point, but it leaves money on the table in two specific ways.",
      "First: usage rights. A brand that wants to run your creator's Reel as a paid ad for six months should pay more than a brand that wants organic-only posting. Bake a usage-rights multiplier into the card from day one, not as an awkward renegotiation later.",
      "Second: turnaround time. A brief that lands on a Monday with a Wednesday deadline costs your creator (and by extension, you) more than a brief with two weeks of runway. A rush multiplier protects against brands treating your roster as an on-demand content farm.",
      "Third: exclusivity. If a brand wants a category lock — your creator can't post for a competitor for 60 days — that's inventory you're giving up elsewhere. Price it as its own line item.",
      "The agencies that scale past a handful of creators are the ones whose rate card does this thinking once, up front, so every new deal starts from a defensible number instead of a gut-feel negotiation.",
    ],
  },
  {
    slug: "nirvana-talent-invoice-turnaround",
    type: "CASE_STUDY",
    title: "Nirvana Talent cut invoice turnaround from 3 weeks to 4 days",
    excerpt:
      "How a 12-creator agency stopped losing a full-time day a week to payment reconciliation across three payout rails.",
    author: "Drribly Team",
    date: "2026-07-01",
    readMinutes: 6,
    body: [
      "Nirvana Talent manages a roster of twelve creators across beauty, fitness, and lifestyle, working with brands that pay through Razorpay, Stripe, and Wise depending on where the brand is headquartered.",
      "Before consolidating onto a single workspace, their ops lead spent roughly a day a week just answering 'has this brand paid yet?' — checking three separate bank dashboards, cross-referencing against a spreadsheet, and chasing overdue invoices manually over email.",
      "The biggest cost wasn't the checking — it was the lag between a brand paying and the agency knowing about it, which meant creator payouts (already split from the brand payment) routinely slipped by a week or more past when they were promised.",
      "After moving invoice tracking into one place, with every invoice tagged to its rail, campaign, and status from the moment it's created, the reconciliation work collapsed from a weekly ritual to a five-minute daily glance at a dashboard.",
      "The result: average time from 'brand invoice marked paid' to 'creator payout confirmed' dropped from roughly three weeks to four days — not because payments got faster, but because nothing was sitting unnoticed in a rail nobody had checked that day.",
    ],
  },
  {
    slug: "real-cost-of-whatsapp-payment-chasing",
    type: "BLOG",
    title: "The real cost of chasing brand payments over WhatsApp",
    excerpt:
      "It's not just the awkward follow-up messages — it's that nobody in your agency can answer 'what are we owed right now?' without doing archaeology first.",
    author: "Meera Iyer",
    date: "2026-07-10",
    readMinutes: 4,
    body: [
      "WhatsApp is a fine tool for a quick creative approval. It is a terrible system of record for money.",
      "When 'has the brand paid?' lives in a scroll of chat history, answering it takes minutes even when you know exactly which thread to check — and most agencies are running six, eight, ten of these threads at once.",
      "The deeper cost shows up at the worst possible time: when a brand disputes an invoice, or when you're trying to close your own books at month-end and need a single, trustworthy number for 'total pending.'",
      "A dedicated payments view doesn't need to be complicated. It needs three things WhatsApp structurally can't give you: a status that's the same for everyone looking at it, a total that updates itself, and a history that doesn't scroll away.",
    ],
  },
  {
    slug: "onboarding-checklist-new-creator",
    type: "GUIDE",
    title: "A manager's checklist for onboarding a new creator",
    excerpt:
      "The first two weeks with a new creator set the tone for the entire relationship. Here's what to have ready before the first brief ever goes out.",
    author: "Rohit Malhotra",
    date: "2026-07-15",
    readMinutes: 5,
    body: [
      "Get the rate card conversation done before the first brand deal, not during it. Negotiating pricing under brand deadline pressure is how agencies end up underpricing their own roster.",
      "Collect the boring paperwork early: PAN/GST details for invoicing, preferred payout rail, and a signed management agreement. Chasing this mid-campaign is a needless delay.",
      "Set expectations on turnaround times and revision rounds explicitly, in writing, before the first brief — not as a reaction to the first time it becomes a problem.",
      "Log their social handles, follower counts, and content categories somewhere structured from day one, so 'who do we have for a fitness brand' is a filter, not a memory exercise.",
      "Finally, put a placeholder check-in on the calendar for 30 days out, even if nothing's active yet. The creators who go quietly idle are almost always the ones nobody scheduled a reason to talk to.",
    ],
  },
  {
    slug: "d2c-audio-brand-influencer-program-scaling",
    type: "CASE_STUDY",
    title: "Inside a D2C audio brand's influencer program: scaling from 3 to 40 creators",
    excerpt:
      "What changes operationally when a brand-side influencer program grows past the size where one person can hold it all in their head.",
    author: "Drribly Team",
    date: "2026-07-20",
    readMinutes: 6,
    body: [
      "When a brand's influencer program is three creators, a spreadsheet and a shared inbox are genuinely fine. The failure mode isn't a tool problem — it's a scale problem, and it shows up predictably around the 15-20 creator mark.",
      "At that size, campaign briefs start colliding: two creators posting the same angle in the same week because nobody had visibility across the full roster's schedule at once.",
      "Deliverable tracking becomes the bottleneck first. Someone has to know, at a glance, which of 40 creators are on track, which are late, and which haven't started — and a shared inbox simply doesn't surface that.",
      "The fix that worked wasn't more headcount on the brand side — it was giving the agency partner managing the roster a single timeline view per campaign, with payment milestones tied directly to deliverable stages, so 'is this creator ready to be paid' stopped being a Slack question and started being a status you could just look up.",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
