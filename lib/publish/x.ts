import { TwitterApi } from "twitter-api-v2";
import { config, assertConfigured } from "../config";
import { imageBytesForDraft } from "../images";
import type { Draft } from "../types";

export async function publishToX(draft: Draft, text: string): Promise<{ postId: string }> {
  const missing = assertConfigured(["xApiKey", "xApiSecret", "xAccessToken", "xAccessSecret"]);
  if (missing) throw new Error(`X is not configured. ${missing}`);

  const client = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });

  const image = await imageBytesForDraft(draft.id, draft.imageType);

  let mediaIds: [string] | undefined;
  if (image) {
    const mediaId = await client.v1.uploadMedia(image, { mimeType: "image/png" });
    mediaIds = [mediaId];
  }

  const result = await client.v2.tweet({
    text,
    ...(mediaIds ? { media: { media_ids: mediaIds } } : {}),
  });

  return { postId: result.data.id };
}
