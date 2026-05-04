# jordankrueger.com — Personal Site

## Stack
- **Astro** static site generator with MDX for blog posts
- **Cloudflare Pages** — auto-deploys on push to `main`
- **GitHub:** `jordankrueger/jordankrueger-site` (use `jordankrueger` account)

## Dev Server
```bash
npm run dev
# Access at http://jordans-mac-mini:4321
```

## Key Directories
- `src/pages/` — All routes (Astro file-based routing)
- `src/layouts/` — BaseLayout (HTML shell), BlogPost (post wrapper)
- `src/components/` — Reusable UI components
- `src/content/posts/` — MDX blog posts (content collection)
- `src/content/tools/` — YAML files for the `/tools` portal content collection (one file per category)
- `src/styles/` — global.css (design tokens), fonts.css (@font-face)
- `public/fonts/` — Self-hosted woff2 fonts (DM Sans, Lora, Rock Salt)
- `public/images/` — All site images with descriptive names
- `carrd-export/` — Original Carrd site for content reference

## Design System
- **Colors:** `--color-accent: #AF4C2A` (WCAG AA), `--color-text: #5C5248`, `--color-bg: #EDEDED`
- **Fonts:** DM Sans (body), Lora (headings), Rock Salt (logo only)
- **Breakpoints:** 900px (tablet), 640px (mobile)

## Pages
- `/` — Homepage with services, about, blog posts, newsletter, contact
- `/blog` — Blog listing
- `/projects` — Project showcase (full-width ProjectCard panels)
- `/ai` — AI showcase (40+ projects built with Claude Code, compact card grid). Data lives in page frontmatter arrays. Uses `AiProjectCard` and `AiStoryCard` components.
- `/tools` — Progressives Projects Portal. Curated catalog of free/open tools for advocacy orgs. Data lives in the `tools` Astro content collection (`src/content/tools/*.yaml`). One YAML file per category; each file contains `category:` metadata and an `entries:` array. Adding a tool = editing the relevant YAML + push. Zod schema lives in `src/content.config.ts`. Uses `ToolCard` and `ToolCategory` components.
- `/building` — Building in Public series (posts tagged `claude-code`)
- `/about` — About page

## Blog Posts
**Drafts** live in `drafts/` at project root during review. When ready to publish, move to `src/content/posts/`, flip `draft: false`, and push.

Posts are MDX files in `src/content/posts/` with frontmatter:
```yaml
title: "Post Title"
description: "Short description"
pubDate: 2026-01-15
tags: ["tag1", "tag2"]
coverImage: "/images/gallery/cover.jpg"
draft: false
```

Tag `claude-code` to include in the Building in Public series at `/building`.

## External Services
- **Newsletter signup:** POST to `https://progressives-signup.restless-salad-a31e.workers.dev`
  - Worker source: `side-hustle/progressives-for-ai/progressives-for-ai/worker.js` (personal CF account — use `PERSONAL_CLOUDFLARE_API_TOKEN`)
  - Signups go to **Listmonk Mission Control list (id 4)** on CH VPS (newsletter.campaign.help)
  - AK Template form also posts here with `bonus=ak-template` → triggers Resend transactional welcome email to new subscriber
- **Contact form:** POST to `https://jordankrueger-contact-form.restless-salad-a31e.workers.dev` (sends email via Resend to jordan@jordankrueger.com). Worker source in `workers/contact-form/`. Deploy with `CLOUDFLARE_API_TOKEN="$PERSONAL_CLOUDFLARE_API_TOKEN" npx wrangler deploy` from that directory.
- **Analytics:** Google Analytics `G-QJQ0PD6XHD`

## Mission Control Newsletter

> **⚠️ Brand home under reconsideration (2026-04-29):** Jordan is thinking about relocating Mission Control to live under the **Grounded AI** brand instead of jordankrueger.com. Implications to think through before executing: from-address change (`jordan@groundedai.help`), template rebrand, signup-form destinations on jordankrueger.com (do they still flow here, or get a different newsletter?), notification to existing 5 subscribers about the brand change, and N8N auto-draft workflow source filter. **No action yet** — just flagging.

- **Platform:** Listmonk on CH VPS (newsletter.campaign.help). List id 4, name "Mission Control".
- **Template:** id 6 ("Mission Control") — source at `email-templates/mission-control-template.html`
- **Campaigns:** `email-templates/` — body HTML files per campaign (e.g., `mission-control-001-body.html`)
- **From address:** `Jordan Krueger <jordan@jordankrueger.com>` — must set per-campaign (Listmonk default is PfAI's address)
- **Subscriber count:** 5 as of Apr 2026 (4 migrated from Beehiiv + 1 test)
- **Sending gate:** NEVER send to the real list without Jordan's explicit go-ahead. Test sends to jordan@campaign.help only.
- **Humanizer gate:** Run MC body HTML through humanizer + writing-voice skills before any real send.
- **Auto-draft workflow:** Weekly (Fri 7:30am ET) on N8N CH, workflow id `7xsz8xvMCQKyiIeR`. Creates Listmonk draft + Drift review task (next Monday due) when ≥2 new posts have accumulated since the last MC send. Never auto-sends. Full docs in `personal/automation-strategy/CLAUDE.md` → Mission Control Auto-Draft.
- **See also:** `side-hustle/progressives-for-ai/CLAUDE.md` for full Listmonk SSH access patterns and SMTP config.

## Deployment
Push to `main` branch → Cloudflare Pages auto-deploys.
Build command: `npm run build`
Output directory: `dist`
