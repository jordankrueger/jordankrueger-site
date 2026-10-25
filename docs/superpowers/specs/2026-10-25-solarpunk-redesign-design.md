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
| band (alternate section) | `#eef3e5` | `--color-bg-green` |
| sun-soft | `#fbe7b8` | `--color-bg-warm`: Subscribe pill, newsletter band, stat and card highlights |
| sky-soft | `#e6eff2` | `--color-bg-blue` (a light tint of the panel color) |
| clay-soft | `#f6e7da` | `--color-bg-peach` |
| ink | `#21342a` | headings, `--color-text-logo` |
| soft ink | `#4c5d51` | body text, `--color-text` |
| muted | `#6f6750` | small print, `--color-text-light` (checked for 4.5:1 on cream) |
| leaf (accent) | `#2f6b3f` | `--color-accent`, primary buttons, links |
| leaf-dark | `#24563a` | `--color-accent-hover` |
| sprout | `#86b46f` | illustration fills, divider line |
| sun | `#f1b544` | illustration, link underline, small accents only |
| panel / panel-cell | `#2f4d5c` / `#46707f` | the solar panel drawing only |
| border | `#dfe7d4` | card borders, `--color-border` |

All four section-fill tokens (`--color-bg-warm`, `-green`, `-blue`, `-peach`) keep their names and get new values, because the Tools page content schema depends on them: `src/content.config.ts` restricts each tool category's `color` to `bg-warm | bg-blue | bg-peach | bg-green`, and the YAML files in `src/content/tools/` set it. Renaming them would mean a schema change and a content edit for no visual gain. The Hero's warm gradient (`Hero.astro`) is replaced by the flat cream background plus the illustration. Shadows become a single soft green-tinted shadow (`0 8px 24px -14px rgba(47,107,63,.35)`) or none; the current offset peach `--shadow-soft` goes.

Type: Bricolage Grotesque for headings and body (weights 400, 600, 700), self-hosted as woff2 in `public/fonts/`. **Where fonts actually load:** `BaseLayout.astro` links the served stylesheet `/fonts.css`, which is `public/fonts.css`, and preloads `/fonts/dm-sans-400.woff2` and `/fonts/lora-700.woff2` (lines 61-66). `src/styles/fonts.css` is a byte-identical copy that nothing imports. So the font swap edits `public/fonts.css` and the two preload tags (to Bricolage 400 and 700), and deletes the unused `src/styles/fonts.css`. Lora, DM Sans and Rock Salt files are deleted from `public/fonts/` once a grep finds no reference. Headline scale: `h1` `clamp(2.6rem, 5.5vw, 4.3rem)` weight 700, letter-spacing `-0.035em`; `h2` 1.85rem weight 700.

Shape: cards 14px radius with a 1px border; buttons and tags fully rounded (pill); one filled primary button per group, the second is an outline.

Illustration language: flat fills, one line color (leaf), one line weight (2.5px, kept constant at any size with `vector-effect: non-scaling-stroke`), no drop shadows, no gradients. Every decorative SVG carries `aria-hidden="true"`.

## Steps (each names what it reuses before what it adds)

### Step 1: tokens and fonts

- Reuses: the existing token names in `src/styles/global.css`; the self-hosted `@font-face` pattern in `public/fonts.css` and the preload tags in `BaseLayout.astro`.
- Adds: new token values; Bricolage Grotesque woff2 files and their `@font-face` rules; updated preloads; a `prefers-reduced-motion` block for `.fade-up`. Deletes the unused `src/styles/fonts.css`.
- Then fixes the hard-coded colors that bypass tokens (counted 2026-10-25: ToolCard 7, AiProjectCard 4, tools.astro 2, BlogPost.astro 2, NewsletterSignup 2, ContactForm 2, AiStoryCard 2, index.astro 1, blog/index.astro 1, about.astro 1, Hero 1), each mapped to a token rather than a new literal.
- Done when: `npm run build` passes, no file references `Lora` or `DM Sans` (the Rock Salt signature in Header and Footer is replaced in step 2), the dev server's network log shows every requested `/fonts/*.woff2` returning 200, and every page renders with the new palette.

### Step 2: header and footer

- Reuses: `Header.astro` (including its existing mobile menu button and `aria-expanded` toggle) and `Footer.astro` structure.
- Adds: the sun-and-leaf SVG mark next to a Bricolage wordmark, replacing the Rock Salt signature in both places; the Subscribe link as a soft sun pill; hover and `:focus-visible` states. The footer stays a single band, not a four-column link grid.
- Done when: no file references `Rock Salt` or `--font-signature`, `rocksalt-400.woff2` is deleted, and the phone menu opens and closes at 500px wide.

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
- A keyboard pass on every page: Tab through the menu (including the phone menu button), links, buttons and both forms; every stop has a visible focus ring.

### Step 6: headshots and launch

- Reuses: the placeholder file names already wired in (`public/images/headshot-hero.jpg`, `public/images/headshot-about.jpg`).
- Adds: Jordan's photos at those names, square, compressed under 500KB.
- Then, only on Jordan's "ship it": rebase `redesign` onto `origin/main` (pick up any posts published meanwhile), push, open a PR (required checks: OpenAI Logic Review, Anthropic Security Review, Cloudflare Pages preview), merge, and run the live checks below.

## Reliability

(a) Project family: personal (`jordankrueger` GitHub account, `PERSONAL_` Cloudflare token). The site is static and has no error sink of its own; the two Workers (newsletter signup, contact form) are unchanged by this work. Feedback channel: Jordan directly.

(b) Steps that can fail:

| Step | Fails loudly? | Report goes somewhere safe? | Can it recover? | Would we notice if it went quiet? |
|---|---|---|---|---|
| Local build, contrast script, screenshot pass (every slice) | Yes: non-zero exit or a failed assertion; screenshots are read, not just taken | In the session and the slice's final report (`STATUS: BLOCKED` with the failing command); no personal data involved | Fix and re-run; nothing leaves the dev branch | Yes: a slice cannot report done without the pasted command output (dev-process rule) |
| Self-hosted font files | No: a missing woff2 404s and the browser silently falls back to a system font | Session report, by URL only | Re-add the file or fix the path | Only because it is checked: on dev, the network log for each page; after launch, `curl` of every `/fonts/*.woff2` referenced in `public/fonts.css` on the live site, expecting 200 |
| Headshot swap | No: a wrong path shows a broken image | Session report | Re-copy the file | Checked by screenshot of Home and About, and a `curl` of both image URLs on the live site |
| Cloudflare Pages production deploy after merge | Partly: a failed build shows in the Cloudflare Pages dashboard and API, but nothing alerts | Session report; the deployment id and status only | Fix forward with a new PR, or roll back to the previous successful production deployment (dashboard: Deployments, actions menu, "Rollback to this deployment"; or `POST .../deployments/{id}/rollback`) | Only because it is checked: after merge, poll the Cloudflare API (`GET /accounts/{account_id}/pages/projects/{project_name}/deployments`, `PERSONAL_` token) until the merge commit shows as a successful production deploy; if it has not appeared within 15 minutes, treat it as stalled and investigate rather than wait |
| Newsletter and contact forms after restyle | Turnstile failure shows an error to the visitor; a CSS change that hides the widget does not | Session report naming the form and the step that failed; never the submitted contents. Test submissions use Jordan's own address only | Revert the CSS change | Only because it is checked: per `.claude/rules/deploy-verification.md`, submit both forms on the live site with Jordan's address and confirm the Listmonk subscriber row and the contact email arrive |
| Hero illustration and decorative SVGs | No, a broken SVG just disappears | Session report | Revert | Screenshot of the live homepage |
| Launch path: rebase onto `origin/main`, push, PR, required checks (OpenAI Logic Review, Anthropic Security Review, Cloudflare Pages preview) | Yes: rebase conflicts stop the rebase; push and `gh` errors exit non-zero; failed checks show red on the PR | Session report with the PR number and the failing check's name only | Rebase conflicts are resolved by hand, keeping `main`'s content changes (new posts) and the branch's styling; a failed check is fixed with a new commit on the branch. **Never merge while any required check is failing or pending**, and never bypass branch protection | Only because it is watched: `gh pr checks <n> --watch` until all required checks finish; if one has not finished within 30 minutes it is treated as stalled, re-run once, and reported to Jordan if it stalls again. Note that pushing the branch creates a public preview URL, so the push happens only after the headshots are in and Jordan has said "ship it" |

(c) Day-1 decisions:

- Backup and rollback: `main` is untouched until the merge. Rollback after launch is a revert PR, or promoting the previous deployment in Cloudflare Pages. The pre-redesign site stays reproducible from the commit before the merge.
- Who can see what: the dev server is Tailscale-only. No branch is pushed before launch, so no public preview URL exists with placeholder headshots on it.
- Vendor docs, checked 2026-10-25: Astro's fonts guide (docs.astro.build/en/guides/fonts/) documents a built-in Fonts API (`fonts` config plus a `<Font />` component, local files under `src/`). Decision: keep the site's existing plain `@font-face` in `public/fonts.css`. It works today, needs no config change, and swapping it in the same change as a redesign adds a second thing that can go wrong. Moving to the Fonts API is a separate, optional later change. Cloudflare Pages docs, checked 2026-10-25: rollback (developers.cloudflare.com/pages/configuration/rollbacks/) switches production immediately, works only to a previous *successful production* deployment (previews are not valid targets), and can roll forward again afterwards; the API reference lists list, get and rollback endpoints for deployments. The exact fields in the list response (environment, stage status, commit hash) are confirmed against a real API response before the post-merge poll is written, not assumed. The two Workers, Turnstile, Listmonk and Resend are unchanged by this work, so their docs are not applicable here; the forms are covered by the live submission check instead.

## Decisions

- **Token swap first, components second.** The site is already token-driven, so changing values re-skins most of it at once; component edits are limited to hard-coded colors and the new decorative pieces.
- **Keep existing token names.** Renaming every variable would touch every file for no visual gain, and the four section-fill names are part of the Tools content schema. Only `--font-signature` is retired; it is removed, not aliased, so a leftover use fails visibly in review.
- **One font family.** Bricolage Grotesque for headings and body. Fewer files to self-host, and the mockup Jordan approved uses one family.
- **No push until launch.** A pushed branch gets a public Cloudflare Pages preview showing placeholder headshots, which breaks the "never ship internal status onto a live surface" rule.
- **No dark mode.** The site has none today; adding it doubles the contrast and illustration work.
- **Heading emoji removed, body emoji kept** (Jordan, 2026-10-25): `Hiya & welcome! 👋` (h1, Hero), `About me 🤔` (h2, index), `🔧 What I Do (and Why I Do It)` and `🧠 What I'm Known For` (h2, about). The emoji list in the About page headline (`🖖 Star Trek`, `😎 synthwave`, `🤖 technology`) is content, not decoration, and stays.

## How it is verified

- Per slice: `npm run build`; screenshots of every touched page at 1280px and 500px read by Claude; slop-test pass; contrast script passes.
- Before launch: the whole-site pass in step 5.
- After merge, per `.claude/rules/deploy-verification.md`: Cloudflare Pages deployment succeeded; `curl` the live homepage with a cache-buster and confirm a marker new in this build (the `CircuitDivider` SVG's class name) is present; every font URL returns 200; both forms submitted live with Jordan's address and their downstream effects confirmed; spot-check About, Blog and one post.

## Open questions

None. The heading-emoji question was answered on 2026-10-25 (remove from headings, keep in body text) and is recorded under Decisions.

## Round 2: Jordan's feedback on the dev site (2026-10-25)

Jordan reviewed the merged slices 1-4 and asked for content and structure changes on top of the re-skin. **This section supersedes the original "no copy changes" and "page structure stays" scope limits for exactly the items listed here, and nothing else.** Already merged as slice 5a: the CampaignHelp card checklist style, six blog topics enforced in the content schema, the "All posts" heading with a count, and a missing space on /tools. This section covers what remains. Each item names the decision and where it came from.

### Decisions

- **Homepage "About me" panel gains two paragraphs** (Jordan's own edit of a voice-box draft, saved 2026-10-25; one typo fixed, "to shared" to "shared"):
  "I live in Pittsburgh, and outside of work I still run StarBase 118, the Star Trek roleplaying community I started on AOL in 1994. I also love synthwave music."
  "I'm a left accelerationist: I want AI built faster, and I want what it makes possible shared with everyone. An end to poverty, disease, loneliness, and war is the end goal."
  They go after the existing two paragraphs and before "Read my full story". No other wording changes.
- **CampaignHelp card copy** (Jordan's edit, saved 2026-10-25): description "IT and operations support for progressive nonprofits and advocacy groups, so your staff can spend their time on campaigns instead of tech." Checklist, in this order: "Ongoing tech & platform support", "Workflow automation", "Hardware management", "Training & onboarding". The checks render as the existing SVG check icon, not emoji. Button stays "See how I help". The Grounded AI card is unchanged.
- **Projects becomes a hub (option C1, "field guide")**, chosen from the mockup at `personal/jordankrueger-site-work/looks/projects-c.html#c1`. `/projects` shows four columns, one per area, each with a small line drawing, one sentence, its three featured entries, and a link to the area page:
  - Movement work: `/projects/movement`, everything on today's Projects page except StarBase 118.
  - StarBase 118: `/projects/starbase-118`, the StarBase 118 entry from today's Projects page plus the 14 community builds from `/ai`.
  - Personal tools: `/projects/personal`, the 12 personal builds from `/ai`.
  - Built with AI: links to `/ai`, which keeps its story and full build list, restyled into three groups of one-line rows that expand (option A's AI page from `looks/projects.html#a`).
  Featured three per area, as in the mockup: Job Seeker's Union, Equity Language Commons, Freehold; StarBase 118 PBEM RPG, Staff Operations Platform, 438K-Post Archive; Drift, AI Progress Tracker, Lease Tracker; AK Help, AI Code Review Pipeline, Claude Code guardrails.
  Area intro sentences are the mockup's: "Projects for progressive organizing and the people doing it." / "The Star Trek community I founded in 1994, and what runs it." / "Small tools I built to run my own life a little better." / "I'm not a developer. I built all of this anyway." Hub heading "Projects", lede "Things I've started, run or built, in four parts of my life."
- **One data source, validated by the build.** All entries move into an Astro content collection `projects` backed by one JSON file, `src/content/projects.json` (file loader), with a zod schema in `src/content.config.ts`. Because it is a content collection, `astro build` rejects a missing or mistyped field (plain `astro build` does not type-check `.ts` data files, so a TypeScript file would not give this guarantee). Fields:
  - `title` (required), `areas` (required, non-empty array of `movement | starbase | personal`), `builtWithAI` (boolean: listed on `/ai`), `aiGroup` (`movement | starbase | personal`, required when `builtWithAI`; the `/ai` group heading), `featured` (boolean) and `short` (required when featured: the mockup's one-line text).
  - From today's Projects page, kept exactly: `body` (the HTML description), `image`, `href`, `linkLabel`, `secondaryLinks`.
  - From today's AI page, kept exactly: `aiDescription`, `tags`, `status`, `statusType`.
  - An entry that appears on both pages today (AI Progress Tracker, Progressives for AI, HighSpeedRail.TV) becomes **one** entry carrying both sets of fields; neither description is dropped.
  Page membership: an area page lists every entry whose `areas` includes it, showing `body` if present, otherwise `aiDescription`, in full (no truncation, no new summaries). `/ai` lists every `builtWithAI` entry under its `aiGroup`, showing `aiDescription` and its `tags` and `status`. Area assignments: every Projects entry except StarBase 118 is `movement`, except AI Progress Tracker, which is `personal` (as in the approved mockup); StarBase 118 and the 14 AI "community" builds are `starbase`; the 12 AI "personal" builds are `personal`; the 6 AI "advocacy" builds are `movement`. `/ai`'s story section and its 11 "stories" stay in `ai.astro` unchanged.
  Only the 12 featured `short` lines are new text (the mockup's, approved with C1). Everything else is moved, not rewritten.
- **No header image on the hub.** The four drawings replace the old Projects header image (Jordan's item 5 is satisfied by the hub itself unless he asks again). `public/images/projects-hero.jpg` is removed if nothing else uses it.
- **Deferred to after Jordan sends the song list:** the synthwave music page (one entry per song with Apple Music, Spotify and artist links) and the three About-page buttons (Synthwave, StarBase 118, Technology). They ship together so no button points at a missing page.

### Reliability for these changes

| Step | Fails loudly? | Report goes somewhere safe? | Can it recover? | Would we notice if it went quiet? |
|---|---|---|---|---|
| Moving entries into `src/content/projects.json` | A missing or mistyped field fails `astro build` (content-collection schema); a dropped or altered entry is silent | Session report | Revert the commit | Only because it is checked: a one-time migration check (`scripts/check-projects-migration.mjs`) extracts every entry and every field from the pre-change `projects.astro` and `ai.astro` (via `git show redesign:<path>`) and asserts each one exists in the new JSON with identical `body`/`image`/`href`/`linkLabel`/`secondaryLinks` and identical `aiDescription`/`tags`/`status`/`statusType`; it must print 0 differences, and it must go red when one field in the JSON is altered on purpose |
| New area routes | A broken route 404s | Session report | Fix and rebuild | Build output lists every route; the check confirms `/projects/movement`, `/projects/starbase-118`, `/projects/personal` exist and every hub link resolves |
| Old links to `/projects` and `/ai` | n/a (both URLs stay) | n/a | n/a | Footer, Tools and AI page links are grepped and still resolve |
| Expandable rows on `/ai` | A row that will not open fails silently | Session report | Revert to plain rows | Only because it is checked: rows are native `<details>`/`<summary>` (keyboard and screen-reader support built in, no script); a Playwright check opens three rows by keyboard (Tab, then Enter) and asserts each row's `open` attribute is set and its description is visible, and the keyboard focus-ring check covers every summary |
