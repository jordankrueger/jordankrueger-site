# Mission Control email template — design spec

**Date:** 2026-04-19
**Status:** Approved (visual direction)
**Decision context:** Session 2026-04-19 — brainstorming after migrating Beehiiv subscribers to Listmonk Mission Control list (id 4).

## Goal

A reusable HTML email template for the Mission Control newsletter, sent from Listmonk on the CH VPS to the Mission Control list. Visually reminiscent of jordankrueger.com — warm earth-tone palette, Lora serif headings on serif-fallback. Renders correctly in major mail clients (Apple Mail, Gmail web, Gmail mobile, Outlook). The first send notifies subscribers about two recent blog posts: `leaving-raindrop` and `two-ais-disagree`.

## Email shape

**Type:** post-notification + breadcrumbs (decision: Q1=C). Each issue is primarily a list of recent blog posts with cover image + short blurb + read-more link. The newsletter IS the posts.

**Optional intro block** (decision: Q2=D). The template supports a one-paragraph optional intro at the top — defaults to nothing, used when Jordan has a quick handshake to add. Renders only if the intro variable is present.

**Visual direction** (decision: Q3=C — "Warm zine"):
- Full-width warm-cream hero (`#FCF3DE`) holding the masthead
- Page background outside hero is `#EDEDED` (matches site)
- Posts as full-width white cards with cover image on top, title + description + read-more inside
- Terracotta accent (`#AF4C2A`) used for "Read the post →" link only
- Footer is muted brown text with a few links (jordankrueger.com / Past issues / Unsubscribe)

## Sections (top to bottom)

1. **Masthead** (warm-cream band, `#FCF3DE`)
   - Stacked "Mission / Control" wordmark in Lora serif, 36px, color `#2C2C54` (logo color)
   - Subhead in DM Sans, 12px, uppercase, letter-spaced: "A newsletter from Jordan Krueger · {date}"
   - No issue number (decision: leave it off — see "Looks good, ship it")

2. **Optional intro** (renders only if `{intro}` variable is set)
   - Single paragraph, body font, 15px, line-height 1.55
   - Padding 22px / 32px

3. **Post breadcrumbs** (one block per post, looped)
   - Container: white background, 1px `#DCC0A0` border, 10px radius, 24px outer padding
   - Cover image: full-width, 140px tall, object-fit cover
   - Title: Lora serif, 19px, color `#2C2C54`, line-height 1.25
   - Description: DM Sans, 13.5px, color `#5C5248`, line-height 1.5
   - Link: "Read the post →" — terracotta `#AF4C2A`, 13.5px, semibold, no underline

4. **Footer** (no background, sits on page bg)
   - Centered links separated by `·`: jordankrueger.com / Past issues / {{ UnsubscribeURL }}
   - 11.5px, color `#8A7E74`
   - 28px bottom padding

## Color tokens (from site CSS)

| Use | Hex |
|---|---|
| Page bg | `#EDEDED` |
| Hero band bg | `#FCF3DE` |
| Card bg | `#FFFFFF` |
| Border | `#DCC0A0` |
| Body text | `#5C5248` |
| Muted text | `#8A7E74` |
| Logo / heading dark | `#2C2C54` |
| Accent (link) | `#AF4C2A` |

## Typography

- **Headings:** `'Lora', Georgia, 'Times New Roman', serif`
- **Body:** `'DM Sans', 'Helvetica Neue', Arial, sans-serif`
- Custom web fonts will not load in Apple Mail or Outlook. The serif fallback (`Georgia`) is acceptable; the sans fallback (`Helvetica Neue` / `Arial`) is acceptable. No font CDN, no @font-face, no `<link>` tags.

## Email-client constraints (implementation guardrails)

- **HTML must use table-based layout** for max compatibility (Outlook still doesn't reliably handle CSS flex/grid).
- **All CSS inline.** No `<style>` blocks (Gmail strips them inconsistently).
- **No background images.** Cover images go in `<img>` tags. Hex backgrounds only.
- **Image widths fixed in markup** (`width="..." height="..."`). Outlook ignores CSS width on images.
- **Outer width:** 600px max. Mobile collapses naturally because the layout is single-column with images that scale.
- **No JavaScript.** Email clients strip it.
- **Unsubscribe link:** uses Listmonk's `{{ UnsubscribeURL }}` template variable.
- **List + recipient variables:** Listmonk Go template syntax — `{{ .Subscriber.FirstName }}` if needed (probably not).

## Listmonk integration

- **Template type:** Campaign template (not a transactional template)
- **Template name:** `Mission Control`
- **Template body:** the HTML described above with placeholders for the per-campaign variables (intro text, post array)
- **Per-campaign variables:** since Listmonk doesn't have per-campaign template variables natively, the post breadcrumbs will be authored as part of the campaign body each time, with the template providing the surrounding chrome (header + intro slot + posts slot + footer)
- **Storage:** Insert into the `templates` table via SQL on the CH VPS

## First-send content

Once the template is in place, the first campaign:
- **Subject:** TBD (will draft, await Jordan's approval)
- **Intro:** "Two new posts since the last update — both about building things with Claude Code." (or similar — to confirm)
- **Posts:**
  - `leaving-raindrop` — using the cover image at `/images/gallery/blog-leaving-raindrop.jpg`
  - `two-ais-disagree` — using the cover image at `/images/gallery/blog-two-ais-disagree.jpg`
- **Recipients:** Mission Control list (id 4) — currently 5 confirmed subscribers (Jordan x2 plus 3 real subscribers from the Beehiiv migration)

## Sending guardrail (durable rule)

Per Jordan's explicit instruction (2026-04-19): **No emails sent to subscribers without per-send explicit approval.** Test sends go to Jordan's own addresses only. The template will be tested via Listmonk preview + a test campaign sent to jordan@campaign.help before any campaign is sent to the full list.

## Out of scope (not in this spec)

- Other types of MC campaigns (essays, link roundups, project announcements). Those can extend this template later, but the first version is post-notification only.
- Past-issues archive page on jordankrueger.com (mentioned in footer). Footer link can be a placeholder for now.
- Open-tracking, click-tracking customization. Use Listmonk defaults.
- Auto-archive workflow (PfAI has one — MC could get one later).

## Open questions for the build phase

1. Subject line for the first send.
2. Exact intro copy for the first send.
3. Whether to show an "Issue 1" number or not (currently no — confirmed). The first email is implicitly Issue 1.

These will be addressed during the build, not in this design.
