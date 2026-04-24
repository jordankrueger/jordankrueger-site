# Mission Control auto-draft workflow

**Date:** 2026-04-22
**Status:** Design approved
**Owner:** Jordan

## Goal

Automatically draft Mission Control newsletter campaigns in Listmonk when new blog posts accumulate on jordankrueger.com, without sending to the list. A weekly cron builds the draft and notifies Jordan via Drift; Jordan reviews, edits, and sends from the Listmonk admin UI.

## Non-goals

- Auto-sending to subscribers. Every send stays gated on Jordan's manual action.
- Replacing the humanizer + writing-voice review passes. Those run at send time, on the draft the workflow produced.
- Per-post emails. One draft per batch, matching the existing template's "posts since last update" framing.

## Context

- **Platform:** Listmonk on CH VPS (newsletter.campaign.help). List id 4 ("Mission Control"), template id 6.
- **Blog:** Astro site at jordankrueger.com, RSS feed at `/rss.xml`. Posts live in `src/content/posts/` as MDX.
- **Existing precedent:** PfAI social repurpose workflow on CH N8N queries Listmonk the same way proposed here. Weekly content sprint creates Drift tasks the same way proposed here.
- **Campaign 001** was sent manually on 2026-04-21 as a catch-up of 10 posts.

## Architecture

A single linear workflow on N8N CH (`n8n.campaign.help`). No persistent state — Listmonk is the cursor, RSS is the content source, Drift is the notification surface.

```
Cron (Fri 7:30am ET)
  → Fetch RSS (jordankrueger.com/rss.xml)
  → Fetch last MC campaign from Listmonk
      GET /api/campaigns?list_id=4&status=finished&order_by=created_at&order=desc&per_page=1
  → Check for pending draft/scheduled MC campaign → exit if found
  → Filter RSS items: pubDate > last_campaign.sent_at
  → If count < 2 → exit
  → Build HTML body from template + post data
  → POST to Listmonk: create campaign (status=draft, list=4, template=6)
  → POST to Drift API: create review task
  → Done
```

Secrets (already present on CH N8N from PfAI workflows):
- `LISTMONK_ADMIN_PASSWORD` — Basic auth for Listmonk API
- Drift API token — for task creation
- `RESEND_API_KEY` — for failure notifications

## Trigger and cadence

- **Schedule:** weekly, Fridays at 7:30am ET (cron: `30 7 * * 5` with TZ set on the N8N instance).
- **Skip rule:** if fewer than 2 new posts since the last `finished` Mission Control campaign, exit with no side effects.
- **Pending-draft guard:** if a Mission Control campaign is already in `draft` or `scheduled` status, skip this week (don't stack drafts).

## Cursor logic

Source of truth: `sent_at` on the most recent `finished` campaign in list 4.

Edge cases:
- **No prior finished campaigns** (hypothetical reset): fall back to "posts in the last 14 days" and fire a Resend alert so Jordan knows the fallback path ran.
- **Listmonk query failure:** same 14-day fallback + Resend alert. Never block on transient API issues.
- **Post edited post-publish:** ignored. Only `pubDate > sent_at` triggers.
- **Posts with `draft: true`:** already excluded by the Astro RSS config (`!data.draft`).

## Template build

### Data pulled from RSS per post

- `title`
- `description`
- `link` (absolute URL)
- `pubDate`
- **Cover image** — NOT currently in the RSS feed. See Dependencies below.

### Rendered sections

- **Intro (per Q3 decision: templated, not AI-generated):**
  - 1 post: `"One new post since the last update."`
  - 2+ posts: `"{N} new posts since the last update."`
- **Post cards:** one block per post. Cover image (or omitted if unavailable), linked title, description. Order: newest first.
- **Footer:** existing template footer — no change.

### Campaign fields

| Field | Value |
|---|---|
| `name` | `Mission Control 00{N}` where N = (count of finished MC campaigns) + 1 |
| `subject` | `Mission Control: {first_post_title}` |
| `lists` | `[4]` |
| `template_id` | `6` |
| `from_email` | `Jordan Krueger <jordan@jordankrueger.com>` |
| `status` | `draft` (never `scheduled`, never auto-sent) |
| `tags` | `["mission-control", "auto-drafted"]` |
| `content_type` | `html` |

Campaign name, subject, and body are all editable by Jordan in the Listmonk admin UI before send.

## Drift task

Created via Drift API after Listmonk draft succeeds.

| Field | Value |
|---|---|
| Title | `Review + send Mission Control 00{N} ({N_posts} posts)` |
| Description | Listmonk admin deep link to draft + bulleted list of post titles |
| Project | Personal |
| Due date | Following Monday (Friday drop + weekend buffer) |
| Energy | low |
| Flagged | no |

## Error handling

| Failure | Behavior |
|---|---|
| RSS fetch fails | Exit. Resend alert to jordan@campaign.help. No draft, no Drift task. |
| Listmonk "last campaign" query fails | Fall back to 14-day cursor. Continue. Resend alert so Jordan knows fallback fired. |
| Listmonk campaign create fails | Exit. Resend alert. No Drift task (nothing to review). |
| Drift task create fails | Listmonk draft still exists. Resend fallback email with the draft's admin URL. |
| Pending MC draft already exists | Clean exit, log-only. No alert (expected state). |
| < 2 new posts | Clean exit, log-only. No alert. |

All Resend alerts go to `jordan@campaign.help`. Subject pattern: `[MC auto-draft] <status>`.

## Human review gates preserved

- Workflow **never** sends. `status=draft` always.
- Jordan's existing humanizer + writing-voice passes happen in the Drift review step, operating on the generated body HTML.
- The "never send to real subscribers without explicit go-ahead" rule (site CLAUDE.md) is respected by construction — the workflow has no path to set `status=sent` or `status=scheduled`.

## Dependencies

### RSS feed change (blocker)

The current RSS config at `src/pages/rss.xml.js` does not emit cover images. Two options:

1. **Add `customData` with cover image** to the RSS feed. Workflow parses it. (Preferred — minimal site change.)
2. **Fetch each post's HTML page** and extract cover image. (Higher cost, more brittle.)

Implementation plan should pick option 1 and include the RSS config edit.

### No other infrastructure changes

- CH N8N already has Listmonk network access (used by PfAI workflows).
- Drift API is already in use from Mac Mini; N8N CH needs the API token in env (verify during implementation).

## Testing plan

1. **Dry-run mode.** Workflow reads a `dry_run` boolean from the webhook/manual trigger input. When true, skip the Listmonk create + Drift create; log the generated HTML and campaign JSON to execution history. Run with varying `sent_at` values to confirm the filter.
2. **Live test.** Disable cron, manual execution, inspect the actual draft in Listmonk admin and the Drift task. Delete the test draft and Drift task afterward.
3. **Skip-rule test.** Ensure the most recent finished MC campaign's `sent_at` is very recent → manual run → confirm clean "< 2 posts" exit.
4. **Pending-draft test.** Leave a draft MC campaign in place → manual run → confirm clean "pending draft" exit.
5. **Failure paths.** Temporarily break credentials / hostnames to verify Resend alerts fire and no partial state is left behind.

## Open questions

None at design time. All decisions captured above.

## Out of scope / future

- Email-based welcome drip for new subscribers (separate automation, noted in `personal/automation-strategy/recommendations.md`).
- Subject-line A/B testing.
- Analytics loop (click-through → topic selection).
