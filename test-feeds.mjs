import Parser from "rss-parser";
const parser = new Parser({ timeout: 20000 });

const candidates = [
  ["MIT News (AI)", "https://news.mit.edu/rss/topic/artificial-intelligence2"],
  ["Stanford AI Lab Blog", "https://ai.stanford.edu/blog/feed.xml"],
  ["Stanford HAI", "https://hai.stanford.edu/rss.xml"],
  ["Google DeepMind", "https://deepmind.google/blog/rss.xml"],
  ["Microsoft Research", "https://www.microsoft.com/en-us/research/feed/"],
  ["McKinsey Insights", "https://www.mckinsey.com/insights/rss"],
  ["Harvard Business Review", "http://feeds.hbr.org/harvardbusiness"],
  ["Knowledge at Wharton", "https://knowledge.wharton.upenn.edu/feed/"],
  ["a16z", "https://a16z.com/feed/"],
  ["BCG", "https://www.bcg.com/rss.xml"],
  ["Deloitte Insights", "https://www2.deloitte.com/us/en/insights.rss.xml"],
];

for (const [name, url] of candidates) {
  try {
    const feed = await parser.parseURL(url);
    const n = feed.items?.length ?? 0;
    const latest = feed.items?.[0]?.isoDate ?? feed.items?.[0]?.pubDate ?? "?";
    console.log(`OK    ${name}: ${n} items, latest ${latest}`);
  } catch (e) {
    console.log(`FAIL  ${name}: ${String(e).slice(0, 100)}`);
  }
}
