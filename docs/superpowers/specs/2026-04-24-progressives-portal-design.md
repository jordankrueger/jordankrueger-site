# Progressives Projects Portal — Design Spec

**Status:** Approved (brainstorming complete, ready for implementation planning)
**Date:** 2026-04-24
**Owner:** Jordan Krueger
**Repo:** `jordankrueger/jordankrueger-site` (Astro, Cloudflare Pages)

---

## 1. Purpose

A curated, community-voice index of free and open tools for progressive advocacy, nonprofit, and campaign staff. Collects both tools Jordan has built and tools he relies on. Positioned as the "give first" counterpart to paid CampaignHelp work — explicitly *not* a CH marketing surface.

The portal solves a real need: Jordan increasingly wants to hand people a single link to "all the free stuff I have and recommend" without cluttering `campaign.help` (a client-facing consulting site) or `/ai` (a broader personal-portfolio surface).

## 2. Scope

### In scope
- Software, datasets, recipes, snippets, blocklists — **things people can use**.
- Both Jordan-authored tools and external tools he curates.
- Free or open-source only.

### Out of scope
- Podcast (Future Progressives Want), newsletter (Progressives for AI), essays (You HAVE to Learn AI) — these appear as a single "Related" footer link each, not as portal entries.
- Advocacy campaigns (HSR.tv, etc.) — these remain as case studies on `/ai`.
- Paid products (CampaignHelp services, AK Help) — excluded to preserve community-voice posture. The hero carries one line pointing to `campaign.help` for paid work.
- Community-submitted catalog at launch — curation stays curated. Submissions go through a GitHub issue template for Jordan to vet.

## 3. Positioning & home

- URL: **`jordankrueger.com/tools`**
- Implementation surface: new Astro page on the existing `jordankrueger-site` repo. Shares the site's Header, Footer, and design system.
- Nav placement: between "AI" and "About" in the existing Header. Resulting nav order: `Blog → Projects → AI → Tools → About → CampaignHelp`.
- Voice: community curator, not vendor. Jordan's own tools are credited (attribution chip) but not visually weighted above external tools. Same posture as the pre-committed `awesome-actionkit` hub.

## 4. Categories

### Launch taxonomy

| Category | Launch entry count | Panel color class |
|---|---|---|
| ActionKit | ~25 (mirrors `awesome-actionkit`) | `bg-warm` |
| Email & Deliverability | 2 | `bg-peach` |
| Language & Style | 1 (coming soon) | `bg-blue` |
| Advocacy & Campaigns | 1 | `bg-green` |

### Growth slots (structure reserved, entries added later)
- Data & Analytics
- Forms & Pages
- Security & Privacy
- AI Tools for Organizing

### Ordering rules
- Categories appear in the order above at launch.
- Within each category, entries sort by: Jordan's builds first → CampaignHelp builds next → external curated last. Within each group, alphabetical.

## 5. Entry model (data schema)

Each tool card carries:

```yaml
name: ak-redirect-blocks              # display name, mono-weight Lora 1.1rem
slug: ak-redirect-blocks              # URL-safe, unique across the catalog
description: >                         # one sentence, what it does
  Django snippet recipes for after-action redirects — new-user vs. returning,
  donation ladders, UTM-aware routing.
url: https://github.com/CampaignHelp/ak-redirect-blocks  # primary link destination
attribution: campaignhelp              # enum: jordan | campaignhelp | external
free: true                             # bool; non-free excluded from portal but schema supports future expansion
license: MIT                           # optional; shown as chip when set
status: live                           # enum: live | coming-soon
tags: []                               # optional, omittable; reserved for future filtering — NOT rendered at launch
```

Zod schema notes:
- `tags` is `.optional()` — entries may omit it entirely.
- `license` is `.optional()` — chip only renders when set.
- `status` defaults to `"live"`; only `"coming-soon"` triggers the `.soon` card treatment.

Chip rendering from schema:
- `attribution: jordan` → solid terracotta chip "Jordan"
- `attribution: campaignhelp` → solid terracotta chip "CampaignHelp"
- `attribution: external` → blue chip "external"
- `free: true` → green chip "free"
- `license: <value>` → plain chip with the license name (e.g. "MIT", "CC0")
- `status: coming-soon` → warm chip "coming soon", and the card gets dashed border + no shadow + `.soon` class

## 6. Presentation

### Visual reference
Matches `portal-v3.html` mockup (persisted at `.superpowers/brainstorm/48417-1777038876/portal-v3.html` during brainstorming; can be deleted post-implementation).

### Structure (top to bottom)
1. **Site Header** (existing `Header.astro` component, unchanged except for adding the `Tools` nav entry)
2. **Hero** — `.panel.bg-white` card containing:
   - H1: "Tools for progressive campaigns."
   - Intro paragraph (2–3 sentences, includes single inline link to campaign.help)
   - 4-stat row across the panel bottom, separated by a top border: total tools, categories, built by me, last updated (date)
3. **Category panels** — one `.panel` per category with the category's color class:
   - Category header: H2 + meta line (entry count · optional "also on GitHub as awesome-X ↗" link)
   - Short descriptive paragraph under the header
   - Card grid (CSS grid, `minmax(280px, 1fr)` columns, `--spacing-md` gap)
4. **Site Footer** (existing `Footer.astro` component)
5. **Portal-specific footer row** (3 columns: "About this index" / "Related" / "Elsewhere") appears above the site footer, inside the main content flow

### Card design
- White background, `--color-border` 1px border, `--radius-md` corners, `--shadow-soft` warm shadow
- Hover: `translateY(-2px)` + `--shadow-hover`
- Structure: card name (Lora 1.1rem, semibold) → description (DM Sans 0.92rem, 1.55 line-height) → chips row at bottom
- `.soon` modifier: dashed border, transparent background, no shadow
- `.card-more` variant: dashed border, centered text, acts as "+ N more · see all →" overflow tile at end of a category grid. **At launch, no category is truncated — all entries render inline.** The overflow tile is reserved behavior for when any single category exceeds 16 entries; trigger and destination URL are deferred to a follow-up.

### Hero stats row
Four cells, equal width. Each: big terracotta Lora number over a small muted label. Separated from the intro by a `--color-border` top rule.

### Responsive
- 900px breakpoint: panels get horizontal margin and smaller padding (existing pattern)
- 640px breakpoint: desktop nav and subscribe button hidden (existing hamburger menu takes over), stats grid becomes 2×2, footer cols stack

## 7. Tech stack & data model

### Framework
- Astro page at `src/pages/tools.astro`.
- Same pattern as `src/pages/ai.astro`: fetches data, renders sections.

### Source of truth: Astro content collection
- Location: `src/content/tools/` — one YAML file per category:
  - `actionkit.yaml`
  - `deliverability.yaml`
  - `language-style.yaml`
  - `advocacy-campaigns.yaml`
- Category metadata (display name, description, panel color, GitHub-mirror URL) lives alongside the entries in each file, e.g.:

```yaml
# src/content/tools/actionkit.yaml
category:
  name: ActionKit
  slug: actionkit
  description: >
    Snippets, recipes, calculators, and integrations for the ActionKit platform.
  color: bg-warm
  github_mirror: https://github.com/jordankrueger/awesome-actionkit
  order: 1
entries:
  - name: ak-redirect-blocks
    slug: ak-redirect-blocks
    description: ...
    url: ...
    attribution: campaignhelp
    # ...etc
```

- Defined via `content.config.ts` as a new collection `tools` with a Zod schema enforcing the entry model in §5.

### Components
- New: `src/components/ToolCard.astro` — renders a single entry given its data.
- New: `src/components/ToolCategory.astro` — renders a full category panel (header, meta, description, card grid with overflow tile).
- Reuse: `BaseLayout`, `Header`, `Footer`.
- No new design tokens. Reuses `--color-bg-warm/blue/peach/green`, `--color-accent`, existing font families.

### `awesome-actionkit` README sync
- `actionkit.yaml` is the single source of truth for both `/tools`'s ActionKit category AND the `awesome-actionkit` repo README.
- Sync mechanism: a small generator script in the `awesome-actionkit` repo (`scripts/generate-readme.js`) pulls `actionkit.yaml` from the `jordankrueger-site` repo's raw-content URL, renders `README.md` from a template, and commits.
- Trigger: GitHub Action on `awesome-actionkit` runs daily on a cron **and** can be manually dispatched. Also runs on `repository_dispatch` events — `jordankrueger-site` fires one after any commit that touches `src/content/tools/actionkit.yaml`.
- Downstream repo gets a `DO_NOT_EDIT_README_IS_GENERATED` banner at the top of the generated README.

### Deploy
- Existing Cloudflare Pages pipeline. Push to `main` → site rebuilds → `/tools` updated. No additional infra.

## 8. Maintenance workflow

### Adding a tool
1. Open the YAML file for the category in `src/content/tools/`.
2. Append an entry following the schema.
3. Commit, push to `main`.
4. Cloudflare Pages rebuilds; the new entry appears on `/tools` within a few minutes.
5. If it's an ActionKit entry, the `awesome-actionkit` repo's sync action fires (via `repository_dispatch`) and updates the README.

### Adding a category
1. Create a new YAML file under `src/content/tools/`.
2. Set `category.order` to position it in the category list.
3. Commit and push.
4. The new section renders automatically.

### Retiring a tool
- Delete the entry from the YAML. No soft-delete or archive at launch.

### Suggest-a-tool
- Footer "submit on GitHub" link opens a pre-filled GitHub issue on `jordankrueger/jordankrueger-site` using an issue template (`.github/ISSUE_TEMPLATE/suggest-tool.yml`). Jordan triages and adds manually.

## 9. Launch sequence

1. **Scaffold** — create `tools.astro`, `ToolCard.astro`, `ToolCategory.astro`, content collection config, and Zod schema. Ship with an empty content dir so the page renders but shows no categories.
2. **Add `Tools` to nav** — edit `Header.astro` `navLinks` array.
3. **Seed non-AK categories** — author `deliverability.yaml`, `language-style.yaml`, `advocacy-campaigns.yaml` with real entries (4 total across the three).
4. **Seed ActionKit category** — port confirmed entries from the `awesome-actionkit` roadmap into `actionkit.yaml` (~25 entries).
5. **Build the awesome-actionkit generator** — sync script + GitHub Action + `DO_NOT_EDIT` banner. **Before first run, snapshot the current `awesome-actionkit` README** (commit it to the repo as `docs/README.pre-generator.md` or similar) so the pre-sync content is preserved; the first run then overwrites `README.md` with the generated output.
6. **Wire the `repository_dispatch` trigger** in `jordankrueger-site` so changes to `actionkit.yaml` push to the sync action.
7. **Add GitHub issue template** for suggestions.
8. **Launch blog post** on `/blog` announcing the portal (optional but recommended — drives the first wave of eyeballs).

Phases 1–4 can ship the portal as a usable site. Phases 5–6 unlock the single-source-of-truth property. Phase 7–8 polish for launch.

## 10. Cross-references (unchanged by this spec)

- **`/ai` showcase** stays as-is (broader scope; includes MFC, HSR, personal projects, case studies). Portal is narrower and tool-focused.
- **`awesome-actionkit` repo** — strategy from `business/campaignhelp/ak-resources/ROADMAP.md` still holds. The repo remains on `jordankrueger/` personal GitHub; its README is now generated from portal YAML instead of maintained manually.
- **`campaign.help`** — unaffected. Hero intro on `/tools` carries one link pointing there for paid work.
- **Existing sub-page patterns** — `/ai.astro` is the reference implementation. The portal reuses its `.panel`, `.bg-*`, stats-row, and section-panel patterns.

## 11. Non-goals (explicit anti-scope)

- Not a CampaignHelp page.
- Not a podcast/newsletter hub.
- Not a portfolio (that's `/ai`).
- Not a paid-products directory.
- Not community-submitted at launch — all entries are curated by Jordan.
- Not a search/filter app at launch — pure static page, categorized card grid. Can evolve if entry count outgrows scannability.

## 12. Success criteria

The portal is "live enough" when:
- `/tools` renders with all 4 categories populated with real entries
- The nav link is in place site-wide
- `awesome-actionkit` README reflects `actionkit.yaml` automatically
- One external audience member (ClientCon peer, Slack contact, etc.) has bookmarked or shared the URL

## 13. Open questions (non-blocking)

- **Hero intro copy** — draft text is in the mockup; will want a humanizer + writing-voice pass before launch.
- **`coming soon` UX** — should the card link to something (e.g., a blog post, a repo-in-progress), or be non-interactive until the tool ships? Current mockup has it as a link, probably stub → repo.
- **Analytics event tagging** — should outbound-link clicks be tracked separately (GA4 events) so Jordan can see which tools people actually click through to? Not required for launch; consider in a follow-up.
- **Issue-queue separation** — if "suggest a tool" issues on the main `jordankrueger-site` repo become noisy, spin off a dedicated `progressive-tools` repo just for the issue queue. Not needed at launch.
