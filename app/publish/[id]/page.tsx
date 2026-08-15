import { loadDraft } from "@/lib/github";
import { verify } from "@/lib/sign";
import { imageUrlForDraft } from "@/lib/images";
import { formatLondon } from "@/lib/schedule";

export const dynamic = "force-dynamic";

// Review-and-publish page. The email links here with an HMAC signature; publishing
// itself is a POST (so email scanners that prefetch GET links can never publish).
// Each platform offers "publish now" or "schedule for 10pm UK time".

export default async function PublishPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sig = sp.sig ?? "";

  if (!verify(id, sig)) {
    return <Shell><h1>Invalid or expired link</h1></Shell>;
  }

  const draft = await loadDraft(id);
  if (!draft) {
    return <Shell><h1>Draft not found</h1></Shell>;
  }

  const notice =
    sp.done === "linkedin"
      ? "✅ Published to LinkedIn!"
      : sp.done === "x"
        ? "✅ Published to X!"
        : sp.scheduled === "linkedin"
          ? "🕙 Scheduled for LinkedIn at 10pm UK time."
          : sp.scheduled === "x"
            ? "🕙 Scheduled for X at 10pm UK time."
            : sp.error
              ? `❌ ${decodeURIComponent(sp.error)}`
              : null;

  return (
    <Shell>
      <h1 style={{ fontSize: 22 }}>{draft.topic}</h1>
      <p style={{ color: "#555", fontStyle: "italic" }}>{draft.angle}</p>
      {draft.sourceUrl && (
        <p style={{ fontSize: 13, color: "#777" }}>
          Source: <a href={draft.sourceUrl}>{draft.sourceTitle}</a>
        </p>
      )}
      {notice && (
        <p
          style={{
            background: notice.startsWith("❌") ? "#f8d7da" : "#d4edda",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {notice}
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrlForDraft(draft.id, draft.imageType)}
        alt=""
        style={{ width: "100%", maxWidth: 520, borderRadius: 8, margin: "8px 0 4px" }}
      />
      {draft.imageType === "card" && (
        <p style={{ fontSize: 12, color: "#999", margin: "0 0 16px" }}>
          Preview card — a premium AI illustration is generated when you publish.
        </p>
      )}

      <PlatformForm
        platform="linkedin"
        label="LinkedIn"
        color="#0a66c2"
        id={draft.id}
        sig={sig}
        text={draft.linkedinPost}
        published={Boolean(draft.published.linkedin)}
        scheduledAt={draft.scheduled?.linkedin}
      />
      <PlatformForm
        platform="x"
        label="X (Twitter)"
        color="#111"
        id={draft.id}
        sig={sig}
        text={draft.xPost}
        published={Boolean(draft.published.x)}
        scheduledAt={draft.scheduled?.x}
      />
    </Shell>
  );
}

function PlatformForm({
  platform,
  label,
  color,
  id,
  sig,
  text,
  published,
  scheduledAt,
}: {
  platform: "linkedin" | "x";
  label: string;
  color: string;
  id: string;
  sig: string;
  text: string;
  published: boolean;
  scheduledAt?: string;
}) {
  return (
    <form
      method="POST"
      action="/api/publish"
      style={{
        border: "1px solid #e2e2e2",
        borderRadius: 12,
        padding: 20,
        margin: "16px 0",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: "bold", color, marginBottom: 8 }}>
        {label} {published && "· ✅ already published"}
      </div>
      {scheduledAt && !published && (
        <div
          style={{
            background: "#fff8e1",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          🕙 Scheduled: {formatLondon(scheduledAt)} — publishing now or re-scheduling replaces this.
        </div>
      )}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="sig" value={sig} />
      <input type="hidden" name="platform" value={platform} />
      <textarea
        name="text"
        defaultValue={text}
        rows={platform === "linkedin" ? 10 : 4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: 1.5,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button
          type="submit"
          name="mode"
          value="now"
          style={{
            background: color,
            color: "#fff",
            border: "none",
            padding: "12px 22px",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Publish now
        </button>
        <button
          type="submit"
          name="mode"
          value="tonight"
          style={{
            background: "#fff",
            color,
            border: `2px solid ${color}`,
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          🕙 Tonight 10pm (UK)
        </button>
      </div>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 680, margin: "0 auto", padding: 24 }}>{children}</main>;
}
