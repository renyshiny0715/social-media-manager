import { TwitterApi } from "twitter-api-v2";
import { config, assertConfigured } from "../config";
import { imageBytesForDraft } from "../images";
import type { Draft } from "../types";

export async function publishToX(
  draft: Draft,
  text: string,
  imageOverride?: Buffer | null,
): Promise<{ postId: string; note?: string }> {
  const missing = assertConfigured(["xApiKey", "xApiSecret", "xAccessToken", "xAccessSecret"]);
  if (missing) throw new Error(`X is not configured. ${missing}`);

  const client = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });

  const image = imageOverride ?? (await imageBytesForDraft(draft.id, draft.imageType));

  let mediaIds: [string] | undefined;
  let note: string | undefined;
  if (image) {
    try {
      const mediaId = await client.v2.uploadMedia(image, {
        media_type: "image/png",
        media_category: "tweet_image",
      });
      mediaIds = [mediaId];
    } catch (err) {
      // X's free API tier has no media-upload credits ("credits depleted", 402).
      // Fall back to a text-only post rather than failing the publish.
      const code = (err as { code?: number }).code;
      if (code === 402 || code === 403) {
        note = "Posted WITHOUT the image — X media upload needs API credits (free tier has none). Text went out fine.";
        console.warn("X media upload unavailable, posting text-only:", code);
      } else {
        throw err;
      }
    }
  }

  const result = await client.v2.tweet({
    text,
    ...(mediaIds ? { media: { media_ids: mediaIds } } : {}),
  });

  return { postId: result.data.id, note };
}

// Replies to a published post (used to attach the source link).
export async function replyOnX(postId: string, text: string): Promise<void> {
  const client = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });
  await client.v2.tweet({ text, reply: { in_reply_to_tweet_id: postId } });
}
