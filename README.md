# Social Media Manager

An automated social media assistant for building a personal brand around **AI and Forward Deployed Engineering**.

Every **Monday / Wednesday / Friday** it:

1. 📡 Pulls fresh articles from reputable sources — MIT, Wharton, DeepMind, Microsoft Research, McKinsey, OpenAI, MIT Tech Review, Simon Willison, Latent Space, and more (see [content/sources.ts](content/sources.ts))
2. ✍️ Uses **GPT-5** to draft 3 candidate posts in your voice — each with a LinkedIn version, an X version, and your personal take baked in (voice defined in [content/persona.ts](content/persona.ts))
3. 🎨 Generates a post image — AI-generated (gpt-image-1) with a branded template card as fallback
4. 📧 Emails the drafts to your Gmail
5. 🚀 One click in the email → review page → **publish now** or **schedule for 10pm UK time**, to LinkedIn and/or X (with optional last-minute text edits)

Drafts, images, and state are stored **in this GitHub repo itself** (`data/` directory) — no database needed.

## Architecture

```
Vercel Cron (Mon/Wed/Fri 15:00 UTC)
        │
        ▼
/api/cron/generate ──► RSS feeds ──► Claude (drafts) ──► OpenAI image / template card
        │                                                        │
        ├──► commits drafts + images to data/ in this repo ◄─────┘
        │
        └──► Gmail email with drafts + "Review & Publish" buttons
                     │
                     ▼  (HMAC-signed link)
             /publish/[id]  review page (edit text if you want)
                     │  POST
                     ▼
             /api/publish ──► LinkedIn REST API  /  X API v2
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

You should get an email with 3 drafts within a minute. (Publish buttons will report "not configured" until step 4/5.)

### 4. Connect X (Twitter)

1. Apply at [developer.x.com](https://developer.x.com) (free tier is enough — ~500 posts/month)
2. Create a Project + App → **User authentication settings** → set app permissions to **Read and write**
3. Keys & Tokens page → copy **API Key & Secret** and generate **Access Token & Secret**
4. Set `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` in Vercel and redeploy

### 5. Connect LinkedIn

1. Create an app at [linkedin.com/developers](https://www.linkedin.com/developers/apps) (requires associating a LinkedIn Page — you can create a trivial one)
2. In the app's **Products** tab, add **"Share on LinkedIn"** and **"Sign In with LinkedIn using OpenID Connect"**
3. In **Auth** tab, add redirect URL: `https://YOUR-APP.vercel.app/api/linkedin/callback`
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Vercel, redeploy
5. Visit `https://YOUR-APP.vercel.app/api/linkedin/auth?secret=YOUR_APP_SECRET`, approve, and copy the shown `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` into Vercel, redeploy

> ⚠️ LinkedIn tokens expire after ~60 days. When LinkedIn publishing fails with a 401, repeat step 5.

### 6. Images

AI illustrations (~$0.04/image) are generated with the same OpenAI key. Set `OPENAI_IMAGES=off` to skip them and always use the built-in branded template card instead.

## Scheduled publishing

On the review page each platform has two buttons:

- **Publish now** — posts immediately
- **🕙 Tonight 10pm (UK)** — queues the post for the next 22:00 Europe/London (GMT/BST handled automatically)

Queued posts are published by a GitHub Actions workflow ([.github/workflows/publish-due.yml](.github/workflows/publish-due.yml)) that pings `/api/cron/publish-due` every 10 minutes. It needs one repo secret: `CRON_SECRET` (same value as the Vercel env var). A failed scheduled publish is retried on the next tick and the error is visible in the Vercel function logs.

## Customizing

- **Your voice / topics**: edit [content/persona.ts](content/persona.ts) — this is the highest-leverage file
- **Sources**: edit [content/sources.ts](content/sources.ts)
- **Schedule**: edit the cron expression in [vercel.json](vercel.json) (UTC; `0 15 * * 1,3,5` = Mon/Wed/Fri 15:00 UTC ≈ 8am PT / 11am ET)
- **Drafts per email**: `DRAFTS_PER_RUN` env var
- **Card design**: [app/api/card/route.tsx](app/api/card/route.tsx)

## Local development

```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev
# trigger a generation run:
curl "http://localhost:3000/api/cron/generate?secret=YOUR_CRON_SECRET"
```

## Cost estimate

| Item | Cost |
|---|---|
| Vercel Hobby | free |
| Claude (3 drafts × 3 runs/week) | ≈ $1–3/month |
| OpenAI images (optional, 9/week) | ≈ $1.5/month |
| X API free tier, LinkedIn API, GitHub, Gmail | free |
