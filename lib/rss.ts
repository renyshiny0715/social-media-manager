import Parser from "rss-parser";
import { sources, maxArticleAgeDays } from "@/content/sources";
import type { FeedItem } from "./types";

const parser = new Parser({ timeout: 15000 });

export async function fetchFreshArticles(excludeUrls: Set<string>): Promise<FeedItem[]> {
  const cutoff = Date.now() - maxArticleAgeDays * 24 * 60 * 60 * 1000;

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return (feed.items ?? [])
        .filter((item) => {
          const date = item.isoDate ? Date.parse(item.isoDate) : NaN;
          return item.link && item.title && (!Number.isNaN(date) ? date >= cutoff : false);
        })
        .slice(0, 5)
        .map<FeedItem>((item) => ({
          title: item.title!,
          link: item.link!,
          snippet: (item.contentSnippet ?? item.content ?? "").slice(0, 400),
          isoDate: item.isoDate,
          sourceName: source.name,
        }));
    }),
  );

  const items = results
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((item) => !excludeUrls.has(item.link));

  // Newest first, cap the list so the prompt stays reasonable.
  items.sort((a, b) => (b.isoDate ?? "").localeCompare(a.isoDate ?? ""));
  return items.slice(0, 30);
}
