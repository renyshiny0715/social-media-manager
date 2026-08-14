import { persona, postGuidelines, evergreenTopics } from "@/content/persona";
import { config } from "./config";
import type { Draft, FeedItem } from "./types";

const draftSchema = {
  type: "object" as const,
  properties: {
    drafts: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          topic: { type: "string" as const, description: "Short topic label for this draft" },
          angle: { type: "string" as const, description: "One sentence: Reny's take/angle" },
          source_title: { type: "string" as const, description: "Title of the source article used, or 'evergreen' if none" },
          source_url: { type: "string" as const, description: "URL of the source article, or empty string if evergreen" },
          linkedin_post: { type: "string" as const, description: "Full LinkedIn post text following the LinkedIn rules" },
          x_post: { type: "string" as const, description: "Full X post text, max 270 chars including hashtags" },
          image_prompt: { type: "string" as const, description: "AI image generation prompt per the image guidance" },
          card_headline: { type: "string" as const, description: "Max 8 words" },
          card_subtitle: { type: "string" as const, description: "Max 14 words" },
        },
        required: [
          "topic", "angle", "source_title", "source_url", "linkedin_post",
          "x_post", "image_prompt", "card_headline", "card_subtitle",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["drafts"],
  additionalProperties: false,
};

export interface GeneratedDraft {
  topic: string;
  angle: string;
  source_title: string;
  source_url: string;
  linkedin_post: string;
  x_post: string;
  image_prompt: string;
  card_headline: string;
  card_subtitle: string;
}

export async function generateDrafts(articles: FeedItem[]): Promise<GeneratedDraft[]> {
  const articleList =
    articles.length > 0
      ? articles
          .map(
            (a, i) =>
              `${i + 1}. [${a.sourceName}] ${a.title}\n   URL: ${a.link}\n   ${a.snippet}`,
          )
          .join("\n\n")
      : "(no fresh articles available this run)";

  const userPrompt = `Here are fresh articles from reputable AI sources:

${articleList}

Task: write ${config.draftsPerRun} distinct social media post drafts.
- Each draft covers a DIFFERENT topic/article. Pick the articles most relevant to AI careers,
  forward deployed engineering, enterprise AI deployment, LLM engineering practice, or the
  changing nature of software work. Skip pure funding/gossip news unless there is a real lesson in it.
- If there are no suitable fresh articles (or fewer than needed), fill the remainder using these
  evergreen angles instead (mark source_title as "evergreen", source_url as ""):
${evergreenTopics.map((t) => `  - ${t}`).join("\n")}
- Each draft needs both a LinkedIn version and an X version of the same idea.

${postGuidelines}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: "system", content: persona },
        { role: "user", content: userPrompt },
      ],
      // GPT-5 is a reasoning model: the cap covers hidden reasoning + output,
      // so keep it generous and the reasoning effort low for this writing task.
      max_completion_tokens: 20000,
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: { name: "post_drafts", strict: true, schema: draftSchema },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI draft generation failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  if (!message?.content) {
    throw new Error(
      `No content in OpenAI response (finish_reason: ${json?.choices?.[0]?.finish_reason ?? "unknown"})`,
    );
  }

  const parsed = JSON.parse(message.content) as { drafts: GeneratedDraft[] };
  return parsed.drafts.slice(0, config.draftsPerRun);
}

export function toDraft(g: GeneratedDraft, imageType: Draft["imageType"]): Draft {
  const id = `${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    topic: g.topic,
    angle: g.angle,
    sourceTitle: g.source_title,
    sourceUrl: g.source_url,
    linkedinPost: g.linkedin_post,
    xPost: g.x_post,
    imagePrompt: g.image_prompt,
    cardHeadline: g.card_headline,
    cardSubtitle: g.card_subtitle,
    imageType,
    published: {},
  };
}
