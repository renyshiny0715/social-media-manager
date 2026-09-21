# Social Media Manager

An automated social media assistant for building a personal brand around **AI and Forward Deployed Engineering**.

Every **Saturday at 15:00 UTC** (4pm UK during BST, 3pm during GMT) it:

1. 📡 Pulls fresh articles from reputable sources — MIT, Wharton, DeepMind, Microsoft Research, McKinsey, OpenAI, MIT Tech Review, Simon Willison, Latent Space, and more (see [content/sources.ts](content/sources.ts))
2. ✍️ Uses **GPT-5** to draft **3 post ideas + 3 technical visual explainers** — each with LinkedIn and X versions. Explainers teach advanced AI mechanisms: the baseline/bottleneck, how it works, a deployment example and an engineering tradeoff, illustrated clearly.
3. 🎨 Uses free preview cards in the email. Generates a **gpt-image-1 high** image only when you click image preview or publish, then reuses it. Explainer images use comics, diagrams or comparisons that teach the subject visually.
4. 📧 Emails the drafts to your Gmail
5. 🚀 One click in the email → review page → **publish now** or **schedule for 10pm UK time**, to LinkedIn and/or X (with optional last-minute text edits)

Drafts, images, and state are stored **in this GitHub repo itself** (`data/` directory) — no database needed.

## Architecture

```
Vercel Cron (Saturday 15:00 UTC)
        │
        ▼
/api/cron/generate ──► RSS + technical references ──► GPT-5 (3 posts + 3 explainers)
        │                                                        │
        ├──► commits drafts to data/ with free preview cards
        │
        └──► Gmail email with drafts + "Review & Publish" buttons
                     │
                     ▼  (HMAC-signed link)
             /publish/[id]  review page (edit text if you want)
                     │  POST
                     ▼
             /api/publish ──► generate/reuse AI image ──► LinkedIn / X
```

> **Why is publishing a two-step click?** The email links to a review page and publishing is a POST from that page. Email providers prefetch GET links for spam scanning — a true one-click GET publish link could be "clicked" by a robot. This design keeps it to one human click while staying scanner-safe.

## Setup

### 1. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Then set the environment variables from [.env.example](.env.example) in **Vercel → Project → Settings → Environment Variables** and redeploy. Start with the required block; the publishing keys can come later.

### 2. Required keys

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) — one key covers both drafting (GPT-5) and images (gpt-image-1) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained token with **Contents: Read and write** on this repo |
| `GITHUB_REPO` | `yourname/social-media-manager` |
| `GMAIL_APP_PASSWORD` | Google Account → Security → 2-Step Verification → **App passwords** |
| `APP_URL` | Your Vercel URL, e.g. `https://social-media-manager-xxx.vercel.app` |
| `APP_SECRET`, `CRON_SECRET` | Any random strings (`openssl rand -hex 32`) |

### 3. Test a run

```bash
curl "https://YOUR-APP.vercel.app/api/cron/generate?secret=YOUR_CRON_SECRET"
```

You should get an email with 3 post ideas and 3 visual explainers within a few minutes. (Publish buttons will report "not configured" until step 4/5.)

### 4. Connect X (Twitter)

1. Apply at [developer.x.com](https://developer.x.com) and ensure your API account has the required credits for publishing
2. Create a Project + App → **User authentication settings** → set app permissions to **Read and write**
3. Keys & Tokens page → copy **API Key & Secret** and generate **Access Token & Secret**
4. Set `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` in Vercel and redeploy

### 5. Connect LinkedIn

1. Create an app at [linkedin.com/developers](https://www.linkedin.com/developers/apps) (requires associating a LinkedIn Page — you can create a trivial one)
2. In the app's **Products** tab, add **"Share on LinkedIn"** and **"Sign In with LinkedIn using OpenID Connect"**
3. In **Auth** tab, add redirect URL: `https://YOUR-APP.vercel.app/api/linkedin/callback`
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Vercel, redeploy
5. Visit `https://YOUR-APP.vercel.app/api/linkedin/auth?secret=YOUR_APP_SECRET`, approve, and copy the shown `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` into Vercel, redeploy

> ⚠️ LinkedIn tokens expire after ~60 days (standard apps get no refresh token, so this can't be fully automated).
> The tool makes renewal one click: draft emails warn you starting 14 days before expiry with a renewal link;
> visiting `/api/linkedin/auth?secret=...` and clicking Allow stores the fresh token automatically
> (AES-256-GCM-encrypted in `data/secrets/`, keyed by `APP_SECRET`) — no env var edits, no redeploy.
>
> **Token lifetimes at a glance:** X keys, OpenAI key, Gmail app password, `APP_SECRET`/`CRON_SECRET` — never expire.
> GitHub fine-grained token — expires on the date you chose at creation. LinkedIn — ~60 days, one-click renewal.
> Check everything live at `/api/health?secret=<APP_SECRET>`.

### 6. Images

AI illustrations use `gpt-image-1`, high quality, 1536×1024, with the same OpenAI key. They are generated on preview/publish, not for every emailed candidate. Set `OPENAI_IMAGES=off` to always use a template card instead. The review page can generate and show the final image before publishing.

Explainers target AI engineers, FDEs, architects and technical leaders who already know LLM/RAG/agent basics. Current primary-source excerpts qualify only when they match advanced topic patterns and contain mechanism evidence; this conservative filter is in `lib/explainer-sources.ts`. Google Research and Microsoft Research feeds supplement the existing source mix. Quiet weeks use verified technical background references in [content/explainers.ts](content/explainers.ts), never presented as breaking news. Topics include adaptive test-time compute, speculative decoding, GraphRAG, PagedAttention, MoE routing, verifiable rewards, selective state spaces, agent state management and latent world models. Keep the discovery patterns and reference pool up to date as new techniques emerge.

The model can select only eligible source IDs, and each explainer must name a supported technical focus plus its baseline/bottleneck. Workshops, company profiles, generic trends and introductory glossary topics cannot fill these slots. The prompt asks for three different technical domains, source-backed causal detail and a real tradeoff, with readable diagrams. Citation URLs are bound in code, and recent terms in `data/state.json` guide variety. The image brief includes the baseline, definition, three mechanism facts and limitation so the drawing teaches the same material as the post. Older saved drafts keep working without the new technical fields.

New explainer images use three reading levels: a title and one-line definition, a central diagram with three labelled micro-explanations, and two short callouts for an example and a limitation. Explicit copy fields are validated against per-line limits and a 65-word total ceiling. Large type, two accent colors and generous spacing keep the image readable. Older saved drafts and already-generated images remain compatible and are reused without regeneration charges.

## Scheduled publishing

On the review page each platform has two buttons:

- **Publish now** — posts immediately
- **🕙 Tonight 10pm (UK)** — queues the post for the next 22:00 Europe/London (GMT/BST handled automatically)

Queued posts are published by a GitHub Actions workflow ([.github/workflows/publish-due.yml](.github/workflows/publish-due.yml)) that pings `/api/cron/publish-due` every 10 minutes. It needs one repo secret: `CRON_SECRET` (same value as the Vercel env var). A failed scheduled publish is retried on the next tick and the error is visible in the Vercel function logs.

## Customizing

- **Your voice / topics**: edit [content/persona.ts](content/persona.ts) — this is the highest-leverage file
- **Sources**: edit [content/sources.ts](content/sources.ts)
- **Schedule**: edit [vercel.json](vercel.json) (`0 15 * * 6` = Saturday 15:00 UTC). The separate scheduled-publish worker still runs every 10 minutes for approved posts.
- **Drafts per email**: `DRAFTS_PER_RUN=3` regular posts plus `EXPLAINERS_PER_RUN=3` educational posts
- **Card design**: [app/api/card/route.tsx](app/api/card/route.tsx)

## Local development

```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev
# trigger a generation run:
curl "http://localhost:3000/api/cron/generate?secret=YOUR_CRON_SECRET"
```

## Usage and costs

One text-generation batch runs per week. Images are charged only for drafts you preview or publish and are reused across platforms. X publishing/replies require API credits. Actual charges depend on model usage, image settings and provider pricing; check your provider dashboards.

## Checks

Run `npm test` for batch validation, citation binding, educational image content and legacy-draft compatibility; `npm run build` checks types and the production build.
