import Parser from "rss-parser";
const parser = new Parser({ timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (feed-reader)" } });
const candidates = [
  ["Ethan Mollick — One Useful Thing", "https://www.oneusefulthing.org/feed"],
  ["Stratechery (Ben Thompson)", "https://stratechery.com/feed/"],
  ["Exponential View (Azeem Azhar)", "https://www.exponentialview.co/feed"],
  ["Platformer (Casey Newton)", "https://www.platformer.news/rss/"],
  ["Benedict Evans", "https://www.ben-evans.com/benedictevans?format=rss"],
  ["The Economist — Business", "https://www.economist.com/business/rss.xml"],
  ["WIRED (AI)", "https://www.wired.com/feed/tag/ai/latest/rss"],
  ["The Atlantic — Technology", "https://www.theatlantic.com/feed/channel/technology/"],
  ["Harvard Gazette — Sci & Tech", "https://news.harvard.edu/gazette/section/science-technology/feed/"],
  ["HBR", "http://feeds.hbr.org/harvardbusiness"],
  ["Bain Insights", "https://www.bain.com/insights/rss/"],
  ["The Batch (Andrew Ng)", "https://www.deeplearning.ai/the-batch/feed/"],
];
for (const [name, url] of candidates) {
  try {
    const feed = await parser.parseURL(url);
    console.log(`OK    ${name}: ${feed.items?.length ?? 0} items, latest ${feed.items?.[0]?.isoDate ?? feed.items?.[0]?.pubDate ?? "?"}`);
  } catch (e) { console.log(`FAIL  ${name}: ${String(e).slice(0, 70)}`); }
}
