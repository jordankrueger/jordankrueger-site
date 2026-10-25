# Solarpunk redesign Implementation Plan

> Execution: one Claude Sonnet 5.5 worker per slice, launched by the main session with `claude-management/tools/herdr/start-worker` per `~/ClaudeCode/.claude/rules/dev-process.md`. Slices run in order; each starts from the `redesign` branch after the previous slice is merged into it. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Re-skin jordankrueger.com in the approved Solarpunk look without changing its content or page structure.

**Architecture:** The site is Astro 7 with design tokens as CSS custom properties in `src/styles/global.css`. Slice 1 swaps the token values and the font; slices 2-4 restyle the header and footer, the homepage, and the remaining pages, adding a few small components (logo mark, circuit divider). Slice 5 is the whole-site check; slice 6 adds the headshots and launches.

**Tech Stack:** Astro 7.1.4, plain CSS, self-hosted woff2 fonts, Node 22 (`.nvmrc`), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-10-25-solarpunk-redesign-design.md` (read it with this plan; its "Design system" section is the source of truth for every color, size and rule).

**Approved mockup:** `/Users/jordankrueger/ClaudeCode/personal/jordankrueger-site-work/looks/index.html`, section `#solar` (served at `http://jordans-mac-mini:3008/personal/jordankrueger-site-work/looks/#solar`). When the plan and the mockup disagree on a visual detail, the mockup wins; when they disagree on a rule (contrast, tokens, no push), the plan wins.

## Global Constraints

- Never push any branch and never open a PR before slice 6. Pushing creates a public Cloudflare Pages preview.
- Never touch `main`, `src/content/posts/`, `public/share/`, `workers/`, `email-templates/` or any copy other than the four heading emoji named in slice 3 and slice 4.
- Worktrees branch from the local `redesign` branch, not `origin/main`: `git -C /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site-work/redesign worktree add -b slice-N /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site-work/slice-N redesign`.
- Keep the existing token names. Only `--font-signature` is retired (slice 2).
- No new literal colors outside `:root` in `src/styles/global.css`. Every color in a component is `var(--color-*)`.
- No emoji as icons, no gradients on text or buttons, no drop shadows on drawings, no colored stripe down the side of a card.
- Decorative SVGs carry `aria-hidden="true"`. Every link and button has a visible `:focus-visible` style.
- `npm run build` must pass before any commit that ends a task. Build from the slice worktree (it is not under `.claude/worktrees/`, so the known tsconfig problem does not apply).
- Each worker runs its own dev server on its own free port: check with `lsof -nP -iTCP:<port> -sTCP:LISTEN`; suggested ports 4331 (slice 1), 4332, 4333, 4334. Start with `npx astro dev --host 0.0.0.0 --port <port>`; note Astro 7's dev server detaches itself (stop it with `npx astro dev stop` from the same folder when done). Port 4322 belongs to the main `redesign` preview; do not use it.
- Screenshots: `~/ClaudeCode/claude-management/tools/chrome-run --timeout 60 --expect-file <png> -- --headless --disable-gpu --screenshot=<png> --window-size=1280,<h> --hide-scrollbars --virtual-time-budget=4000 <url>`; repeat at width 500. Read every screenshot. Never call Chrome directly.

---

## Slice 1: tokens, font, hard-coded colors

### Task 1.1: contrast check script (written first, fails on today's palette)

**Files:**
- Create: `scripts/check-contrast.mjs`

**Interfaces:**
- Produces: `node scripts/check-contrast.mjs` exits 0 when every listed pair meets its threshold, 1 otherwise, printing one line per pair. Later slices run it unchanged.

- [ ] **Step 1: Write the script**

```js
// scripts/check-contrast.mjs
// Reads :root tokens from src/styles/global.css and checks WCAG contrast for
// the text/background pairs the site actually uses. Exit 1 on any failure.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens = Object.fromEntries(
  [...root.matchAll(/--(color-[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]])
);

function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground token, background token, minimum ratio]
// 4.5 = body text; 3 = large text (24px+, or 18.66px+ bold) and UI parts.
const pairs = [
  ['color-text', 'color-bg', 4.5],
  ['color-text', 'color-bg-white', 4.5],
  ['color-text', 'color-bg-green', 4.5],
  ['color-text', 'color-bg-warm', 4.5],
  ['color-text', 'color-bg-blue', 4.5],
  ['color-text', 'color-bg-peach', 4.5],
  ['color-text-light', 'color-bg', 4.5],
  ['color-text-light', 'color-bg-white', 4.5],
  ['color-text-logo', 'color-bg', 4.5],
  ['color-accent', 'color-bg', 4.5],
  ['color-accent', 'color-bg-white', 4.5],
  ['color-accent', 'color-bg-green', 4.5],
  ['color-accent', 'color-bg-warm', 4.5],
  ['color-accent-hover', 'color-bg', 4.5],
  ['color-on-accent', 'color-accent', 4.5],
  ['color-on-accent', 'color-accent-hover', 4.5],
  ['color-sun-text', 'color-bg', 4.5],
  ['color-sun-text', 'color-bg-warm', 4.5],
  ['color-panel', 'color-bg-blue', 4.5],
  ['color-success', 'color-bg', 4.5],
  ['color-error', 'color-bg', 4.5],
  ['color-code-text', 'color-code-bg', 4.5],
];

let failed = 0;
for (const [fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) {
    console.log(`MISSING  ${fg} on ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'ok      ' : 'FAIL    '}${fg} (${tokens[fg]}) on ${bg} (${tokens[bg]}): ${r.toFixed(2)} (needs ${min})`);
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it against today's palette and confirm it fails**

Run: `node scripts/check-contrast.mjs; echo "exit=$?"`
Expected: `exit=1`, with `MISSING` lines for the tokens that do not exist yet (`color-on-accent`, `color-sun-text`, `color-panel`, `color-success`, `color-error`, `color-code-*`) and a `FAIL` line for `color-text-light` on `color-bg` (today `#8A7E74` on `#EDEDED`, about 3.4:1). Paste the output into the slice report.

- [ ] **Step 3: Commit the script**

```bash
git add scripts/check-contrast.mjs
git commit -m "Add token contrast check (fails on current palette)"
```

### Task 1.2: self-host Bricolage Grotesque, remove Lora and DM Sans

**Files:**
- Create: `public/fonts/bricolage-grotesque-latin.woff2`
- Modify: `public/fonts.css` (the stylesheet the site actually loads)
- Modify: `src/layouts/BaseLayout.astro:61-63` (font preloads)
- Delete: `src/styles/fonts.css` (byte-identical copy that nothing imports; confirm with `grep -rn "styles/fonts.css" src` returning nothing before deleting)
- Delete: `public/fonts/dm-sans-*.woff2`, `public/fonts/lora-*.woff2` (after the grep in step 5)

**Interfaces:**
- Produces: font family name `'Bricolage Grotesque'`, weights 400-700 from one variable file.

- [ ] **Step 1: Download the variable font (latin subset)**

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
URL=$(curl -s -A "$UA" 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap' \
  | awk '/\/\* latin \*\//{f=1} f && /src: url/{match($0,/https:[^)]*/); print substr($0,RSTART,RLENGTH); exit}')
echo "$URL"
curl -s -o public/fonts/bricolage-grotesque-latin.woff2 "$URL"
file public/fonts/bricolage-grotesque-latin.woff2
```

Expected: one `https://fonts.gstatic.com/...woff2` URL, then `Web Open Font Format (Version 2)`. Bricolage Grotesque is licensed under the SIL Open Font License, which allows self-hosting.

- [ ] **Step 2: Replace `public/fonts.css` entirely**

Keep the Rock Salt block for now (Header and Footer still use it until slice 2). Copy its existing `@font-face` rule from the current file unchanged, and put this above it:

```css
/* Bricolage Grotesque - headings and body (variable, weights 400-700, latin subset) */
@font-face {
  font-family: 'Bricolage Grotesque';
  src: url('/fonts/bricolage-grotesque-latin.woff2') format('woff2');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Delete every DM Sans and Lora `@font-face` block.

- [ ] **Step 3: Update the preloads in `src/layouts/BaseLayout.astro`**

Replace the two preload lines (61-63 area) with one:

```html
    <!-- Font preload -->
    <link rel="preload" href="/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 4: Delete `src/styles/fonts.css`** after confirming nothing imports it.

- [ ] **Step 5: Delete the old font files** after `grep -rn "dm-sans\|lora-" src public` returns nothing.

Task 1.3 changes the font tokens; commit 1.2 and 1.3 together at the end of 1.3.

### Task 1.3: new token values, base type, buttons, reduced motion

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `'Bricolage Grotesque'` from Task 1.2.
- Produces: every token listed below. Later slices use only these names.

- [ ] **Step 1: Replace the `:root` block** (keep `--max-width`, spacing and radius lines as they are)

```css
:root {
  /* Solarpunk palette (spec: Design system) */
  --color-bg: #fbf7ec;            /* cream page */
  --color-bg-white: #fffdf7;      /* card surface */
  --color-bg-green: #eef3e5;      /* band */
  --color-bg-warm: #fbe7b8;       /* sun-soft */
  --color-bg-blue: #e6eff2;       /* sky-soft */
  --color-bg-peach: #f6e7da;      /* clay-soft */
  --color-border: #dfe7d4;
  --color-text: #4c5d51;          /* soft ink, body */
  --color-text-light: #6f6750;    /* muted small print */
  --color-text-logo: #21342a;     /* ink, headings and wordmark */
  --color-accent: #2f6b3f;        /* leaf */
  --color-accent-hover: #24563a;  /* leaf-dark */
  --color-on-accent: #fbf7ec;     /* text on leaf buttons */
  --color-sprout: #86b46f;        /* drawing fill, divider line */
  --color-sun: #f1b544;           /* drawing, underline, small accents */
  --color-sun-text: #85601a;      /* readable dark gold for dates and labels */
  --color-sun-border: #ecd48f;
  --color-panel: #2f4d5c;         /* solar panel; also dark blue-grey text on sky */
  --color-panel-cell: #46707f;
  --color-sky-border: #bcd3db;
  --color-success: #24563a;
  --color-error: #b3261e;
  --color-code-bg: #1f2d26;
  --color-code-text: #f3efe2;
  --color-shadow: rgba(47, 107, 63, 0.35);

  --font-heading: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-signature: 'Rock Salt', cursive; /* retired in slice 2 */

  --max-width: 1100px;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;

  --radius-sm: 0.5rem;
  --radius-md: 14px;
  --radius-lg: 2rem;
  --radius-pill: 999px;

  --shadow-soft: 0 8px 24px -14px var(--color-shadow);
  --shadow-hover: 0 12px 28px -14px var(--color-shadow);
}
```

`color-shadow` is an rgba and is deliberately not in the contrast pairs.

- [ ] **Step 2: Headings, links and buttons**

Replace the heading rules:

```css
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  color: var(--color-text-logo);
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

h1 { font-size: clamp(2.6rem, 5.5vw, 4.3rem); font-weight: 700; letter-spacing: -0.035em; line-height: 1.03; }
h2 { font-size: 1.85rem; font-weight: 700; letter-spacing: -0.025em; }
h3 { font-size: 1.35rem; font-weight: 700; }
h4 { font-size: 1.1rem; font-weight: 600; }
```

Replace `.btn`, `.btn-primary`, `.btn-primary:hover`, `.btn-outline`, `.btn-outline:hover`:

```css
.btn {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  border: none;
  text-decoration: none;
  white-space: nowrap;
}

.btn:focus-visible,
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  color: var(--color-on-accent);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-accent);
  box-shadow: inset 0 0 0 1.5px var(--color-accent);
}

.btn-outline:hover {
  background-color: var(--color-bg-green);
  color: var(--color-accent-hover);
}
```

In `.skip-nav` and `.skip-nav:focus`, change `color: #fff` to `color: var(--color-on-accent)`.

Change `.section-rule`'s border to `border-top: 2px solid var(--color-sprout);`.

- [ ] **Step 3: Reduced motion** (append after the `.fade-up.delay-4` rule)

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .fade-up,
  .fade-up.visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 4: Mobile heading sizes** — in the `@media (max-width: 640px)` block, delete the `h1 { font-size: 1.75rem; }` line (the `clamp()` handles it) and keep `h2`/`h3`.

- [ ] **Step 5: Run the contrast check**

Run: `node scripts/check-contrast.mjs; echo "exit=$?"`
Expected: every line `ok`, `exit=0`. Paste the output.

- [ ] **Step 6: Prove the check can fail** — temporarily set `--color-text-light: #b9b29c;`, run the script, confirm `exit=1` with a `FAIL` line for `color-text-light`, then restore `#6f6750` and confirm `exit=0` again. Paste both outputs.

- [ ] **Step 7: Build, look, commit**

```bash
npm run build
```

Screenshot `/`, `/about`, `/blog`, `/tools`, `/ai` at 1280 and 500 wide from the slice dev server and read them. Expected: new colors and font everywhere; header and footer logo still in Rock Salt (fixed in slice 2).

```bash
git add -A src/styles/global.css public/fonts.css public/fonts src/layouts/BaseLayout.astro src/styles/fonts.css
git commit -m "Solarpunk tokens and Bricolage Grotesque; drop Lora and DM Sans"
```

### Task 1.4: hard-coded colors to tokens

**Files (line numbers as of 2026-10-25; re-grep before editing):**

| File:line | Today | Becomes |
|---|---|---|
| `src/components/AiProjectCard.astro:72,77` | `#5a8a4e` | `var(--color-accent)` |
| `src/components/AiProjectCard.astro:82` | `#9a7a1c` | `var(--color-sun-text)` |
| `src/components/AiProjectCard.astro:87` | `#5a7a94` | `var(--color-panel)` |
| `src/components/AiStoryCard.astro:14,16` (a JS array of colors) | `'#5a8a4e'`, `'#5a7a94'` | `'var(--color-accent)'`, `'var(--color-panel)'`; check how the array is used and that a `var()` string works there (it does if it is written into a `style` attribute) |
| `src/components/ToolCard.astro:90` | `#fff` | `var(--color-on-accent)` |
| `src/components/ToolCard.astro:95-96` | `#b3d4e8` / `#2c5f7d` | `var(--color-sky-border)` / `var(--color-panel)` |
| `src/components/ToolCard.astro:100-101` | `#b8d4bf` / `#3a5128` | `var(--color-border)` / `var(--color-accent-hover)` |
| `src/components/ToolCard.astro:105-106` | `#e0c690` / `#7a5a1a` | `var(--color-sun-border)` / `var(--color-sun-text)` |
| `src/components/ContactForm.astro:100,104` | `#2d7a3a` / `#c0392b` | `var(--color-success)` / `var(--color-error)` |
| `src/components/NewsletterSignup.astro:143,147` | same | same |
| `src/pages/tools.astro:260,261` | same | same |
| `src/layouts/BlogPost.astro:194-195` | `#2d2d2d` / `#f8f8f2` | `var(--color-code-bg)` / `var(--color-code-text)` |
| `src/pages/blog/index.astro:87` | `#fff` | `var(--color-on-accent)` |
| `src/pages/index.astro:115` | `--color-gah-accent: #a4691f` | `--color-gah-accent: var(--color-sun-text)` |
| `src/pages/about.astro:263` | `rgba(217,178,169,0.25)` shadow | `var(--shadow-soft)` |
| `src/components/Hero.astro:70` | `rgba(217,178,169,0.3)` shadow | `none` (slice 3 rebuilds the hero image) |
| `src/components/Hero.astro:27` | warm gradient | `background: var(--color-bg);` |

- [ ] **Step 1: Make the edits.**
- [ ] **Step 2: Confirm no literal colors remain outside `:root`**

Run: `grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src --include=*.astro`
Expected: no output. (`global.css` keeps its literals inside `:root` only: check with `grep -nE '#[0-9a-fA-F]{6}|rgba?\(' src/styles/global.css` and confirm every hit is inside `:root` or the existing `body::after` noise SVG data URL.)

- [ ] **Step 3: Contrast check and build** — `node scripts/check-contrast.mjs && npm run build`.
- [ ] **Step 4: Screenshot `/tools` and `/ai`** (the two pages with the most color-coded tags) at both widths and read them.
- [ ] **Step 5: Update the repo `CLAUDE.md`** "Design System" section and the `public/fonts/` line under "Key Directories" to the new palette, font, and `scripts/check-contrast.mjs`.
- [ ] **Step 6: Commit** — `git commit -am "Route hard-coded colors through tokens; document new design system"` (add `scripts/` if needed).

---

## Slice 2: header and footer

### Task 2.1: logo mark component

**Files:**
- Create: `src/components/LogoMark.astro`

**Interfaces:**
- Produces: `<LogoMark size="1.7rem" />` renders the sun-and-leaf SVG, `aria-hidden="true"`, sized by the `size` prop (default `1.7rem`).

- [ ] **Step 1: Write the component**

```astro
---
interface Props { size?: string }
const { size = '1.7rem' } = Astro.props;
---
<svg class="logo-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
  <circle cx="14" cy="16" r="10" fill="var(--color-sun)" />
  <path d="M17 27c0-7.5 5.5-12.5 13-12.5 0 7.5-5.5 12.5-13 12.5z" fill="var(--color-accent)" />
</svg>
<style>
  .logo-mark { flex: none; display: block; }
</style>
```

### Task 2.2: header

**Files:**
- Modify: `src/components/Header.astro`

**Interfaces:**
- Consumes: `LogoMark` from Task 2.1. Keeps the existing `navLinks` array, the mobile menu button, overlay and script unchanged in behavior.

- [ ] **Step 1: Markup** — import `LogoMark`; change the logo link to:

```astro
<a href="/" class="logo"><LogoMark /><span>Jordan Krueger</span></a>
```

Change the desktop Subscribe link's classes from `btn btn-primary subscribe-btn desktop-only` to `subscribe-pill desktop-only`.

- [ ] **Step 2: Styles** — replace the `.site-header`, `.logo`, `.logo:hover`, `.nav-link*`, `.subscribe-btn` rules with:

```css
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1.3rem;
    letter-spacing: -0.01em;
    color: var(--color-text-logo);
    text-decoration: none;
    white-space: nowrap;
  }

  .logo:hover { color: var(--color-accent); }

  .nav-link {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    text-decoration: none;
    padding: 0.25rem 0;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .nav-link:hover,
  .nav-link.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-sun);
  }

  .subscribe-pill {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-accent);
    background: var(--color-bg-warm);
    padding: 0.45rem 1rem;
    border-radius: var(--radius-pill);
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .subscribe-pill:hover {
    background: var(--color-sun);
    color: var(--color-text-logo);
  }
```

Change `.mobile-nav-overlay`'s background to `var(--color-bg)`. Leave the hamburger rules, but set its bar color (the `background` on `.hamburger` and its pseudo-elements) to `var(--color-text-logo)`.

- [ ] **Step 3: Check the phone menu** — at 500 wide, screenshot, then confirm by reading the markup that the button still toggles `aria-expanded` (the script is unchanged). Tab from the top of the page: skip link, logo, each nav link, Subscribe; each shows the focus ring.

### Task 2.3: footer as a single band

**Files:**
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: `LogoMark`. Keeps every existing link and the photo credit.

- [ ] **Step 1: Markup** — replace the `footer-grid` with:

```astro
<footer class="site-footer">
  <div class="container footer-band">
    <div class="footer-brand">
      <p class="footer-logo"><LogoMark size="1.4rem" /><span>Jordan Krueger</span></p>
      <SocialIcons />
    </div>
    <nav class="footer-links" aria-label="Footer">
      <ul>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/projects">Projects</a></li>
        <li><a href="/ai">AI Projects</a></li>
        <li><a href="/about">About me</a></li>
        <li><a href="/#contact">Contact</a></li>
        <li><a href="/#subscribe">Newsletter</a></li>
        <li><a href="/blog?tag=claude-code">Building in Public</a></li>
      </ul>
      <ul>
        <li><a href="https://progressivesforai.com/" target="_blank" rel="noopener">Progressives for AI</a></li>
        <li><a href="https://aiprogresstracker.com/" target="_blank" rel="noopener">AI Progress Tracker</a></li>
        <li><a href="https://usermanuals.guide/" target="_blank" rel="noopener">User Manuals</a></li>
        <li><a href="https://www.starbase118.net" target="_blank" rel="noopener">StarBase 118</a></li>
      </ul>
    </nav>
  </div>
  <div class="container footer-bottom">
    <p>&copy; Jordan Krueger {year}. All rights reserved. <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/accessibility">Accessibility</a></p>
    <p class="photo-credit">Computer & cell photo by <a href="https://unsplash.com/@omar_d" target="_blank" rel="noopener">Omar D</a> on <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>.</p>
  </div>
</footer>
```

Before deleting it, confirm the old footer's links one by one against this markup: every `href` in the old file must appear in the new one (`grep -o 'href="[^"]*"'` on both versions, sorted, then `diff`; expected: no difference).

- [ ] **Step 2: Styles** — replace the whole `<style>` block:

```css
  .site-footer {
    background-color: var(--color-bg-green);
    border-top: 2px solid var(--color-sprout);
    padding: var(--spacing-xl) 0 var(--spacing-md);
    margin-top: var(--spacing-xl);
  }
  .footer-band {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }
  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--color-text-logo);
    margin-bottom: var(--spacing-sm);
  }
  .footer-links { display: flex; flex-direction: column; gap: 0.6rem; }
  .footer-links ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem 1.25rem; justify-content: flex-end; }
  .footer-links a { font-size: 0.92rem; font-weight: 600; color: var(--color-text); text-decoration: none; }
  .footer-links a:hover { color: var(--color-accent); text-decoration: underline; text-decoration-color: var(--color-sun); }
  .footer-bottom {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border);
    font-size: 0.8rem;
    color: var(--color-text-light);
  }
  .footer-bottom p { margin-bottom: 0.25rem; }
  .footer-bottom a { color: var(--color-text-light); }
  @media (max-width: 640px) {
    .footer-links ul { justify-content: flex-start; }
  }
```

### Task 2.4: retire Rock Salt

- [ ] **Step 1:** Delete `--font-signature` from `global.css`, the Rock Salt block from `public/fonts.css`, and `public/fonts/rocksalt-400.woff2`.
- [ ] **Step 2:** Run `grep -rn "Rock Salt\|font-signature\|rocksalt" src public`. Expected: no output.
- [ ] **Step 3:** `node scripts/check-contrast.mjs && npm run build`; screenshot `/` and `/about` at both widths, plus the phone menu open (click is not available headless; instead confirm the overlay renders by temporarily adding `aria-hidden="false"` in a scratch copy, or verify in the main session). Read the screenshots.
- [ ] **Step 4: Commit** — `git add -A src public && git commit -m "Sun-and-leaf logo, header pill, single-band footer; retire Rock Salt"`.

---

## Slice 3: homepage

### Task 3.1: circuit divider component

**Files:**
- Create: `src/components/CircuitDivider.astro`

**Interfaces:**
- Produces: `<CircuitDivider />`, a full-width decorative SVG (`class="circuit-divider"`, `aria-hidden="true"`), 40px tall. The class name `circuit-divider` is also the launch check's "new in this build" marker; do not rename it.

- [ ] **Step 1: Write it**

```astro
<svg class="circuit-divider" viewBox="0 0 1200 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="M0 30 H560 L572 18 H628 L640 30 H1200" fill="none" stroke="var(--color-sprout)" stroke-width="2" />
  <circle cx="572" cy="18" r="3.5" fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="2" />
  <path d="M628 18 c0-9 6-14 15-14 0 9-6 14-15 14z" fill="var(--color-sprout)" />
</svg>
<style>
  .circuit-divider { display: block; width: 100%; height: 40px; }
</style>
```

### Task 3.2: hero

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Heading copy** — change `Hiya & welcome! 👋` to `Hiya &amp; <span class="hl">welcome!</span>` (emoji removed by Jordan's decision; the words stay).

- [ ] **Step 2: Photo with the drawing** — replace the `hero-image` div's contents:

```astro
<div class="hero-image fade-up delay-2">
  <div class="hero-photo">
    <svg class="hero-art" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
      <circle cx="104" cy="22" r="20" fill="var(--color-sun)" />
      <g transform="translate(4 86) rotate(-12)">
        <rect x="0" y="0" width="38" height="24" rx="3" fill="var(--color-panel)" />
        <g fill="var(--color-panel-cell)">
          <rect x="3" y="3" width="10" height="8" rx="1" /><rect x="14" y="3" width="10" height="8" rx="1" /><rect x="25" y="3" width="10" height="8" rx="1" />
          <rect x="3" y="13" width="10" height="8" rx="1" /><rect x="14" y="13" width="10" height="8" rx="1" /><rect x="25" y="13" width="10" height="8" rx="1" />
        </g>
      </g>
      <path class="line" d="M30 116 H70 V122 H112 V100" fill="none" stroke="var(--color-accent)" stroke-linecap="round" stroke-linejoin="round" />
      <circle class="line" cx="70" cy="116" r="1.8" fill="var(--color-bg)" stroke="var(--color-accent)" />
      <circle class="line" cx="112" cy="122" r="1.8" fill="var(--color-bg)" stroke="var(--color-accent)" />
      <path d="M112 100 c0-9 6-14 15-14 0 9-6 14-15 14z" fill="var(--color-sprout)" />
      <path class="line" d="M112 100 c4-4 8-8 12-11" fill="none" stroke="var(--color-accent)" stroke-linecap="round" />
    </svg>
    <img src="/images/headshot-hero.jpg" alt="Jordan Krueger" width="1200" height="1200" />
  </div>
</div>
```

- [ ] **Step 3: Styles** — replace `.hero`, `.hero-greeting`, `.hero-sub`, `.hero-image img` and the mobile `.hero-image img` rule; add the photo rules:

```css
  .hero { background: var(--color-bg); padding: var(--spacing-xl) 0 var(--spacing-2xl); }
  .hero-greeting { margin-bottom: var(--spacing-sm); }
  .hero-greeting .hl { color: var(--color-accent); }
  .hero-intro { font-size: 1.2rem; font-weight: 600; color: var(--color-text-logo); }
  .hero-sub { font-size: 1.05rem; color: var(--color-text); max-width: 32rem; }
  .hero-photo { position: relative; isolation: isolate; width: 100%; max-width: 440px; aspect-ratio: 1; margin-left: auto; }
  .hero-photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .hero-art { position: absolute; inset: -12% -12% -14% -16%; z-index: -1; overflow: visible; }
  .hero-art .line { vector-effect: non-scaling-stroke; stroke-width: 2.5px; }
  @media (max-width: 640px) {
    .hero-photo { max-width: 16rem; margin: 0 auto var(--spacing-md); }
  }
```

(Remove the old `.hero-greeting` font-size rules; `h1` sizing now comes from `global.css`.) Make the second hero button an outline if it is not already: `Learn more` stays `btn-primary`, `Hire me` stays `btn-outline`.

### Task 3.3: homepage sections

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/BlogPostCard.astro` only if the vine needs a class hook (prefer styling from `index.astro` with `:global()`)

- [ ] **Step 1: Heading copy** — change `About me 🤔` to `About me`.
- [ ] **Step 2: Dividers** — import `CircuitDivider` and place one after `<Hero />`/`<NewsletterSignup />` boundary and one before the "My recent blog posts" section. Exactly two on the homepage.
- [ ] **Step 3: Practices** — restyle `.ak-panel` / `.practice-diptych` to the mockup: the section sits on `var(--color-bg-green)` full width; each practice half becomes its own card (`background: var(--color-bg-white)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-md)`, padding `1.6rem 1.75rem 1.75rem`); kicker text in `var(--color-accent)` 0.85rem 600; service pills `background: var(--color-bg-green)`, `color: var(--color-accent-hover)`; the diptych divider line is removed. The "Grounded AI" kicker uses `var(--color-gah-accent)` (already `--color-sun-text` from slice 1).
- [ ] **Step 4: About panel** — `background: var(--color-bg-white)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-md)`.
- [ ] **Step 5: Blog vine** — on the posts grid: a 2px `var(--color-sprout)` line at 60% opacity running across the top of the row, and above each card a 0.8rem circle (`background: var(--color-bg)`, `border: 2.5px solid var(--color-accent)`) sitting on the line, as in the mockup. Hidden below 640px.
- [ ] **Step 6: Newsletter band** (`NewsletterSignup.astro`) — change its background from `var(--color-bg-warm)` to `var(--color-bg-white)` with a 1px `var(--color-border)` line above and below (review of slice 1, 2026-10-25: large `--color-bg-warm` fills read far louder than the mockup; yellow stays a small accent on the homepage); restyle its input to `border: 1.5px solid var(--color-border)`, `border-radius: var(--radius-pill)`, and its button to `.btn-primary`. Do not touch the Turnstile widget markup, `data-action`, form `action`, field names or the script.
- [ ] **Step 7: Contact form** — same input and button treatment; same "do not touch" list.
- [ ] **Step 8: Checks** — `node scripts/check-contrast.mjs && npm run build`; screenshot `/` at 1280×4000 and 500×7000 and read every part of both. Compare against the mockup's `#solar` section. Tab through the whole homepage once.
- [ ] **Step 9: Commit** — `git add -A src && git commit -m "Solarpunk homepage: hero drawing, circuit dividers, practice cards, blog vine"`.

---

## Slice 4: remaining pages

Each task: read the page, apply the design system, screenshot at both widths, read the screenshots, fix what looks off against the mockup, commit per page. The design system section of the spec is the reference; do not add new colors.

### Task 4.1: About

**Files:** `src/pages/about.astro`, `src/components/StatsStack.astro`, `src/components/Expandable.astro`

- [ ] Change `🔧 What I Do (and Why I Do It)` to `What I Do (and Why I Do It)` and `🧠 What I'm Known For` to `What I'm Known For`. Leave the headline's emoji list (`🖖 Star Trek`, `😎 synthwave`, `🤖 technology`) as is.
- [ ] Round the headshot like the hero (`border-radius: 50%`, `object-fit: cover`), no drawing on this page.
- [ ] Add the Star Trek nod: directly under the headline's emoji list, a decorative strip `aria-hidden="true"`, 8px tall, made of four segments in a row with 5px gaps: `7rem` of `var(--color-sun)` (left end rounded 8px), a flexible segment of `var(--color-bg-green)`, `3rem` of `var(--color-sprout)`, `1.5rem` of `var(--color-accent)` (right end rounded 8px). Max width 24rem. This is the round 3 "Bridge" console bar in the Solarpunk palette; it carries no text.
- [ ] Stats and expandable panels: surface `var(--color-bg-white)` or `var(--color-bg-warm)` with the 1px border and `--radius-md`.

### Task 4.2: AI page

**Files:** `src/pages/ai.astro`, `src/components/AiProjectCard.astro`, `src/components/AiStoryCard.astro`

- [ ] Cards: surface, 1px border, `--radius-md`, no shadow or `--shadow-soft` only on hover. Status tags pill-shaped. Stats row: numbers in `var(--color-accent)` 700.
- [ ] Place one `CircuitDivider` between the page's major sections (no more than two on the page).

### Task 4.3: Projects

**Files:** `src/pages/projects.astro`, `src/components/ProjectCard.astro`

- [ ] Full-width project panels: surface or band background, 1px border, `--radius-md`; action buttons use `.btn-primary` for the main link and `.btn-outline` for secondary links (one filled button per card).

### Task 4.4: Tools

**Files:** `src/pages/tools.astro`, `src/components/ToolCard.astro`, `src/components/ToolCategory.astro`

- [ ] Category sections keep their `bg-*` classes (the content schema depends on them); the new token values already re-color them. Check every category's text against its background visually; the contrast script covers the token pairs.
- [ ] The AK Template signup form: input and button treatment from Task 3.3 step 6; same "do not touch" list (Turnstile, `data-action`, `action`, field names, script).

### Task 4.5: Blog list and blog post layout

**Files:** `src/pages/blog/index.astro`, `src/layouts/BlogPost.astro`, `src/components/BlogPostCard.astro`

- [ ] Blog cards: surface, 1px border, `--radius-md`, date in `var(--color-sun-text)` 600, title in `var(--color-text-logo)`, hover turns the title `var(--color-accent)`.
- [ ] Tag filter buttons: pills; active state `background: var(--color-accent); color: var(--color-on-accent)`.
- [ ] Post layout: body text max width 68ch; headings Bricolage; links leaf with a `--color-sun-text` underline (plain `--color-sun` is only 1.72:1 on cream; Codex, slice 4 review); blockquote with a 3px `var(--color-sprout)` left rule (quotes are not cards, so this is allowed); code blocks use the code tokens. Check one long post (e.g. `/blog/ai-bodyguard/`) and one with images.

### Task 4.6: Privacy, Terms, Accessibility, 404

- [ ] Inherit the system; confirm each renders cleanly at both widths. On the 404 page, a `CircuitDivider` above the message is enough decoration.

### Task 4.7: slice checks and commit

- [ ] `node scripts/check-contrast.mjs && npm run build`.
- [ ] `grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src --include=*.astro` returns nothing.
- [ ] Screenshot every page in this slice at both widths; read each.
- [ ] Commit per page as you go (`git commit -m "Solarpunk: <page>"`).

---

## Slice 5: whole-site check (main session, not a worker)

- [ ] Merge slices 1-4 into `redesign` in order (fast-forward), restart the `:4322` preview from the `redesign` worktree.
- [ ] Run the Hallmark slop test (`claude-management/reference/design/hallmark/slop-test.md`) and `anti-patterns.md` against every page; list the tells found and removed.
- [ ] Run the `design-critique` skill on `http://jordans-mac-mini:4322/` and the five main pages (up to 3 rounds each).
- [ ] Keyboard pass on every page, including the phone menu.
- [ ] Codex adversarial review of the full `git diff origin/main...redesign` per dev-process.md; fix what is legitimate.
- [ ] `node scripts/check-contrast.mjs && npm run build`.
- [ ] Hand Jordan the `:4322` URL for his own look.

## Slice 6: headshots and launch (main session, with Jordan)

- [ ] Drop Jordan's photos in as `public/images/headshot-hero.jpg` and `public/images/headshot-about.jpg`: square crop, under 500KB (`claude-management/tools/img-preview` before reading them; compress with `clop` or `sips`). Screenshot `/` and `/about`. Delete `public/images/hero-jordan.png` and `jordan-portrait.jpg` if `grep -rn` finds no other use.
- [ ] Jordan says "ship it". Not before.
- [ ] `git fetch origin && git rebase origin/main` in the `redesign` worktree. On conflict: keep `main`'s content changes (new posts, CLAUDE.md notes) and the branch's styling. Re-run the build and the contrast script.
- [ ] Push with the `jordankrueger` account (per-command `GH_TOKEN`, never `gh auth switch`), open the PR, `gh pr checks <n> --watch`. Never merge while a required check is failing or pending; a check stuck over 30 minutes is re-run once, then reported.
- [ ] Merge with `gh pr merge --squash`.
- [ ] Poll `GET /accounts/{account_id}/pages/projects/{project_name}/deployments` (personal Cloudflare token) until the merge commit is a successful production deployment; 15 minutes with none counts as stalled. Confirm the response field names against a real response first.
- [ ] Live checks: cache-busted `curl` of `https://jordankrueger.com/` contains `circuit-divider`; `curl` of `/fonts/bricolage-grotesque-latin.woff2` and both headshot URLs return 200; submit the newsletter and contact forms with Jordan's own address and confirm the Listmonk row and the contact email arrive; spot-check `/about`, `/blog`, one post.
- [ ] On any failure: fix forward with a new PR, or roll back to the previous production deployment in Cloudflare Pages.
- [ ] Session log entry; Notion project page update offer; `git worktree remove` the slice worktrees and delete merged slice branches.

## How it is proven to work

- Each slice: `node scripts/check-contrast.mjs` (exit 0; shown able to fail in Task 1.3 step 6), `npm run build` (exit 0), the color grep (no output), and read screenshots at 1280 and 500 wide of every touched page.
- Whole site: slice 5's slop test, design-critique loop, keyboard pass and Codex review.
- Live: slice 6's deployment poll, marker and font `curl`s, and real form submissions to Jordan's address.
