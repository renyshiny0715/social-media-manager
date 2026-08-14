export interface Draft {
  id: string;
  createdAt: string; // ISO
  topic: string;
  angle: string;
  sourceTitle: string;
  sourceUrl: string;
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
}

export interface State {
  usedUrls: string[]; // source article URLs already used in past drafts
  lastRunAt?: string;
}

export interface FeedItem {
  title: string;
  link: string;
  snippet: string;
  isoDate?: string;
  sourceName: string;
}
