// ============================================================
// CONTENT SOURCES — business-leaning mix: consulting firms,
// business schools, and major AI companies/media.
// Add/remove feeds freely; failures are tolerated per-feed.
// ============================================================

export interface Source {
  name: string;
  url: string;
}

export const sources: Source[] = [
  // Consulting & business schools (AI transformation, enterprise value)
  { name: "McKinsey Insights", url: "https://www.mckinsey.com/insights/rss" },
  { name: "MIT Sloan Management Review", url: "https://sloanreview.mit.edu/feed/" },
  { name: "Knowledge at Wharton", url: "https://knowledge.wharton.upenn.edu/feed/" },
  // Famous magazines
  { name: "The Economist (Business)", url: "https://www.economist.com/business/rss.xml" },
  { name: "WIRED (AI)", url: "https://www.wired.com/feed/tag/ai/latest/rss" },
  { name: "The Atlantic (Technology)", url: "https://www.theatlantic.com/feed/channel/technology/" },
  { name: "Fortune (AI)", url: "https://fortune.com/feed/fortune-feeds/?id=3230629" },
  { name: "MIT Technology Review (AI)", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  // Universities
  { name: "MIT News (AI)", url: "https://news.mit.edu/rss/topic/artificial-intelligence2" },
  { name: "Harvard Gazette (Sci & Tech)", url: "https://news.harvard.edu/gazette/section/science-technology/feed/" },
  // Famous voices on AI & business
  { name: "Ethan Mollick — One Useful Thing", url: "https://www.oneusefulthing.org/feed" },
  { name: "Stratechery — Ben Thompson", url: "https://stratechery.com/feed/" },
  { name: "Exponential View — Azeem Azhar", url: "https://www.exponentialview.co/feed" },
  { name: "Platformer — Casey Newton", url: "https://www.platformer.news/rss/" },
  { name: "Benedict Evans", url: "https://www.ben-evans.com/benedictevans?format=rss" },
  // AI companies & industry media
  { name: "OpenAI News", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
];

// Only consider articles newer than this many days.
export const maxArticleAgeDays = 10;
