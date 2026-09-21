import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverTechnicalTopics, prepareExplainerSources } from "../lib/explainer-sources.ts";
import { explainerReferences } from "../content/explainers.ts";

const primary = { authority: "primary", sourceName: "Research lab", link: "https://example.com/research" };

test("current technical evidence is eligible while introductory news and workshops are not", () => {
  const technical = { ...primary, title: "Speculative decoding", snippet: "A draft model proposes tokens; the target verifies them using corrective sampling." };
  assert.deepEqual(discoverTechnicalTopics(technical), ["Speculative decoding"]);
  for (const item of [
    { ...technical, authority: "editorial" },
    { ...technical, title: "Speculative decoding workshop" },
    { ...technical, snippet: "The future of AI is here. Join our event." },
    { ...primary, title: "What is RAG?", snippet: "Retrieval supplies information to a model during inference." },
    { ...primary, title: "Chatbot attachment and personality updates", snippet: "Long-term memory stores state for context compaction." },
  ]) assert.deepEqual(discoverTechnicalTopics(item), []);
});

test("fresh articles cannot erase curated evidence when URLs overlap", () => {
  const reference = explainerReferences[1];
  const fresh = { ...reference, snippet: "Read more", technicalTopics: undefined, isoDate: "2026-09-21T00:00:00Z" };
  const result = prepareExplainerSources([fresh], explainerReferences);
  assert.equal(result.filter((r) => r.link === reference.link).length, 1);
  assert.equal(result[0].snippet, reference.snippet);
  assert.deepEqual(result[0].technicalTopics, reference.technicalTopics);
  assert.equal(result[0].isoDate, fresh.isoDate);
});

test("quiet news weeks still supply diverse advanced primary references", () => {
  const result = prepareExplainerSources([], explainerReferences);
  assert.ok(result.length >= 6);
  assert.ok(result.every((s) => s.authority === "primary" && s.technicalTopics.length && !s.isoDate));
  assert.equal(new Set(result.flatMap((s) => s.technicalTopics)).size, result.length);
  assert.ok(result.every((s) => s.snippet.startsWith("Technical background,")));
});
