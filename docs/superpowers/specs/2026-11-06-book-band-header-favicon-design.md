# Book band, header menu and favicon — design

Date: 2026-11-06. Site: jordankrueger.com (Astro 7, Cloudflare Pages). Personal project.
Companion: http://jordans-mac-mini:3008/personal/jordankrueger-site/.claude/worktrees/book-header-docs/docs/superpowers/specs/2026-11-06-book-band-header-favicon-design.html

## Verdict

Four small changes, built as three independent slices: a homepage band for the picture book "Where the Roads Used to Be" (plus a Projects entry), a Projects dropdown in the header that absorbs AI and Tools, an external-link arrow after CampaignHelp, and a favicon made from the site's sun-and-leaf logo mark. No new dependencies, no new pages.

## Decisions (Jordan, 2026-11-06)

- D1. Book placement is concept A from the concepts page (http://jordans-mac-mini:3008/personal/design-mockups/jk-book/index.html), placed **below** the "Two practices I run" band and above the About panel.
- D2. The book's Projects entry goes in **Movement work** (`areas: ["movement"]`), not featured on the hub.
- D3. The top bar becomes: Blog, Projects (menu), About, CampaignHelp (external arrow). AI and Tools leave the top bar and live in the Projects menu.
- D4. On desktop, clicking or tapping "Projects" opens the menu; "All projects" is its first item. Hover also opens it on pointer devices.
- D5. Favicon = the existing `LogoMark` (sun circle + leaf) with literal colors.

## Slice 1 — book band (branch `book-band`)

Reuses: `.btn .btn-primary/.btn-outline`, tokens in `global.css`, `.fade-up`, `projects.json` + its zod schema, `ProjectCard` (renders entries with an `image`).
Adds:
- `public/images/book-cover.jpg`: the front cover, resized to 720px wide, progressive JPEG around q80 (source `~/ClaudeCode/personal/design-mockups/jk-book/img/cover-front-1000.jpg`, which is Jordan's own art from wheretheroadsusedtobe.com). Under 150 KB.
- A `<section class="book-band">` in `src/pages/index.astro` between the closing `</section>` of `.practices-band` and the About `panel-wrap`. Background `var(--color-bg-warm)`. Two columns at ≥900px (cover ~340px, copy), stacked below 900px with the cover capped at 260px.
- Copy, exactly (all from the book's own site, verified 2026-11-06):
  - h2: `I wrote a picture book`
  - lead line: `What if the highways became wildflower meadows?`
  - paragraph: `<em>Where the Roads Used to Be</em> follows Bear through a whole life in a hopeful future: robots doing the heavy work, nobody needing money for the basics, and a chosen family that just keeps growing.`
  - small line (color `--color-sun-text`): `For ages 4 to 8. Every paperback comes with a read-along edition.`
  - buttons: `Buy the paperback, $12.99` → `https://www.amazon.com/dp/B0HQC2G2CF` (primary) and `Visit the book's site` → `https://wheretheroadsusedtobe.com/` (outline). Both `target="_blank" rel="noopener"`.
- Cover `<img>` with width/height attributes, `loading="lazy"`, and the alt text: `Cover of Where the Roads Used to Be: Bear and his dog Biscuit sit under a blossoming tree on a hill above Pittsburgh, with a whale-shaped airship overhead.`
- `projects.json` entry inserted directly after "Freehold": `title` "Where the Roads Used to Be", `areas ["movement"]`, `image "/images/book-cover.jpg"`, `href` the book site, `linkLabel` "Visit the book's site", `secondaryLinks [{Amazon URL, "Buy the paperback"}]`, `body` = `<p>A picture book for ages 4 to 8. It follows Bear and his ever-growing chosen family through a hopeful future, for readers of every age who want to believe tomorrow can be kind, beautiful, healthy, and happy.</p><p>Every paperback unlocks a read-along edition that reads each page aloud.</p>`. No `featuredIn`, `builtWithAI` false.
- Price note: $12.99 is hard-coded; recorded in the repo CLAUDE.md under Recent work so a price change is easy to find.

## Slice 2 — header menu and external arrow (branch `nav-dropdown`)

Reuses: `Header.astro` (its `navLinks` array, `.nav-link` styles, the mobile overlay and its script), tokens.
Changes, all in `src/components/Header.astro`:
- `navLinks` becomes: Blog `/blog`; Projects (group); About `/about`; CampaignHelp `https://campaign.help` (external).
- Projects group children, in order: All projects `/projects`; Movement work `/projects/movement`; StarBase 118 `/projects/starbase-118`; Personal tools `/projects/personal`; Built with AI `/ai`; Tools for progressives `/tools`.
- Desktop: a disclosure pattern (a `<button aria-expanded aria-controls>` labelled "Projects" with a small chevron SVG, and a `<ul>` panel of plain links). Not an ARIA `menu` role. Opens on click/tap and on hover for `(hover: hover)` pointers; closes on Escape (focus returns to the button), on click outside, and when focus leaves the group. Panel styled as a card: `--color-bg-white`, 1px `--color-border`, `--radius-md`, `--shadow-soft`.
- Active state: the Projects button gets the existing active underline when the path starts with `/projects`, `/ai` or `/tools`; the matching child link gets `aria-current="page"`.
- Mobile overlay: "Projects" becomes a non-link label followed by the six child links indented, always visible (no nested toggle).
- External arrow: an inline SVG arrow (up-right, 0.8em, `aria-hidden="true"`) after "CampaignHelp" in both desktop and mobile nav, plus visually hidden text `(opens in a new tab)`.
- **One source of truth for visibility.** `BaseLayout` already adds `class="js"` to `<html>` before paint. Under `html.js`, the panel is visible if and only if the button has `aria-expanded="true"`; CSS never opens it by hover or focus. Hover is handled in the script: on `(hover: hover)` pointers, `pointerenter` on the group opens it and `pointerleave` closes it after a 150ms delay (cancelled on re-enter), **but only if keyboard focus is not inside the group** and the menu was not pinned. Clicking the button: if the menu is closed, it opens and is pinned; if it is open from hover, the click pins it (stays open, pointer exit no longer closes it); if it is open and pinned, the click closes it. Escape sets `aria-expanded="false"`, moves focus to the button, and the panel stays closed while the pointer is still over the button until the pointer leaves and re-enters. Clicking outside or focus leaving the group (`focusout` with `relatedTarget` outside) closes it.
- **JavaScript off (desktop only):** under `html:not(.js)` the panel opens with CSS `:hover` and `:focus-within` on the group. The mobile overlay already depends on JS and that existing limitation is kept as-is.
- **Mobile overlay scrolls:** add `overflow-y: auto` and `overscroll-behavior: contain` to `.mobile-nav-overlay` so all links (10 rows) stay reachable on short screens; checked at 390×600.
- Every motion respects `prefers-reduced-motion`.

## Slice 3 — favicon (branch `favicon`)

Reuses: `LogoMark.astro` geometry (viewBox 0 0 32 32; circle cx14 cy16 r10; leaf path).
Adds:
- `public/favicon.svg` replaced with that mark, fills `#f1b544` (sun) and `#2f6b3f` (leaf).
- `public/apple-touch-icon.png` 180×180: the mark centered on `#fbf7ec` with ~14% padding.
- `public/favicon-32.png` 32×32 transparent, as a fallback for browsers without SVG favicons.
- `src/layouts/BaseLayout.astro` head: keep the SVG icon link, add `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
- PNGs generated by a committed script `scripts/build-favicons.py` (Pillow via `uv run --with pillow`, drawing the same shapes), so the icons can be rebuilt.

## Testing

No test framework exists; each check is a command with an expected result, run against a local `astro preview` and then the Cloudflare Pages preview and live site.
- All slices: `npm run build` exits 0 (built from a copy outside `.claude/worktrees/`, per the repo CLAUDE.md gotcha).
- Slice 1: a Playwright check at 1440 and 390 wide: `.book-band` exists, comes after `.practices-band` and before `.about-panel` in DOM order, both hrefs exact, image loads (naturalWidth > 0); `/projects/movement` shows "Where the Roads Used to Be". Screenshot both widths.
- Slice 2: Playwright: at 1440 wide, top bar link texts are exactly Blog, Projects, About, CampaignHelp; clicking Projects sets `aria-expanded="true"` and shows 6 visible links with the exact hrefs; Escape sets it back to false, focus is on the button, and the panel is not visible even with the pointer still hovering the button; hovering the group opens it and moving away closes it; with focus on a child link, moving the pointer away keeps it open; tabbing past the last child link closes it; hover-open then click keeps it open after the pointer leaves, and a second click closes it; with JavaScript disabled, hovering and tabbing into the group show the panel; clicking outside closes it; on `/ai` the Projects button carries the active class and the Built with AI link has `aria-current="page"`; at 390×600 the overlay lists the six child links and the last link (Subscribe) can be scrolled into view and clicked; CampaignHelp contains an `svg[aria-hidden="true"]` and the hidden text. Mutation check: remove the Escape handler, confirm the check fails, restore.
- Slice 3: PNG sizes checked with Pillow (exactly 180×180 and 32×32); `curl` on the preview returns 200 and `image/svg+xml` / `image/png` for the three icon files; the built HTML contains all three `<link>` tags.
- **The header check is committed and kept:** `scripts/check-header.mjs <base-url>` (Playwright loaded from the playwright-skill install via `NODE_PATH=~/.claude/skills/playwright-skill/node_modules`; exits non-zero on any failed assertion). The repo CLAUDE.md gets a line: any PR touching `Header.astro` runs it against the Cloudflare Pages preview URL before merge, and against the live site after deploy. Owner: whichever Claude session makes the change; this is the recurring mechanism.
- Visual: design-critique screenshot loop on the homepage and the header (desktop, tablet, mobile) before merge.
- Live: after merge, the same checks against https://jordankrueger.com with a cache-buster.

## Reliability

(a) Personal project; errors surface as a failed Cloudflare Pages build or the branch-protection checks (OpenAI Logic Review, Anthropic Security Review) on each PR.
(b) Steps that can fail:

| Step | Fails loudly? | Report goes somewhere safe? | Can it recover? | Would we notice if it went quiet? |
|---|---|---|---|---|
| Cover resize (slice 1) | Yes, Pillow error stops the worker | Worker report file only | Re-run from the source file | Build check: image naturalWidth > 0 |
| Favicon PNG generation (slice 3) | Yes, script exits non-zero | Worker report file only | Re-run `scripts/build-favicons.py` | curl check on each icon file (200 + content type) |
| Cloudflare Pages build | Yes, PR check red | GitHub PR checks only | Fix and push | PR cannot merge without it |
| Preview and live checks | Yes, Playwright exits non-zero | Session log and the main session's report | Re-run with cache-buster; real failures go back to the worker | Main session runs them before declaring done; a hung run is killed by a 120s timeout |
| Header script error after deploy | No (silent in the browser) | n/a | Desktop menu still opens by hover/focus only when JS is off, so a JS error on desktop leaves the menu closed; the "All projects" hub is reachable from every area page and the footer | Playwright live check right after deploy; the header only changes when this repo changes, and the repo CLAUDE.md requires `scripts/check-header.mjs` on every PR that touches `Header.astro` |
| Amazon or book-site URL changes | No | n/a | Edit one string in index.astro and projects.json | Not watched automatically. Accepted with reason: Jordan owns both listings and would change the links himself; noted in the repo CLAUDE.md beside the price |

(c) Backup and rollback: each slice is one squash-merged PR; rollback = revert that commit via PR. Access: every file is a public static asset on a public site; only Jordan's `jordankrueger` GitHub account can merge, and deploys happen only through Cloudflare Pages on merge to `main`. No secrets, user input or data. Vendor APIs: none are called. The WAI-ARIA disclosure navigation pattern (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) is the accessibility reference for slice 2.

## Out of scope

Builds of concepts B or C, a /book page, changes to the hero's Amazon wishlist icon, the `/ai` page listing the book, SEO work.
