import { loadDraft } from "@/lib/github";
import { verify } from "@/lib/sign";
import { imageUrlForDraft } from "@/lib/images";

export const dynamic = "force-dynamic";

// Review-and-publish page. The email links here with an HMAC signature; publishing
// itself is a POST (so email scanners that prefetch GET links can never publish).

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
        <p style={{ background: notice.startsWith("✅") ? "#d4edda" : "#f8d7da", padding: 12, borderRadius: 8 }}>
          {notice}
        </p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrlForDraft(draft.id, draft.imageType)}
        alt=""
        style={{ width: "100%", maxWidth: 520, borderRadius: 8, margin: "8px 0 20px" }}
      />

      <PlatformForm
        platform="linkedin"
        label="LinkedIn"
        color="#0a66c2"
        id={draft.id}
        sig={sig}
        text={draft.linkedinPost}
        published={Boolean(draft.published.linkedin)}
      />
      <PlatformForm
        platform="x"
        label="X (Twitter)"
        color="#111"
        id={draft.id}
        sig={sig}
        text={draft.xPost}
        published={Boolean(draft.published.x)}
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
}: {
  platform: "linkedin" | "x";
  label: string;
  color: string;
  id: string;
  sig: string;
  text: string;
  published: boolean;
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
      <button
        type="submit"
        style={{
          marginTop: 10,
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
        {published ? `Publish again to ${label}` : `Publish to ${label}`}
      </button>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 680, margin: "0 auto", padding: 24 }}>{children}</main>;
}
