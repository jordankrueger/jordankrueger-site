# jordankrueger.com Solarpunk redesign: design

Date: 2026-10-25. Branch: local `redesign` (worktree `personal/jordankrueger-site-work/redesign`). Status: design approved in conversation; this spec writes it down.

## Verdict

Re-skin jordankrueger.com in the "Solarpunk" look Jordan picked on 2026-10-25 (round 3 mockup: `personal/jordankrueger-site-work/looks/index.html`, served at `http://jordans-mac-mini:3008/personal/jordankrueger-site-work/looks/#solar`). Content and page structure stay; only the visual layer changes. The site already keeps colors, fonts, radii and shadows as CSS custom properties in `src/styles/global.css`, so the bulk of the change is a token swap there plus a font swap, followed by a small number of new decorative pieces (logo, hero illustration, circuit divider, blog "vine"). All work stays on the local `redesign` branch and the Tailscale-only dev server (`:4322`). Nothing is pushed until launch, because pushing any branch creates a public Cloudflare Pages preview. Launch waits for Jordan's new headshots and his explicit "ship it".

## Scope

In scope:

- Every page under `src/pages/` (index, about, ai, projects, tools, blog index, blog post layout, privacy, terms, accessibility, 404) and every component under `src/components/`.
- Design tokens, fonts, logo, header, footer, hero, section dividers, cards, blog lists, forms (restyle only).
- Removing emoji from `h1`/`h2` headings (see Decisions).
- A `prefers-reduced-motion` fallback for the existing `.fade-up` animation, which has none today.

Out of scope:

- Any copy change other than heading emoji. SEO research is skipped for the same reason: no new pages and no new copy.
- Dark mode (the site has none today).
- The Mission Control email template, Workers, share pages under `public/share/`, and RSS output.
- Blog post bodies (MDX content) beyond what the shared `BlogPost.astro` layout styles.

## Design system (the source of truth for every slice)

Colors (replace the current `--color-*` values; keep the variable names where a direct mapping exists so components keep working):

| Token | Value | Use |
|---|---|---|
| cream (page background) | `#fbf7ec` | `--color-bg` |
| surface (cards) | `#fffdf7` | `--color-bg-white` |
| band (alternate section) | `#eef3e5` | `--color-bg-green`, replaces warm/peach/blue section fills |
| sun-soft | `#fbe7b8` | Subscribe pill, soft highlights; replaces `--color-bg-warm` |
| ink | `#21342a` | headings, `--color-text-logo` |
| soft ink | `#4c5d51` | body text, `--color-text` |
| muted | `#6f6750` | small print, `--color-text-light` (checked for 4.5:1 on cream) |
| leaf (accent) | `#2f6b3f` | `--color-accent`, primary buttons, links |
| leaf-dark | `#24563a` | `--color-accent-hover` |
| sprout | `#86b46f` | illustration fills, divider line |
| sun | `#f1b544` | illustration, link underline, small accents only |
| panel / panel-cell | `#2f4d5c` / `#46707f` | the solar panel drawing only |
| border | `#dfe7d4` | card borders, `--color-border` |

`--color-bg-blue` and `--color-bg-peach` are retired: every use is mapped to `band` or `cream`. Shadows become a single soft green-tinted shadow (`0 8px 24px -14px rgba(47,107,63,.35)`) or none; the current offset peach `--shadow-soft` goes.

Type: Bricolage Grotesque for headings and body (weights 400, 600, 700), self-hosted as woff2 in `public/fonts/` with `@font-face` in `src/styles/fonts.css`, matching the current self-hosting pattern. Lora, DM Sans and Rock Salt are removed from `fonts.css` and their files deleted from `public/fonts/` once nothing references them. Headline scale: `h1` `clamp(2.6rem, 5.5vw, 4.3rem)` weight 700, letter-spacing `-0.035em`; `h2` 1.85rem weight 700.

Shape: cards 14px radius with a 1px border; buttons and tags fully rounded (pill); one filled primary button per group, the second is an outline.

Illustration language: flat fills, one line color (leaf), one line weight (2.5px, kept constant at any size with `vector-effect: non-scaling-stroke`), no drop shadows, no gradients. Every decorative SVG carries `aria-hidden="true"`.

## Steps (each names what it reuses before what it adds)

### Step 1: tokens and fonts

- Reuses: the existing token names in `src/styles/global.css`; the self-hosted `@font-face` pattern in `src/styles/fonts.css`.
- Adds: new token values; Bricolage Grotesque woff2 files; a `prefers-reduced-motion` block for `.fade-up`.
- Then fixes the hard-coded colors that bypass tokens (counted 2026-10-25: ToolCard 7, AiProjectCard 4, tools.astro 2, BlogPost.astro 2, NewsletterSignup 2, ContactForm 2, AiStoryCard 2, index.astro 1, blog/index.astro 1, about.astro 1, Hero 1), each mapped to a token rather than a new literal.
- Done when: `npm run build` passes, no file references `Lora`, `DM Sans`, `Rock Salt` or the retired tokens, and every page renders with the new palette.

### Step 2: header and footer

- Reuses: `Header.astro` (including its existing mobile menu button and `aria-expanded` toggle) and `Footer.astro` structure.
- Adds: the sun-and-leaf SVG mark next to a Bricolage wordmark, replacing the Rock Salt signature in both places; the Subscribe link as a soft sun pill; hover and `:focus-visible` states. The footer stays a single band, not a four-column link grid.

### Step 3: homepage

- Reuses: `Hero.astro`, `NewsletterSignup.astro`, `BlogPostCard.astro`, `ContactForm.astro`, the practices diptych markup in `index.astro`.
- Adds: the hero illustration (sun, solar panel, circuit-vine ending in a leaf) as one inline SVG behind the round headshot; a reusable `CircuitDivider.astro` (circuit line with a node and a sprouting leaf) between sections; the blog-post "vine" (a line with a node above each post) for the recent-posts row; practice cards per the design system.

### Step 4: remaining pages

- Reuses: `ProjectCard`, `AiProjectCard`, `AiStoryCard`, `ToolCard`, `ToolCategory`, `StatsStack`, `Expandable`, `PodcastEmbed`, `BlogPost.astro`.
- Adds: per-page polish only where tokens alone leave something off; `CircuitDivider` where pages have section breaks; on About, one thin console strip (the round 3 Bridge "console bar", in the Solarpunk palette) as a quiet nod to Star Trek next to the existing Star Trek copy.

### Step 5: checks (run per slice, and once across the whole site before launch)

- Hallmark slop test (`claude-management/reference/design/hallmark/slop-test.md`) and anti-patterns, with the tells found and removed reported in the handover.
- `design-critique` screenshot loop on every page at 1280px and 500px wide.
- A contrast check: a small script that computes WCAG contrast for every text/background token pair used, asserting 4.5:1 for body text and 3:1 for large text and UI. Proven able to fail by temporarily setting `--color-text-light` to a light value and confirming it goes red.
- `npm run build` passes.

### Step 6: headshots and launch

- Reuses: the placeholder file names already wired in (`public/images/headshot-hero.jpg`, `public/images/headshot-about.jpg`).
- Adds: Jordan's photos at those names, square, compressed under 500KB.
- Then, only on Jordan's "ship it": rebase `redesign` onto `origin/main` (pick up any posts published meanwhile), push, open a PR (required checks: OpenAI Logic Review, Anthropic Security Review, Cloudflare Pages preview), merge, and run the live checks below.

## Reliability

(a) Project family: personal (`jordankrueger` GitHub account, `PERSONAL_` Cloudflare token). The site is static and has no error sink of its own; the two Workers (newsletter signup, contact form) are unchanged by this work. Feedback channel: Jordan directly.

(b) Steps that can fail:

| Step | Fails loudly? | Report goes somewhere safe? | Can it recover? | Would we notice if it went quiet? |
|---|---|---|---|---|
| Cloudflare Pages build on merge | Yes, the PR's required preview check goes red | GitHub PR checks | Fix and re-push; nothing deploys on a failed build | Yes, the PR cannot merge without the check |
| Self-hosted font files | No: a missing woff2 404s and the browser silently falls back to a system font | Not by itself | Re-add the file | Only if checked: the launch check curls every `/fonts/*.woff2` URL referenced in `fonts.css` on the live site and expects 200 |
| Newsletter and contact forms after restyle | Turnstile failure shows an error to the visitor; a CSS change that hides the widget does not | Not by itself | Revert the CSS | Only if checked: per `.claude/rules/deploy-verification.md`, submit both forms on the live site with Jordan's address and confirm the Listmonk row and the Resend email arrive |
| Hero illustration and decorative SVGs | No, a broken SVG just disappears | n/a (decorative) | Revert | Screenshot check of the live homepage |

(c) Day-1 decisions:

- Backup and rollback: `main` is untouched until the merge. Rollback after launch is a revert PR, or promoting the previous deployment in Cloudflare Pages. The pre-redesign site stays reproducible from the commit before the merge.
- Who can see what: the dev server is Tailscale-only. No branch is pushed before launch, so no public preview URL exists with placeholder headshots on it.
- Vendor docs: Astro 7 `@font-face` handling via plain CSS is unchanged from today's setup; check current Astro docs before step 1 in case Astro 7's fonts API is the better path, and record the choice.

## Decisions

- **Token swap first, components second.** The site is already token-driven, so changing values re-skins most of it at once; component edits are limited to hard-coded colors and the new decorative pieces.
- **Keep existing token names where they map cleanly.** Renaming every variable would touch every file for no visual gain. Retired names (`--color-bg-blue`, `--color-bg-peach`, `--font-signature`) are removed, not aliased, so a leftover use fails visibly in review.
- **One font family.** Bricolage Grotesque for headings and body. Fewer files to self-host, and the mockup Jordan approved uses one family.
- **No push until launch.** A pushed branch gets a public Cloudflare Pages preview showing placeholder headshots, which breaks the "never ship internal status onto a live surface" rule.
- **No dark mode.** The site has none today; adding it doubles the contrast and illustration work.
- **Heading emoji removed, body emoji kept** (default, pending Jordan's answer below): `Hiya & welcome! 👋` (h1, Hero), `About me 🤔` (h2, index), `🔧 What I Do (and Why I Do It)` and `🧠 What I'm Known For` (h2, about). The emoji list in the About page headline (`🖖 Star Trek`, `😎 synthwave`, `🤖 technology`) is content, not decoration, and stays.

## How it is verified

- Per slice: `npm run build`; screenshots of every touched page at 1280px and 500px read by Claude; slop-test pass; contrast script passes.
- Before launch: the whole-site pass in step 5.
- After merge, per `.claude/rules/deploy-verification.md`: Cloudflare Pages deployment succeeded; `curl` the live homepage with a cache-buster and confirm a marker new in this build (the `CircuitDivider` SVG's class name) is present; every font URL returns 200; both forms submitted live with Jordan's address and their downstream effects confirmed; spot-check About, Blog and one post.

## Open questions

1. **Heading emoji.** What's decided: whether to remove emoji from the four `h1`/`h2` headings listed above. Either way: removing them makes the headings match the drawn illustration style and drops a common AI-design tell; keeping them keeps the old playful tone in text. Recommendation: remove them, keep emoji in body copy. Reversing it later is a one-line edit per heading.
