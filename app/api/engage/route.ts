import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { generateEngagement } from "@/lib/engage";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// POST { secret, content, url?, author? } -> { comment, repost }

export async function POST(req: NextRequest) {
  let body: { secret?: string; content?: string; url?: string; author?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.secret || (body.secret !== config.appSecret && body.secret !== config.cronSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const content = (body.content ?? "").trim();
  if (content.length < 40) {
    return NextResponse.json(
      { error: "Please paste the post's text (at least a few sentences) — LinkedIn blocks automated fetching of post URLs." },
      { status: 400 },
    );
  }

  try {
    const result = await generateEngagement(content.slice(0, 6000), body.url, body.author);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("engage generation failed:", err);
    return NextResponse.json({ error: message.slice(0, 300) }, { status: 500 });
  }
}
