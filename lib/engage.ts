import { persona } from "@/content/persona";
import { config } from "./config";

const engagementSchema = {
  type: "object" as const,
  properties: {
    comment: {
      type: "string" as const,
      description: "A comment to leave under the original post, 30-70 words",
    },
    repost: {
      type: "string" as const,
      description: "Commentary text for resharing the post, 60-130 words, LinkedIn formatting with line breaks",
    },
  },
  required: ["comment", "repost"],
  additionalProperties: false,
};

export interface Engagement {
  comment: string;
  repost: string;
}

export async function generateEngagement(
  postContent: string,
  postUrl?: string,
  authorName?: string,
): Promise<Engagement> {
  const userPrompt = `Someone ${authorName ? `(${authorName}) ` : ""}posted this on LinkedIn${postUrl ? ` (${postUrl})` : ""}:

---
${postContent}
---

Write two things for Reny to engage with this post:

1. "comment" — a comment to leave under the post (30-70 words):
   - Lead with a substantive reaction or addition, NEVER "Great post!" or "Thanks for sharing"
   - Add one concrete insight from Reny's front-line FDE / enterprise AI deployment experience
     that extends or respectfully challenges the post's point
   - Optionally end with a short question that invites the author to respond
   - No hashtags, at most one emoji

2. "repost" — commentary for resharing this post to Reny's own feed (60-130 words):
   - First line is a hook in Reny's voice (it shows above the reshared post)
   - Give Reny's take: why this matters for enterprises trying to get real value from AI,
     agreeing, extending, or adding a caveat from field experience
   - Short paragraphs, line breaks between them
   - End with 2-3 hashtags from Reny's usual set
   - Do NOT summarize the original post (it's visible right below the reshare)`;

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
      max_completion_tokens: 6000,
      reasoning_effort: "low",
      response_format: {
        type: "json_schema",
        json_schema: { name: "engagement", strict: true, schema: engagementSchema },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI engagement generation failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  if (message?.refusal) throw new Error(`OpenAI refused: ${message.refusal}`);
  if (!message?.content) {
    throw new Error(
      `No content in OpenAI response (finish_reason: ${json?.choices?.[0]?.finish_reason ?? "unknown"})`,
    );
  }
  return JSON.parse(message.content) as Engagement;
}
