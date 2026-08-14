// ============================================================
// CONTENT SOURCES — RSS feeds from well-known companies,
// universities, and respected AI practitioners.
// Add/remove feeds freely; failures are tolerated per-feed.
// ============================================================

export interface Source {
  name: string;
  url: string;
}

export const sources: Source[] = [
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "MIT Technology Review (AI)", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Berkeley BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml" },
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
  { name: "Latent Space", url: "https://www.latent.space/feed" },
  { name: "The Pragmatic Engineer", url: "https://newsletter.pragmaticengineer.com/feed" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
];

// Only consider articles newer than this many days.
export const maxArticleAgeDays = 10;
