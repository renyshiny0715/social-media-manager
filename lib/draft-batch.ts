import type { Draft, Explainer, FeedItem } from "./types";

export interface GeneratedDraft {
  kind: "article" | "explainer";
  topic: string;
  angle: string;
  source_title: string;
  source_url: string;
  source_name: string;
  linkedin_post: string;
  x_post: string;
  image_prompt: string;
  card_headline: string;
  card_subtitle: string;
  explainer?: Explainer;
}

export function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid draft object");
  return value as Record<string, unknown>;
}

function text(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing draft field: ${key}`);
  return value.trim();
}

function threeStrings(obj: Record<string, unknown>, key: string): string[] {
  const value = obj[key];
  if (!Array.isArray(value) || value.length !== 3 || value.some((v) => typeof v !== "string" || !v.trim())) {
    throw new Error(`${key} must contain exactly three non-empty strings`);
  }
  return value.map((v: string) => v.trim());
}

// Bind citations in code. The model selects IDs, never supplies a URL to publish.
// Validate the complete batch before any draft is saved or an email is sent.
export function parseDraftBatch(
  payload: unknown, sources: FeedItem[], articleCount: number, explainerCount: number,
): GeneratedDraft[] {
  const batch = object(payload);
  const seenTerms = new Set<string>();
  const seenExplainerSources = new Set<string>();
  return ([['drafts', articleCount, 'article'], ['explainers', explainerCount, 'explainer']] as const)
    .flatMap(([key, count, kind]) => {
      const entries = batch[key];
      if (!Array.isArray(entries) || entries.length !== count) {
        throw new Error(`Expected ${count} ${key}; received ${Array.isArray(entries) ? entries.length : 0}`);
      }
      return entries.map((entry): GeneratedDraft => {
        const raw = object(entry);
        const sourceId = text(raw, "source_id");
        const source = sources.find((_, i) => sourceId === `S${i + 1}`);
        if ((!source && sourceId !== "evergreen") || (kind === "explainer" && source?.authority !== "primary")) {
          throw new Error(`Invalid ${kind} source: ${sourceId}`);
        }
        if (source && !/^https?:\/\//.test(source.link)) throw new Error("Invalid source URL");
        const draft: GeneratedDraft = {
          kind,
          topic: text(raw, "topic"), angle: text(raw, "angle"),
          source_title: source?.title ?? "evergreen", source_url: source?.link ?? "",
          source_name: source?.sourceName ?? "",
          linkedin_post: text(raw, "linkedin_post"), x_post: text(raw, "x_post"),
          image_prompt: text(raw, "image_prompt"), card_headline: text(raw, "card_headline"),
          card_subtitle: text(raw, "card_subtitle"),
        };
        if (Array.from(draft.x_post).length > 270) throw new Error("X draft exceeds 270 characters");
        if (kind === "explainer") {
          const e = object(raw.explainer);
          const category = text(e, "category") as Explainer["category"];
          if (!["concept", "tool", "company", "industry"].includes(category)) throw new Error("Invalid explainer category");
          const explainer: Explainer = {
            term: text(e, "term"), category, definition: text(e, "definition"),
            analogy: text(e, "analogy"), keyPoints: threeStrings(e, "keyPoints"),
            example: text(e, "example"), limitation: text(e, "limitation"),
            visualTitle: text(e, "visualTitle"), visualLabels: threeStrings(e, "visualLabels"),
          };
          const term = normalizeTerm(explainer.term);
          if (!term || seenTerms.has(term) || seenExplainerSources.has(sourceId)) throw new Error("Explainers must cover distinct subjects and sources");
          seenTerms.add(term);
          seenExplainerSources.add(sourceId);
          if (explainer.visualTitle.split(/\s+/).length > 6 || explainer.visualLabels.some((s) => s.split(/\s+/).length > 4)) {
            throw new Error("Explainer image copy is too long for a readable visual");
          }
          draft.explainer = explainer;
        }
        return draft;
      });
    });
}

export function imagePromptForDraft(draft: Pick<Draft, "imagePrompt" | "explainer">): string {
  const e = draft.explainer;
  if (!e) return draft.imagePrompt;
  return `${draft.imagePrompt}

EDUCATIONAL CONTENT CONTRACT (takes precedence over any conflicting art direction):
Subject: ${e.term}. Plain-English meaning: ${e.definition}
Everyday analogy: ${e.analogy}
Teach these three facts visually in reading order:
${e.keyPoints.map((p, i) => `${i + 1}. ${p} — label: ${JSON.stringify(e.visualLabels[i])}`).join("\n")}
Use case (illustrative, not a measured customer result): ${e.example}
Keep this limitation true in the drawing: ${e.limitation}
Render only this title, exactly once: ${JSON.stringify(e.visualTitle)}.
Render each of the three labels above exactly once beside its corresponding panel/object.
Use arrows or a comparison to show the real relationship, with a playful visual explanation.
Facts above guide the drawing; do NOT print these explanatory paragraphs as text.
All text must be large and phone-readable. Keep generous margins. No invented numbers,
charts, capabilities, guarantees, extra captions, branding or tiny footnotes.`;
}
