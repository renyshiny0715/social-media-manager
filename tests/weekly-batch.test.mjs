import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDraftBatch, imagePromptForDraft } from "../lib/draft-batch.ts";
import { withSourceLink } from "../lib/source-comment.ts";

const sources = [
  { title: "Official A", link: "https://example.com/a", sourceName: "University A", authority: "primary" },
  { title: "Official B", link: "https://example.com/b", sourceName: "Company B", authority: "primary" },
  { title: "News C", link: "https://example.com/c", sourceName: "Magazine C", authority: "editorial" },
];

function regular(source_id = "evergreen") {
  return { source_id, topic: "A topic", angle: "A take", linkedin_post: "Post", x_post: "Short post",
    image_prompt: "Three illustrated panels.", card_headline: "A headline", card_subtitle: "A subtitle" };
}
function explainer(term, source_id) {
  return { ...regular(source_id), explainer: {
    term, category: "concept", definition: "A factual definition", analogy: "An open-book exam",
    keyPoints: ["Find context", "Read context", "Draft an answer"],
    example: "Imagine answering a support question", limitation: "Documents may be outdated",
    visualTitle: `${term} explained`, visualLabels: ["Find", "Read", "Answer"],
  } };
}
function batch() {
  return { drafts: Array.from({ length: 4 }, () => regular()), explainers: [explainer("RAG", "S1"), explainer("MCP", "S2")] };
}

test("weekly batch includes four regular drafts and two sourced explainers", () => {
  const result = parseDraftBatch(batch(), sources, 4, 2);
  assert.equal(result.length, 6);
  assert.deepEqual(result.map((d) => d.kind), ["article", "article", "article", "article", "explainer", "explainer"]);
  assert.equal(result[4].source_url, sources[0].link);
  assert.equal(result[4].source_name, sources[0].sourceName);
  assert.equal(result[5].explainer.term, "MCP");
});

test("model-written URLs cannot replace source citations", () => {
  const input = batch();
  input.explainers[0].source_url = "https://invented.example/fake";
  assert.equal(parseDraftBatch(input, sources, 4, 2)[4].source_url, sources[0].link);
  input.explainers[0].source_id = "S999";
  assert.throws(() => parseDraftBatch(input, sources, 4, 2), /Invalid explainer source/);
});

test("missing educational posts and non-primary citations reject the whole batch", () => {
  const missing = batch();
  missing.explainers.pop();
  assert.throws(() => parseDraftBatch(missing, sources, 4, 2), /Expected 2 explainers/);
  for (const id of ["evergreen", "S3"]) {
    const input = batch(); input.explainers[0].source_id = id;
    assert.throws(() => parseDraftBatch(input, sources, 4, 2), /Invalid explainer source/);
  }
});

test("the two explainers cannot repeat a subject or source", () => {
  const sameTerm = batch(); sameTerm.explainers[1].explainer.term = "rag";
  assert.throws(() => parseDraftBatch(sameTerm, sources, 4, 2), /distinct subjects/);
  const sameSource = batch(); sameSource.explainers[1].source_id = "S1";
  assert.throws(() => parseDraftBatch(sameSource, sources, 4, 2), /distinct subjects/);
});

test("educational images require three concise labels and readable copy", () => {
  const missing = batch(); missing.explainers[0].explainer.visualLabels.pop();
  assert.throws(() => parseDraftBatch(missing, sources, 4, 2), /exactly three/);
  const long = batch(); long.explainers[0].explainer.visualLabels[0] = "This label has too many words";
  assert.throws(() => parseDraftBatch(long, sources, 4, 2), /too long/);
});

test("image brief contains the teaching facts, exact copy and limitation", () => {
  const d = parseDraftBatch(batch(), sources, 4, 2)[4];
  const prompt = imagePromptForDraft({ imagePrompt: d.image_prompt, explainer: d.explainer });
  for (const s of [d.explainer.definition, d.explainer.analogy, d.explainer.limitation, ...d.explainer.keyPoints, ...d.explainer.visualLabels]) {
    assert.ok(prompt.includes(s));
  }
  assert.equal(imagePromptForDraft({ imagePrompt: "Legacy image prompt" }), "Legacy image prompt");
});

test("explainer source is appended once to the LinkedIn post", () => {
  const g = parseDraftBatch(batch(), sources, 4, 2)[4];
  const d = { sourceUrl: g.source_url };
  const post = withSourceLink(g.linkedin_post, d);
  assert.ok(post.includes(sources[0].link));
  assert.equal(withSourceLink(post, d), post);
});
