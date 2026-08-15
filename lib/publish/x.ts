import { TwitterApi } from "twitter-api-v2";
import { config, assertConfigured } from "../config";
import { imageBytesForDraft } from "../images";
import type { Draft } from "../types";

export async function publishToX(
  draft: Draft,
  text: string,
  imageOverride?: Buffer | null,
): Promise<{ postId: string }> {
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
  if (image) {
    // v2 media upload — the v1.1 endpoint returns 402 on the free API tier.
    const mediaId = await client.v2.uploadMedia(image, {
      media_type: "image/png",
      media_category: "tweet_image",
    });
    mediaIds = [mediaId];
  }

  const result = await client.v2.tweet({
    text,
    ...(mediaIds ? { media: { media_ids: mediaIds } } : {}),
  });

  return { postId: result.data.id };
}
