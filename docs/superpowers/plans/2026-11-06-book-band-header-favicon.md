# Book band, header menu and favicon — implementation plan

> Execution: three Codex workers (gpt-6.1-sol) in parallel, one per slice, each in its own Herdr tab and git worktree. Claude reviews every diff, then a Codex adversarial review, then merge one PR per slice.

**Goal:** Ship the homepage book band (+ Projects entry), the Projects dropdown with an external arrow on CampaignHelp, and a logo-mark favicon.

**Architecture:** Static Astro edits only. Slice 1 touches `index.astro`, `projects.json` and one image. Slice 2 touches only `Header.astro`. Slice 3 touches `public/` icons and the `<head>` of `BaseLayout.astro`. No file is shared between slices, so they merge in any order.

**Tech stack:** Astro 7.4, plain CSS tokens in `src/styles/global.css`, inline `<script>` in components, Playwright (from `~/.claude/skills/playwright-skill/node_modules`) for checks, Pillow via `uv run --with pillow` for images.

**Spec:** `docs/superpowers/specs/2026-11-06-book-band-header-favicon-design.md` (read it; its copy, URLs and behaviors are exact and binding).

## Global constraints

- No new npm dependencies. No changes outside the files each task lists.
- Colors only through existing `var(--color-*)` tokens (favicon files are the one exception: literal `#f1b544`, `#2f6b3f`, `#fbf7ec`).
- Sentence case for all visible text. No emoji. Icons are inline SVG with `aria-hidden="true"`.
- All motion inside `@media (prefers-reduced-motion: no-preference)`.
- `node_modules` in each worktree is a symlink to the main tree; never commit it, never run `npm install`/`npm ci`.
- Build: `npx astro build` from the worktree root must exit 0. Preview: `npx astro preview --host --port <your port>`.
- Never push, never open a PR, never merge. Commit on your branch only.

## Review focus

1. Keyboard user tabs into the Projects menu, then moves the mouse away: the menu must stay open while focus is inside.
2. Escape while the pointer still rests on "Projects": the menu must stay closed.
3. Phone in landscape (390×600 or shorter): every mobile menu link, including Subscribe, reachable by scrolling.
4. Desktop with JavaScript disabled: Projects menu still opens on hover and on Tab focus.
5. Homepage on a 768px tablet: the book band stacks cleanly and the cover does not stretch past 260px.

---

### Task 1: Homepage book band and Projects entry (worktree `book-band`, preview port 4330)

**Files:**
- Create: `public/images/book-cover.jpg` (from `/Users/jordankrueger/ClaudeCode/personal/design-mockups/jk-book/img/cover-front-1000.jpg`, 720px wide, progressive JPEG q80, < 150 KB)
- Create: `scripts/check-book-band.mjs`
- Modify: `src/pages/index.astro` (new section after the `.practices-band` `</section>`, before the About `panel-wrap`; styles in that page's existing `<style>` block)
- Modify: `src/content/projects.json` (new entry directly after the "Freehold" object)
- Modify: `CLAUDE.md` (one line under Recent posts or Redesign noting the band, the $12.99 price and the two URLs live in `index.astro` + `projects.json`)

**Interfaces:** Produces `.book-band` section class; `node scripts/check-book-band.mjs <base-url>` exits 0/1.

- [ ] **Step 1: Write the check.** `scripts/check-book-band.mjs <base>` (Playwright via `NODE_PATH`), asserting at 1440×900 and 390×844 on `<base>/`: `.book-band` exists; in DOM order it follows `.practices-band` and precedes `.about-panel`; `h2` text is `I wrote a picture book`; the primary button href is exactly `https://www.amazon.com/dp/B0HQC2G2CF` with text `Buy the paperback, $12.99`; the outline button href is exactly `https://wheretheroadsusedtobe.com/`; both have `target="_blank"` and `rel` containing `noopener`; the cover image `naturalWidth > 0` after scrolling into view; at 768 wide the rendered cover width ≤ 260. Then on `<base>/projects/movement`: text `Where the Roads Used to Be` is visible. Saves screenshots to `/tmp/book-band-<width>.png`. Exit 1 on any failure, printing which.
- [ ] **Step 2: Run it against a preview of unmodified main.** Expected: FAIL (`.book-band` missing).
- [ ] **Step 3: Make the image, the section and the JSON entry** with the exact copy, alt text, and JSON fields in the spec's Slice 1. Section uses `.fade-up` like neighbors. Two-column grid ≥ 900px (cover column 340px), stacked below with cover max 260px.
- [ ] **Step 4: Build, preview, re-run the check.** Expected: exit 0. Look at the screenshots yourself.
- [ ] **Step 5: Commit** (`Homepage: book band below the practices; book in Movement projects`), then a second commit for `CLAUDE.md` + the check script if not already included.

### Task 2: Projects dropdown and external arrow (worktree `nav-dropdown`, preview port 4332)

**Files:**
- Modify: `src/components/Header.astro` (markup, styles, script)
- Create: `scripts/check-header.mjs`
- Modify: `CLAUDE.md` (one line: any PR touching `Header.astro` runs `NODE_PATH=~/.claude/skills/playwright-skill/node_modules node scripts/check-header.mjs <preview-url>` before merge and against the live site after deploy)

**Interfaces:** Produces `node scripts/check-header.mjs <base-url>` exiting 0/1. Markup hooks the check relies on: `.nav-group` wrapper, `.nav-group-btn` (the `<button>`), `#projects-menu` (the panel `<ul>`), `.mobile-nav-group` for the mobile list, `.ext-icon` for the arrow SVG, `.sr-only` text `(opens in a new tab)`.

- [ ] **Step 1: Write the check** covering every Slice 2 assertion in the spec's Testing section, verbatim: top-bar link texts exactly `Blog, Projects, About, CampaignHelp`; click opens with 6 visible links whose hrefs are exactly `/projects`, `/projects/movement`, `/projects/starbase-118`, `/projects/personal`, `/ai`, `/tools` and texts `All projects, Movement work, StarBase 118, Personal tools, Built with AI, Tools for progressives`; Escape closes, focus on button, panel hidden while pointer still over button; hover opens and leaving closes; focus inside + pointer away stays open; tab past last child closes; hover-open then click stays open after pointer leaves, second click closes; click outside closes; on `/ai` the button has class `active` and the Built with AI link has `aria-current="page"`; JS disabled (new context with `javaScriptEnabled:false`) hover and Tab-focus show the panel; 390×600 mobile overlay lists the six child links and Subscribe can be scrolled to and clicked; CampaignHelp contains `svg.ext-icon[aria-hidden="true"]` and `.sr-only` text `(opens in a new tab)` on desktop and mobile.
- [ ] **Step 2: Run it against a preview of unmodified main.** Expected: FAIL.
- [ ] **Step 3: Implement** per the spec's Slice 2 (disclosure pattern, visibility driven only by `aria-expanded` under `html.js`, CSS fallback only under `html:not(.js)`, pin-on-click, 150ms pointer-leave delay that never closes while focus is inside, overlay `overflow-y: auto; overscroll-behavior: contain`). Add `.sr-only` locally in the component if `global.css` has none (check first with grep).
- [ ] **Step 4: Build, preview, re-run.** Expected: exit 0.
- [ ] **Step 5: Mutation check.** Delete the Escape handler, rebuild, confirm the check fails on the Escape assertion, restore, confirm it passes. Paste both outputs in your report.
- [ ] **Step 6: Commit** (`Header: Projects menu with AI and Tools; external arrow on CampaignHelp`) and a separate commit for the check script + CLAUDE.md line.

### Task 3: Favicon from the logo mark (worktree `favicon`, preview port 4334)

**Files:**
- Modify: `public/favicon.svg`
- Create: `scripts/build-favicons.py`, `public/apple-touch-icon.png`, `public/favicon-32.png`
- Modify: `src/layouts/BaseLayout.astro` (the `<!-- Favicon -->` block only)

**Interfaces:** Produces `uv run --with pillow python scripts/build-favicons.py` that writes both PNGs and asserts their sizes.

- [ ] **Step 1: Write `scripts/build-favicons.py`** drawing the `LogoMark.astro` shapes (viewBox 32: circle cx 14 cy 16 r 10 `#f1b544`; the leaf path `M17 27c0-7.5 5.5-12.5 13-12.5 0 7.5-5.5 12.5-13 12.5z` `#2f6b3f`, approximated with a polygon sampled from the two cubic curves) at 8× supersampling then downscaled with LANCZOS; apple-touch-icon on `#fbf7ec` with ~14% padding, favicon-32 transparent. Ends with `assert` on both sizes (180×180, 32×32).
- [ ] **Step 2: Run it.** Expected: both files written, no assertion error. View both PNGs (enlarged copy in /tmp) and confirm they look like the header mark.
- [ ] **Step 3: Replace `public/favicon.svg`** with the mark (same viewBox/geometry, literal colors) and add the two `<link>` tags from the spec to `BaseLayout.astro`.
- [ ] **Step 4: Build, preview, verify:** `curl -sI http://localhost:4334/favicon.svg` → 200 + `image/svg+xml`; same for both PNGs with `image/png`; `grep -c 'apple-touch-icon\|favicon-32.png\|favicon.svg' dist/index.html` ≥ 3.
- [ ] **Step 5: Commit** (`Favicon: sun-and-leaf logo mark, with PNG fallbacks`).

---

## After the workers (main session)

1. Read each report and diff; run each check myself against each worktree's preview.
2. Codex adversarial review per branch; fix legitimate findings via the same worker.
3. Design-critique screenshot loop on the homepage + header.
4. Per slice: rebase on `origin/main`, push, PR, wait for the three required checks, squash-merge; pull main between merges.
5. Live: re-run all three checks against `https://jordankrueger.com` (cache-buster on first request), log in the session log, update CLAUDE.md if anything changed.
