import type { FeedItem } from "./types";

// A famous publisher alone does not make an article a technical source.
const advancedTopics: [string, RegExp][] = [
  ["Adaptive test-time compute", /\b(?:test[- ]time|inference[- ]time) (?:compute|computation|scaling)\b/i],
  ["Speculative decoding", /\bspeculative (?:decoding|sampling)\b/i],
  ["GraphRAG community retrieval", /\b(?:graph[- ]?rag|graph[- ]based retrieval)\b/i],
  ["PagedAttention and KV-cache allocation", /\b(?:pagedattention|kv[- ]cache|key[- ]value cach(?:e|ing))\b/i],
  ["Sparse mixture-of-experts routing", /\b(?:mixture[- ]of[- ]experts|sparse expert|expert routing)\b/i],
  ["Agent context compaction and persistent memory", /\b(?:context compaction|agentic memory|persistent agent memory)\b/i],
  ["Reinforcement learning with verifiable rewards", /\b(?:verifiable rewards|rlvr|grpo)\b/i],
  ["Selective state-space models", /\b(?:selective state[- ]space|state[- ]space models?|mamba)\b/i],
  ["Action-conditioned latent world models", /\b(?:world models?|latent dynamics|action[- ]conditioned)\b/i],
  ["Cross-context agent state and verification", /\b(?:agent harness|cross[- ]context|long[- ]horizon agents?)\b/i],
  ["Multi-head latent attention", /\bmulti[- ]head latent attention\b/i],
  ["Late-interaction retrieval", /\b(?:late[- ]interaction|colbert)\b/i],
  ["Prefill-decode disaggregation", /\b(?:disaggregated (?:prefill|serving|inference)|prefill[- /](?:and[- ])?decode)\b/i],
  ["Diffusion language models", /\b(?:diffusion language models?|discrete diffusion)\b/i],
];

export function discoverTechnicalTopics(source: FeedItem): string[] {
  if (source.authority !== "primary") return [];
  if (/\b(?:workshop|webinar|register|summit|attachment|companionship)\b/i.test(source.title)) return [];
  const excerpt = source.snippet;
  // Require mechanism evidence in the excerpt, not just a technical title.
  const signals = excerpt.match(/\b(?:tokens?|verifiers?|routing|router|cache|blocks?|latent|sampling|rewards?|gradients?|parameters?|embeddings?|inference|decoding|attention|recurrent|retrieval|compaction|state|checkpoint|memory|graph|training|verification|summari[sz](?:e|es|ation))\b/gi) ?? [];
  if (new Set(signals.map((s) => s.toLowerCase())).size < 2) return [];
  return advancedTopics.filter(([, pattern]) => pattern.test(`${source.title}\n${excerpt}`)).map(([topic]) => topic);
}

export function prepareExplainerSources(articles: FeedItem[], references: FeedItem[]): FeedItem[] {
  const referenceByUrl = new Map(references.map((r) => [r.link, r]));
  const combined = articles.map((article) => {
    const reference = referenceByUrl.get(article.link);
    // Preserve curated evidence when the same URL has only a short RSS teaser.
    return reference ? { ...article, ...reference, isoDate: article.isoDate }
      : { ...article, technicalTopics: discoverTechnicalTopics(article) };
  });
  return [...combined, ...references.filter((r) => !articles.some((a) => a.link === r.link))];
}
