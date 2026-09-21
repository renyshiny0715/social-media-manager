export interface Explainer {
  term: string;
  category: "concept" | "tool" | "company" | "industry";
  definition: string;
  analogy: string;
  keyPoints: string[];
  example: string;
  limitation: string;
  visualTitle: string;
  visualLabels: string[];
  // Explicit infographic copy. Optional only for older saved drafts.
  visualSummary?: string;
  visualDetails?: string[];
  visualExample?: string;
  visualCaveat?: string;
}

export interface Draft {
  id: string;
  createdAt: string; // ISO
  topic: string;
  angle: string;
  // Optional for compatibility with older saved drafts.
  kind?: "article" | "explainer";
  explainer?: Explainer;
  sourceTitle: string;
  sourceUrl: string;
  sourceName?: string; // publication/author, e.g. "McKinsey Insights"
  linkedinPost: string;
  xPost: string;
  imagePrompt: string;
  cardHeadline: string;
  cardSubtitle: string;
  // "ai" = generated PNG stored in the repo, "card" = rendered on the fly by /api/card
  imageType: "ai" | "card";
  published: {
    linkedin?: { at: string; postId?: string };
    x?: { at: string; postId?: string };
  };
  // Pending scheduled publishes: ISO UTC time per platform.
  scheduled?: {
    linkedin?: string;
    x?: string;
  };
}

export interface State {
  usedUrls: string[]; // source article URLs already used in past drafts
  explainedTerms?: string[]; // recent glossary subjects, oldest first
  lastRunAt?: string;
}

export interface FeedItem {
  title: string;
  link: string;
  snippet: string;
  isoDate?: string;
  sourceName: string;
  authority?: "primary" | "editorial";
}
