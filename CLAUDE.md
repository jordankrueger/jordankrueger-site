# jordankrueger.com — Personal Site

## Stack
- **Astro 7.1.4** static site generator with MDX for blog posts (upgraded from 5.18 on 2026-07-27 — cleared all 40 open Dependabot alerts; see the "Astro 7 punctuation gotcha" note under Blog Posts below)
- **Cloudflare Pages** — auto-deploys on push to `main`. Node version pinned via `.nvmrc` (`22`) — Astro 7 requires Node >=22.12 and the CF Pages project has no `NODE_VERSION` env var set, so the build depends on the `.nvmrc` file
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
- `src/styles/` — global.css (design tokens and base styles)
- `public/fonts/` — Self-hosted woff2 fonts (Bricolage Grotesque variable); `@font-face` rules live in `public/fonts.css`
- `scripts/check-contrast.mjs` — WCAG contrast check on the `:root` color tokens; run `node scripts/check-contrast.mjs` after any token change (exit 1 = a pair fails)
- `public/images/` — All site images with descriptive names
- `carrd-export/` — Original Carrd site for content reference

## Design System
Solarpunk (redesign, 2026-10-25). Spec: `docs/superpowers/specs/2026-10-25-solarpunk-redesign-design.md`.
- **Colors:** all tokens in `:root` of `src/styles/global.css`; no literal colors anywhere else. Cream page `--color-bg: #fbf7ec`, ink `--color-text-logo: #21342a`, body `--color-text: #4c5d51`, leaf accent `--color-accent: #2f6b3f`, sun `#f1b544` (decoration only; use `--color-sun-text` for text)
- **Fonts:** Bricolage Grotesque (headings and body, weights 400-700)
- **Shape:** cards 14px radius with 1px border; buttons and tags pill-shaped
- **Breakpoints:** 900px (tablet), 640px (mobile)

## Pages
- `/` — Homepage with services, about, blog posts, newsletter, contact
- `/blog` — Blog listing
- `/projects` — Projects hub (redesign round 2, 2026-10-25): four columns (Movement work, StarBase 118, Personal tools, Built with AI), each with a drawing, an intro line, three featured entries and a link. Area pages: `/projects/movement`, `/projects/starbase-118`, `/projects/personal` (shared `ProjectsArea.astro`; entries with an image get a full `ProjectCard` panel, the rest a two-column card grid).
- **Project data lives in one place:** `src/content/projects.json` (the `projects` content collection; zod schema in `src/content.config.ts`, so `astro build` rejects a missing or mistyped field). Fields: `areas`, `builtWithAI`/`aiGroup`, `featuredIn`/`short` (hub picks; order set by `FEATURED_ORDER` in `src/lib/project-areas.ts`), Projects-page fields (`body` HTML, `image`, `href`, `linkLabel`, `secondaryLinks`) and AI-page fields (`aiDescription`, `tags`, `status`, `statusType`). Add or edit a project there, not in the pages. `scripts/check-projects-migration.mjs` was the one-time proof the move lost nothing (pinned to commit 39b5c50).
- `/ai` — "I'm not a developer. I built all of this anyway." Hero, stats, story and stories live in `ai.astro`; the builds come from the `projects` collection (`builtWithAI`), shown as grouped `<details>` rows (`AiProjectRow.astro`).
- `/synthwave` — "Best of Synthwave": Jordan's favorite synthwave tracks with Apple Music, artist and Spotify links. Data in `src/data/synthwave.json`, rebuilt from the Apple Music library export with `uv run python scripts/build-synthwave.py` (Spotify links are search links; exact ones would need a Spotify developer app). Linked from the About page's interest buttons (Synthwave, Star Trek, Technology & AI).
- `/tools` — Progressives Projects Portal. Curated catalog of free/open tools for advocacy orgs. Data lives in the `tools` Astro content collection (`src/content/tools/*.yaml`). One YAML file per category; each file contains `category:` metadata and an `entries:` array. Adding a tool = editing the relevant YAML + push. Zod schema lives in `src/content.config.ts`. Uses `ToolCard` and `ToolCategory` components.
- `/building` — Building in Public series (posts tagged `claude-code`). No `building.astro` page exists — `public/_redirects` 301s `/building` → `/blog?tag=claude-code` instead (verified live 2026-07-27, returns 200 after redirect). Not a broken route, just an unconventional implementation — worth knowing before assuming a missing page needs building.
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

Tag `claude-code` to include in the Building in Public series at `/building` (see caveat above — it's a redirect, not a real page).

**Astro 7 punctuation gotcha:** Astro 7's Markdown renderer (Sätteri) maps a literal `--` in prose to an **en dash (–)**, not the em dash (—) that remark/rehype (Astro 5) produced via smartypants. If a draft uses `--` for an em dash, it will render wrong after the fact — write literal em dashes (`—`) directly in MDX instead of relying on `--` auto-conversion. (Caught 2026-07-27 during the Astro 5→7 upgrade: silently changed 16 asides across `fediverse-ai-problem.mdx` and `you-need-to-learn-ai.mdx`.)

## Writing standard (set 2026-10-04)
Blog posts are short and simple: roughly 500-800 words, one idea, short sentences, point first. On 2026-10-04 the private-links post (PR #63) and 12 "I built X with Claude Code" posts (PR #64) were cut from 589-1,818 words to 489-831. Not shortened (built differently): ai-bodyguard, the-open-web-is-back-in-reach, fediverse-ai-problem, you-need-to-learn-ai, ai-research-hallucination, awesome-actionkit, progressive-email-suppression, password-security, ai-notetakers.
- Check a post with `uv run python ~/.claude/skills/humanizer/ste_check.py <file>` (flags sentences over 25 words, paragraphs over 6 sentences).
- Always cut from the live file in `src/content/posts/`, never from the voice-edits draft copy (a stale draft reintroduced weaker code and was blocked by the OpenAI Logic Review).
- `npm run build` fails inside a `.claude/worktrees/` worktree (Astro cannot find its tsconfig); build from a copy outside the repo.
- When grepping a live page for a marker, avoid apostrophes: Astro renders them as curly quotes.

## Project Cards (`src/components/ProjectCard.astro`)

Takes a `secondaryLinks` array prop (not a single `secondaryLink` string) — each item is `{ href, label }`. Renders as multiple action buttons per card with `flex-wrap` on `.project-card-actions`. Used e.g. on the StarBase 118 card to show both the TrekStories ebook link and the Medium piece.

Optional `linkLabel` prop sets the main button text (default "Learn More"), e.g. "Email Hasher" on the small-tools card. (Freehold's "Try the alpha app" is a `secondaryLinks` entry, not `linkLabel`.)

## External Services
- **Newsletter signup:** POST to `https://progressives-signup.restless-salad-a31e.workers.dev`
  - Worker source: `side-hustle/progressives-for-ai/progressives-for-ai/worker.js` (personal CF account — use `PERSONAL_CLOUDFLARE_API_TOKEN`)
  - Signups go to **Listmonk Mission Control list (id 4)** on CH VPS (newsletter.campaign.help)
  - AK Template form also posts here with `bonus=ak-template` → triggers Resend transactional welcome email to new subscriber
  - **Cloudflare Turnstile is required for `list=mission-control` only.** Every Mission Control form must render the Jordan widget with `data-action="newsletter"`; current forms are `NewsletterSignup.astro` and the AK Template form in `pages/tools.astro`. The public site key lives in the components; `TURNSTILE_SECRET_KEY` is a secret on the shared Worker. Do not make Turnstile global on that Worker unless every Progressives for AI caller is updated too.
  - **Adding a new signup form (here or on any other site): see `claude-management/reference/signup-forms.md` for the canonical pattern (worker architecture, lookup+attach for existing subscribers, client-side response handling, anti-patterns).**
- **Contact form:** POST to `https://jordankrueger-contact-form.restless-salad-a31e.workers.dev` (sends email via Resend to jordan@jordankrueger.com). Worker source in `workers/contact-form/`. Cloudflare Turnstile uses `data-action="contact"`; `TURNSTILE_SECRET_KEY` is a Worker secret. Deploy with `CLOUDFLARE_API_TOKEN="$PERSONAL_CLOUDFLARE_API_TOKEN" npx wrangler deploy` from that directory.
- **Turnstile CSP:** `public/_headers` must allow `https://challenges.cloudflare.com` in both `script-src` and `frame-src`; otherwise the HTML looks correct but no challenge/token renders.
- **Analytics:** Google Analytics `G-QJQ0PD6XHD`

## Mission Control Newsletter

> **⚠️ Brand home under reconsideration (2026-04-29):** Jordan is thinking about relocating Mission Control to live under the **Grounded AI** brand instead of jordankrueger.com. Implications to think through before executing: from-address change (`jordan@groundedai.help`), template rebrand, signup-form destinations on jordankrueger.com (do they still flow here, or get a different newsletter?), notification to existing 5 subscribers about the brand change, and N8N auto-draft workflow source filter. **No action yet** — just flagging.

- **Platform:** Listmonk on CH VPS (newsletter.campaign.help). List id 4, name "Mission Control".
- **Template:** id 6 ("Mission Control") — source at `email-templates/mission-control-template.html`
- **Campaigns:** `email-templates/` (untracked) — issue 001 as `mission-control-001-body.html`; from 002 on, one folder per issue (`mission-control-NNN/` with `content.json`, `body.html`, `preview.html`)
- **From address:** `Jordan Krueger <jordan@jordankrueger.com>` — must set per-campaign (Listmonk default is PfAI's address)
- **Subscriber count:** 9 recipients as of 2026-10-15 (8 confirmed + 1 unconfirmed; list is single opt-in, so unconfirmed still receive). Listmonk's list-level `subscriber_count` reads 18 and is wrong; count by enumerating `/api/subscribers?list_id=4`.
- **Sent issues:** #1 2026-04-21; #2 2026-10-15 (campaign 42, 9/9 sent) is the current gather cursor.
- **Sending gate:** NEVER send to the real list without Jordan's explicit go-ahead. Test sends to Jordan's own addresses only (default jordan@campaign.help; on 2026-10-15 he asked for jordan@jordankrueger.com, overridden one-off).
- **Humanizer gate:** Run MC body HTML through humanizer + writing-voice skills before any real send.
- **Reminder workflow:** Weekly (Fri 7:30am ET) on N8N CH, workflow id `7xsz8xvMCQKyiIeR`. When ≥2 new posts have piled up since the last MC send, it creates a Notion task "Mission Control NNN is ready … run /mission-control" (skips if one is already open, or if an unsent MC campaign exists). It no longer builds the draft. Full docs in `personal/automation-strategy/CLAUDE.md` → Mission Control Auto-Draft.
- **Building an issue:** `/mission-control` (`~/.claude/commands/mission-control.md`) — new posts + a "What I'm working on" section from items Jordan approves (pulled from in-flight Notion Projects + session logs, with MFC/client/SB118-internal/personal items filtered out), voice + humanizer passes, then `scripts/mission-control.py` renders a preview, creates the Listmonk draft, and sends a test to jordan@campaign.help. Jordan sends from Listmonk.
- **Gotcha:** Listmonk's `GET /api/campaigns` ignores `?list_id=` and returns every list's campaigns. Filter by `lists[].id` in code. This silently stalled MC from April to October 2026, because the cursor kept landing on the weekly PfAI send. Cloudflare also 403s Python's default user agent on `/rss.xml`.
- **See also:** `side-hustle/progressives-for-ai/CLAUDE.md` for full Listmonk SSH access patterns and SMTP config.

## Unlisted Share Pages

`public/share/<slug>/index.html` — drop any static HTML file here and it's instantly live as an unlisted page with no search indexing.

- **URL pattern:** `https://jordankrueger.com/share/<slug>/`
- **Security:** random unguessable slug + noindex + no-referrer. Not auth-protected — suitable for non-sensitive content you want to share privately.
- **Auto-covered headers** (from `public/_headers` rule on `/share/*`):
  - `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
  - `Referrer-Policy: no-referrer`
- **robots.txt:** `Disallow: /share/` already in place
- **Sitemap:** Astro sitemap won't include files from `public/` — only `src/pages/`
- **To add a new share:** drop `public/share/<new-slug>/index.html` and push. No config changes needed.

## Deployment
Push to `main` branch → Cloudflare Pages auto-deploys.
Build command: `npm run build`
Output directory: `dist`

> **Branch protection on main:** Despite being a solo repo, `main` requires 2 status checks (OpenAI Logic Review + Anthropic Security Review) + Cloudflare Pages preview. Do NOT push directly to `main` — use a feature branch + PR + `gh pr merge --squash`. The standard "commit straight to main" git-workflow rule does not apply here.

## Retired / Redirected Pages
- `/building` — Deleted (May 2026). `public/_redirects` sends `/building` → `/blog?tag=claude-code` (301). The blog's tag-filter JS auto-clicks the filter. Update internal links to `/blog?tag=claude-code` instead of `/building`.
- `coaching.jordankrueger.com` — Retiring (May 2026). Carrd unpublish + DNS record deletion pending.

## Recent posts
- **"I had 6,896 songs I'd never played, so I let rules decide what to do with them"** (`/blog/never-played-songs/`) — published 2026-11-02, PR #82 (6f8a1d5), CI green, live-verified. Cover via Higgsfield `nano_banana_pro` (246K). Research notes in `drafts/never-played-songs-research-notes.md` (drafts/ is gitignored, main tree only). Apple Sync Library delete page (support.apple.com/en-us/102344) cited by the ChatGPT review but not fetched by Claude; marked PARTIAL.
- **"Where are we actually going?"** (`/blog/where-are-we-actually-going/`) — published 2026-10-30, PR #78 (ea9c8eb), CI green, live-verified. Cover via Higgsfield `nano_banana_pro` (gpt-image-1 is retired). About 1,300 words, over the 800 cap; Jordan published anyway.
- **"Can our own AI bodyguard stop AI dangers?"** (`/blog/ai-bodyguard/`) — published 2026-09-15, PR #57 (post) + #58 (Sources section), both squashed and merged, CI green, live-verified. Cover image via Higgsfield `nano_banana_pro`.

**Gotcha:** a fresh worktree has no `node_modules`; run `npm ci` there before `npm run build` (the main tree's install was missing astro on 2026-10-30).

## Open branch — Cloudflare Turnstile (NOT merged)
`turnstile-forms` branch (commit `b491d16`), pushed to origin, deliberately held. Adds Cloudflare Turnstile to the contact form and the newsletter signup form (CSP update, widget markup, worker siteverify, index.test.js). Rescued from an in-progress prior-session checkout on 2026-09-15 and verified byte-for-byte before committing. **Not reviewed or tested — do not merge without review**, since it puts a captcha on two live production forms.

## Housekeeping backlog
- `public/images/logo-hiringpledge.jpg` and `logo-fourdayswithai.jpg` are no longer used on /projects (2026-10-04). Grep other pages before deleting.
- Decide whether to merge/review the `turnstile-forms` branch above, or drop it.

## Redesign (in progress, started 2026-10-25)
New visual design for the whole site; content and most of the layout stay. Work happens on the local `redesign` branch in the worktree `personal/jordankrueger-site-work/redesign`, previewed with `npx astro dev --host 0.0.0.0 --port 4322` at http://jordans-mac-mini:4322 (Tailscale only). The branch is not pushed, because pushing would make a public Cloudflare Pages preview.
- Headshots DONE 2026-11-05: `headshot-hero.jpg` = Jordan_0547 (warm curtain), `headshot-about.jpg` = Jordan_0545 (gray backdrop); 800px squares under 90KB, originals in `~/ClaudeCode/dropbox/`. Old `hero-jordan.png` / `jordan-portrait.jpg` deleted. origin/main merged in 2026-11-05 (67c9575); three newer posts retagged to fit the six topics.
- **Not committed on purpose:** the "left accelerationist" manifesto section in `src/pages/about.astro` (working-tree change since 2026-10-25, no record Jordan approved it or that it went through voice + humanizer). Keep it out of commits until Jordan says keep, edit or drop.
- **Launch item: Own Your Corner series (added 2026-11-05).** Three posts are in `src/content/posts/` as `draft: true`: `why-everyone-should-have-a-website`, `build-your-own-website`, `connect-your-website-to-the-fediverse` (covers `public/images/gallery/blog-own-your-corner-part-{1,2,3}.jpg`; research notes in the main tree's `drafts/own-your-corner/`). At "ship it", flip all three to `draft: false` and set `pubDate` to launch day, but only once both are true:
  - (a) DONE 2026-11-05: Part 2 rewritten to match the 2026-11-05 run-through (Deploy to Cloudflare button, Git account dropdown, Deploy, Domains → Registrations → Buy domain, project → Domains tab → Add Domain, red-X heads-up on the first pull request). 14 screenshots in `public/images/gallery/own-your-corner/` (Cloudflare login email covered in the header). The Starter Pack checklist got the same label fixes. Placeholder and UNVERIFIED comment removed.
  - **Remaining before launch:** only the Worker deploy and test signup in (b) STILL OPEN below.
  - (b) DONE 2026-11-05 (commit a514fee): Starter Pack page at `public/share/starter-pack-17c6c919faea/` (live URL after deploy: https://jordankrueger.com/share/starter-pack-17c6c919faea/), and Part 2's signup form. Part 2 renders `NewsletterSignup` inline with `bonus="starter-pack"` and its own copy props; `hideNewsletter: true` in its frontmatter skips the layout's form so the post has one form. Parts 1 and 3 keep the layout form.
  - (b) STILL OPEN: deploy the starter-pack Worker change after Jordan reviews it, then test-submit with Jordan's own address. The change is branch `feature/starter-pack-bonus` (commit a43901d, local only, not pushed) in the worktree `side-hustle/progressives-for-ai/progressives-for-ai/.claude/worktrees/starter-pack-bonus`. Until it is deployed the live Worker ignores `bonus=starter-pack` (subscribes, sends nothing), so deploy it before the series goes live.
  - DONE 2026-11-05: Part 2's contact line now reads "Need this set up for your organization? CampaignHelp can do it for you." linking to https://campaign.help.
