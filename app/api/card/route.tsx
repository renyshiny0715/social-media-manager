import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { loadDraft } from "@/lib/github";

export const dynamic = "force-dynamic";

// Renders a branded text-card image (1200x675 PNG) for a draft.
// Used as the post image whenever no AI image was generated.

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const draft = id ? await loadDraft(id) : null;

  const headline = draft?.cardHeadline ?? "Forward Deployed Engineering";
  const subtitle = draft?.cardSubtitle ?? "Notes from the AI deployment frontier";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0f1b2d 0%, #16324f 55%, #1f5673 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#7fd1c8",
          }}
        >
          <div style={{ width: 44, height: 6, background: "#7fd1c8", display: "flex" }} />
          AI × Forward Deployed
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
            {headline}
          </div>
          <div style={{ fontSize: 34, color: "#c9d8e5", maxWidth: 920, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#9db4c8",
          }}
        >
          <div>Reny · Forward Deployed Engineer @ Zendesk</div>
          <div style={{ color: "#7fd1c8" }}>#FDE</div>
        </div>
      </div>
    ),
    { width: 1200, height: 675 },
  );
}
