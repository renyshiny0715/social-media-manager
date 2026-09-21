import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDraftBatch, imagePromptForDraft } from "../lib/draft-batch.ts";
import { withSourceLink } from "../lib/source-comment.ts";

const sources = [
  { title: "Official A", link: "https://example.com/a", sourceName: "University A", authority: "primary", technicalTopics: ["GraphRAG"] },
  { title: "Official B", link: "https://example.com/b", sourceName: "Company B", authority: "primary", technicalTopics: ["Speculative decoding"] },
  { title: "News C", link: "https://example.com/c", sourceName: "Magazine C", authority: "editorial" },
  { title: "Official D", link: "https://example.com/d", sourceName: "Company D", authority: "primary", technicalTopics: ["PagedAttention"] },
  { title: "University AI workshop", link: "https://example.com/workshop", sourceName: "University A", authority: "primary" },
];

function regular(source_id = "evergreen") {
  return { source_id, topic: "A topic", angle: "A take", linkedin_post: "Post", x_post: "Short post",
    image_prompt: "Three illustrated panels.", card_headline: "A headline", card_subtitle: "A subtitle" };
}
function explainer(term, source_id) {
  return { ...regular(source_id), explainer: {
    term, category: "concept", technicalFocus: sources[Number(source_id.slice(1)) - 1]?.technicalTopics?.[0],
    baseline: "Isolated chunks omit relationships across the corpus",
    definition: "A factual definition", analogy: "An open-book exam",
    keyPoints: ["Find context", "Read context", "Draft an answer"],
    example: "Imagine answering a support question", limitation: "Documents may be outdated",
    visualTitle: `${term} explained`, visualLabels: ["Find", "Read", "Answer"],
    visualSummary: "Answers grounded in retrieved documents",
    visualDetails: ["Search relevant documents", "Supply evidence as context", "Generate a grounded response"],
    visualExample: "Support answers from your product manual",
    visualCaveat: "Outdated documents can still mislead",
  } };
}
function batch() {
  return { drafts: Array.from({ length: 3 }, () => regular()), explainers: [explainer("GraphRAG", "S1"), explainer("Speculative decoding", "S2"), explainer("PagedAttention", "S4")] };
}

test("weekly batch includes three regular drafts and three sourced explainers", () => {
  const result = parseDraftBatch(batch(), sources, 3, 3);
  assert.equal(result.length, 6);
  assert.deepEqual(result.map((d) => d.kind), ["article", "article", "article", "explainer", "explainer", "explainer"]);
  assert.equal(result[3].source_url, sources[0].link);
  assert.equal(result[3].source_name, sources[0].sourceName);
  assert.equal(result[4].explainer.term, "Speculative decoding");
});

test("model-written URLs cannot replace source citations", () => {
  const input = batch();
  input.explainers[0].source_url = "https://invented.example/fake";
  assert.equal(parseDraftBatch(input, sources, 3, 3)[3].source_url, sources[0].link);
  input.explainers[0].source_id = "S999";
  assert.throws(() => parseDraftBatch(input, sources, 3, 3), /Invalid explainer source/);
});

test("missing educational posts and non-primary citations reject the whole batch", () => {
  const missing = batch();
  missing.explainers.pop();
  assert.throws(() => parseDraftBatch(missing, sources, 3, 3), /Expected 3 explainers/);
  for (const id of ["evergreen", "S3"]) {
    const input = batch(); input.explainers[0].source_id = id;
    assert.throws(() => parseDraftBatch(input, sources, 3, 3), /Invalid explainer source/);
  }
});

test("the three explainers cannot repeat a subject or source", () => {
  const sameTerm = batch(); sameTerm.explainers[1].explainer.term = "graphrag";
  assert.throws(() => parseDraftBatch(sameTerm, sources, 3, 3), /distinct subjects/);
  const sameSource = batch(); sameSource.explainers[1].source_id = "S1";
  assert.throws(() => parseDraftBatch(sameSource, sources, 3, 3), /distinct subjects/);
});

test("educational images require three concise labels and readable copy", () => {
  const missing = batch(); missing.explainers[0].explainer.visualLabels.pop();
  assert.throws(() => parseDraftBatch(missing, sources, 3, 3), /exactly three/);
  const long = batch(); long.explainers[0].explainer.visualLabels[0] = "This label has too many words";
  assert.throws(() => parseDraftBatch(long, sources, 3, 3), /too long/);
});

test("image brief contains the teaching facts, exact copy and limitation", () => {
  const d = parseDraftBatch(batch(), sources, 3, 3)[3];
  const prompt = imagePromptForDraft({ imagePrompt: d.image_prompt, explainer: d.explainer });
  for (const s of [d.explainer.baseline, d.explainer.definition, d.explainer.analogy, d.explainer.limitation, ...d.explainer.keyPoints, ...d.explainer.visualLabels,
    d.explainer.visualSummary, ...d.explainer.visualDetails, d.explainer.visualExample, d.explainer.visualCaveat]) {
    assert.ok(prompt.includes(s));
  }
  assert.equal(imagePromptForDraft({ imagePrompt: "Legacy image prompt" }), "Legacy image prompt");
});

test("explainer source is appended once to the LinkedIn post", () => {
  const g = parseDraftBatch(batch(), sources, 3, 3)[3];
  const d = { sourceUrl: g.source_url };
  const post = withSourceLink(g.linkedin_post, d);
  assert.ok(post.includes(sources[0].link));
  assert.equal(withSourceLink(post, d), post);
});

test("detailed image copy cannot become dense paragraphs or omit the caveat", () => {
  for (const field of ["visualSummary", "visualExample", "visualCaveat"]) {
    const input = batch();
    input.explainers[0].explainer[field] = Array(12).fill("word").join(" ");
    assert.throws(() => parseDraftBatch(input, sources, 3, 3), /too long/);
  }
  const longDetail = batch();
  longDetail.explainers[0].explainer.visualDetails[0] = "one two three four five six seven";
  assert.throws(() => parseDraftBatch(longDetail, sources, 3, 3), /too long/);
  const missingCaveat = batch(); delete missingCaveat.explainers[0].explainer.visualCaveat;
  assert.throws(() => parseDraftBatch(missingCaveat, sources, 3, 3), /Missing draft field/);
});

test("previously saved explainers remain renderable without the new copy fields", () => {
  const e = explainer("RAG", "S1").explainer;
  for (const key of ["visualSummary", "visualDetails", "visualExample", "visualCaveat", "technicalFocus", "baseline"]) delete e[key];
  const prompt = imagePromptForDraft({ imagePrompt: "Legacy infographic", explainer: e });
  assert.ok(prompt.includes('"RAG explained"'));
  assert.ok(prompt.includes(e.limitation));
  assert.ok(!prompt.includes("undefined"));
});

test("nontechnical primary sources remain valid for regular posts but cannot fill explainer slots", () => {
  const input = batch();
  input.drafts[0].source_id = "S5";
  assert.equal(parseDraftBatch(input, sources, 3, 3)[0].source_url, sources[4].link);
  input.explainers[0].source_id = "S5";
  assert.throws(() => parseDraftBatch(input, sources, 3, 3), /Invalid explainer source/);
});

test("new explainers need an evidence-bound technical focus and a baseline", () => {
  const wrongTopic = batch(); wrongTopic.explainers[0].explainer.technicalFocus = "Chatbot attachment";
  assert.throws(() => parseDraftBatch(wrongTopic, sources, 3, 3), /match its source evidence/);
  const noBaseline = batch(); delete noBaseline.explainers[0].explainer.baseline;
  assert.throws(() => parseDraftBatch(noBaseline, sources, 3, 3), /baseline/);
  const companyProfile = batch(); companyProfile.explainers[0].explainer.category = "company";
  assert.throws(() => parseDraftBatch(companyProfile, sources, 3, 3), /technical concept/);
});
