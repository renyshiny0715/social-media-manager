import { listDrafts } from "@/lib/github";
import { config } from "@/lib/config";
import { imageUrlForDraft } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let drafts: Awaited<ReturnType<typeof listDrafts>> = [];
  let error: string | null = null;
  try {
    if (config.githubRepo && config.githubToken) {
      drafts = await listDrafts();
    } else {
      error = "GitHub storage not configured yet (GITHUB_TOKEN / GITHUB_REPO).";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 26 }}>Social Media Manager</h1>
      <p style={{ color: "#555" }}>
        Drafts are generated Mon/Wed/Fri and emailed to you. This dashboard lists everything
        generated so far.
      </p>
      {error && (
        <p style={{ background: "#fff3cd", padding: 12, borderRadius: 8 }}>{error}</p>
      )}
      {drafts.map((d) => (
        <div
          key={d.id}
          style={{
            border: "1px solid #e2e2e2",
            borderRadius: 12,
            padding: 20,
            margin: "16px 0",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 12, color: "#888" }}>
            {new Date(d.createdAt).toLocaleString()}
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 18 }}>{d.topic}</h2>
          <p style={{ color: "#555", fontStyle: "italic", margin: "0 0 10px" }}>{d.angle}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrlForDraft(d.id, d.imageType)}
            alt=""
            style={{ width: "100%", maxWidth: 420, borderRadius: 8 }}
          />
          <div style={{ marginTop: 10, fontSize: 13, color: "#333" }}>
            {d.published.linkedin ? "✅ LinkedIn published" : "◻️ LinkedIn pending"}
            {" · "}
            {d.published.x ? "✅ X published" : "◻️ X pending"}
          </div>
        </div>
      ))}
      {!error && drafts.length === 0 && <p>No drafts yet — wait for the next cron run.</p>}
    </main>
  );
}
