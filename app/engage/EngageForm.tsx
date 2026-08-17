"use client";

import { useState } from "react";

export function EngageForm({ secret }: { secret: string }) {
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ comment: string; repost: string } | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/engage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, url, author, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 14,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginBottom: 12,
  };

  return (
    <div>
      <input
        style={inputStyle}
        placeholder="Post URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="Author name (optional, e.g. Ethan Mollick)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        style={{ ...inputStyle, lineHeight: 1.5 }}
        rows={8}
        placeholder="Paste the post's text here (required)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        onClick={generate}
        disabled={loading || content.trim().length < 40}
        style={{
          background: "#111",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          borderRadius: 8,
          fontWeight: "bold",
          fontSize: 15,
          cursor: loading ? "wait" : "pointer",
          opacity: loading || content.trim().length < 40 ? 0.6 : 1,
        }}
      >
        {loading ? "Generating…" : "Generate comment & repost"}
      </button>

      {error && (
        <p style={{ background: "#f8d7da", padding: 12, borderRadius: 8, marginTop: 16 }}>
          ❌ {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <ResultBlock title="💬 Comment (paste under the post)" text={result.comment} />
          <ResultBlock title="🔁 Repost commentary (paste when resharing)" text={result.repost} />
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                marginTop: 8,
                background: "#0a66c2",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: 8,
                fontWeight: "bold",
              }}
            >
              Open the post →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ResultBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e2e2e2",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b>{title}</b>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={{
            border: "1px solid #ccc",
            background: copied ? "#d4edda" : "#f5f5f5",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: 0 }}>{text}</p>
    </div>
  );
}
