import { NextRequest, NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { config } from "@/lib/config";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Temporary diagnostic: tests X auth + v2 media upload in production and
// returns the raw API error. Publishes nothing.

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || (secret !== config.appSecret && secret !== config.cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });

  const out: Record<string, unknown> = {};

  try {
    const me = await client.v2.me();
    out.auth = { ok: true, username: me.data.username };
  } catch (e: unknown) {
    const err = e as { code?: number; data?: unknown };
    out.auth = { ok: false, code: err.code, data: err.data };
  }

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  try {
    const mediaId = await client.v2.uploadMedia(png, {
      media_type: "image/png",
      media_category: "tweet_image",
    });
    out.v2Upload = { ok: true, mediaId };
  } catch (e: unknown) {
    const err = e as { code?: number; data?: unknown; message?: string };
    out.v2Upload = { ok: false, code: err.code, data: err.data, message: err.message };
  }

  return NextResponse.json(out);
}
