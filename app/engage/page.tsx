import { config } from "@/lib/config";
import { EngageForm } from "./EngageForm";

export const dynamic = "force-dynamic";

// Engagement helper: paste someone's LinkedIn post -> get a ready-to-use
// comment + repost commentary in Reny's voice.
//   /engage?secret=<APP_SECRET>

export default async function EngagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const secret = sp.secret ?? "";
  if (!config.appSecret || secret !== config.appSecret) {
    return (
      <main style={{ maxWidth: 680, margin: "0 auto", padding: 24 }}>
        <h1>Unauthorized</h1>
        <p>Open this page via the link in your draft emails (it carries the access secret).</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24 }}>💬 Engage helper</h1>
      <p style={{ color: "#555" }}>
        Found a good LinkedIn post? Paste its text below and get a comment + repost commentary
        in your voice. Then open the post, hit Comment/Repost, and paste.
      </p>
      <EngageForm secret={secret} />
    </main>
  );
}
