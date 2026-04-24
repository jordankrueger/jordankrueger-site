# Progressives Projects Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/tools` — a curated, community-voice catalog of progressive-movement advocacy tools — as a new sub-page on `jordankrueger.com`.

**Architecture:** New Astro page (`src/pages/tools.astro`) on the existing `jordankrueger-site` repo. Data lives in a new Astro content collection (`src/content/tools/*.yaml`), one YAML file per category, each containing both category metadata and its entries. Page renders via two new components (`ToolCategory.astro` + `ToolCard.astro`) that consume the collection. Shares the site's existing Header, Footer, design tokens, and `.panel` / `.bg-*` pastel classes. Deploys via the existing Cloudflare Pages pipeline on push to `main`.

**Tech Stack:** Astro 5.x content collections with glob loader, Zod schema, Lora + DM Sans typography, Carrd-lineage `.panel` design, Cloudflare Pages.

**Scope excludes (deferred to a follow-up plan):**
- The `awesome-actionkit` README generator and its sync GitHub Action
- `repository_dispatch` trigger wiring from `jordankrueger-site` → `awesome-actionkit`
- Launch blog post on `/blog`

**Reference spec:** `docs/superpowers/specs/2026-04-24-progressives-portal-design.md`

---

## File Structure

**New files in `jordankrueger-site`:**
- `src/pages/tools.astro` — the portal page
- `src/components/ToolCard.astro` — single tool card
- `src/components/ToolCategory.astro` — category panel + card grid
- `src/content/tools/actionkit.yaml` — ActionKit category + ~25 entries
- `src/content/tools/deliverability.yaml` — Email & Deliverability category + 2 entries
- `src/content/tools/language-style.yaml` — Language & Style category + 1 entry (coming-soon)
- `src/content/tools/advocacy-campaigns.yaml` — Advocacy & Campaigns category + 1 entry
- `.github/ISSUE_TEMPLATE/suggest-tool.yml` — issue template for community submissions

**Modified files:**
- `src/content.config.ts` — register the `tools` collection
- `src/components/Header.astro` — add `Tools` nav entry
- `CLAUDE.md` (site-root) — document the new `/tools` page and content collection

**No new dependencies.** Astro 5's content layer parses YAML natively via the glob loader — no `js-yaml` or YAML plugin needed.

**Component responsibilities:**
- `ToolCard.astro` — renders one entry: name, description, chips (attribution, free, license, coming-soon). Only knows about entry data.
- `ToolCategory.astro` — renders one panel: header, meta line, description, card grid, conditional overflow tile. Knows about category data + an array of entries.
- `tools.astro` — composes: hero panel with stats + iterate categories sorted by `order` + portal footer row, all wrapped in `BaseLayout` (which already renders the shared `Header` and `Footer` components — no need to import them directly). Knows about the whole collection.

---

## Task 1: Register the `tools` content collection

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/tools/` directory (empty for now)

- [ ] **Step 1: Read the current content config**

Run: `cat src/content.config.ts`
Expected: shows the existing `posts` collection.

- [ ] **Step 2: Add the `tools` collection with Zod schema**

Edit `src/content.config.ts`. Add these imports at the top if not present:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
```

Add a new collection definition above the `collections` export:

```ts
const tools = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/tools" }),
  schema: z.object({
    category: z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      color: z.enum(['bg-warm', 'bg-blue', 'bg-peach', 'bg-green']),
      github_mirror: z.string().url().optional(),
      order: z.number().int(),
    }),
    entries: z.array(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      url: z.string().url(),
      attribution: z.enum(['jordan', 'campaignhelp', 'external']),
      free: z.boolean().default(true),
      license: z.string().optional(),
      status: z.enum(['live', 'coming-soon']).default('live'),
      tags: z.array(z.string()).optional(),
    })),
  }),
});
```

Update the export:

```ts
export const collections = { posts, tools };
```

- [ ] **Step 3: Create the empty content directory**

Run: `mkdir -p src/content/tools`
Expected: directory exists, empty.

- [ ] **Step 4: Verify the site still builds with an empty collection**

Run: `npm run build`
Expected: build succeeds. The `tools` collection will be empty but valid. If Astro complains about empty collections, add a `.gitkeep` file and retry.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/tools
git commit -m "feat(tools): register tools content collection with zod schema"
```

---

## Task 2: Seed the Advocacy & Campaigns category (smallest, validates pipeline)

**Files:**
- Create: `src/content/tools/advocacy-campaigns.yaml`

- [ ] **Step 1: Write the YAML**

Create `src/content/tools/advocacy-campaigns.yaml`:

```yaml
category:
  name: Advocacy & Campaigns
  slug: advocacy-campaigns
  description: General-purpose campaign utilities that work across platforms.
  color: bg-green
  order: 4

entries:
  - name: petition-delivery-formatter
    slug: petition-delivery-formatter
    description: Format petition signatures into a printable PDF delivery packet. Works with ActionKit exports but platform-agnostic.
    url: https://github.com/jordankrueger/petition-delivery-formatter
    attribution: jordan
    free: true
    license: MIT
    status: live
```

- [ ] **Step 2: Verify the build accepts it**

Run: `npm run build`
Expected: build succeeds. Zod validates the entry. If any validation error, the build will name the field — fix and retry.

- [ ] **Step 3: Commit**

```bash
git add src/content/tools/advocacy-campaigns.yaml
git commit -m "feat(tools): seed advocacy & campaigns category"
```

---

## Task 3: Build the `ToolCard` component

**Files:**
- Create: `src/components/ToolCard.astro`

- [ ] **Step 1: Write the component**

Create `src/components/ToolCard.astro`:

```astro
---
export interface Props {
  name: string;
  description: string;
  url: string;
  attribution: 'jordan' | 'campaignhelp' | 'external';
  free: boolean;
  license?: string;
  status: 'live' | 'coming-soon';
}

const { name, description, url, attribution, free, license, status } = Astro.props;

const attributionLabel = {
  jordan: 'Jordan',
  campaignhelp: 'CampaignHelp',
  external: 'external',
}[attribution];

const attributionChipClass = attribution === 'external' ? 'chip external' : 'chip built';
const isComingSoon = status === 'coming-soon';
---

<a class:list={["tool-card", { soon: isComingSoon }]} href={url} target="_blank" rel="noopener">
  <div class="tool-card-name">{name}</div>
  <div class="tool-card-desc">{description}</div>
  <div class="chips">
    {isComingSoon && <span class="chip soon">coming soon</span>}
    <span class={attributionChipClass}>{attributionLabel}</span>
    {free && <span class="chip free">free</span>}
    {license && <span class="chip">{license}</span>}
  </div>
</a>

<style>
  .tool-card {
    background: var(--color-bg-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-soft);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    min-height: 170px;
    text-decoration: none;
    color: var(--color-text);
  }
  .tool-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
    color: var(--color-text);
  }
  .tool-card.soon {
    background: transparent;
    border-style: dashed;
    box-shadow: none;
  }
  .tool-card-name {
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--color-text);
    margin-bottom: 0.4rem;
    line-height: 1.3;
  }
  .tool-card-desc {
    color: var(--color-text);
    font-size: 0.92rem;
    line-height: 1.55;
    flex-grow: 1;
    margin-bottom: var(--spacing-sm);
  }
  .chips {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .chip {
    font-size: 0.72rem;
    padding: 0.18rem 0.55rem;
    border-radius: 0.8rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: 500;
    border: 1px solid var(--color-border);
  }
  .chip.built {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }
  .chip.external {
    background: var(--color-bg-blue);
    border-color: #b3d4e8;
    color: #2c5f7d;
  }
  .chip.free {
    background: var(--color-bg-green);
    border-color: #b8d4bf;
    color: #3a5128;
  }
  .chip.soon {
    background: var(--color-bg-warm);
    border-color: #e0c690;
    color: #7a5a1a;
    font-style: italic;
  }
</style>
```

- [ ] **Step 2: Verify the component compiles**

Run: `npm run build`
Expected: build succeeds. (The component is unused at this point but should still type-check.)

- [ ] **Step 3: Commit**

```bash
git add src/components/ToolCard.astro
git commit -m "feat(tools): add ToolCard component"
```

---

## Task 4: Build the `ToolCategory` component

**Files:**
- Create: `src/components/ToolCategory.astro`

- [ ] **Step 1: Write the component**

Create `src/components/ToolCategory.astro`:

```astro
---
import ToolCard from './ToolCard.astro';

export interface Entry {
  name: string;
  slug: string;
  description: string;
  url: string;
  attribution: 'jordan' | 'campaignhelp' | 'external';
  free: boolean;
  license?: string;
  status: 'live' | 'coming-soon';
}

export interface Props {
  name: string;
  slug: string;
  description: string;
  color: 'bg-warm' | 'bg-blue' | 'bg-peach' | 'bg-green';
  github_mirror?: string;
  entries: Entry[];
}

const { name, slug, description, color, github_mirror, entries } = Astro.props;

// Sort: jordan > campaignhelp > external; then alphabetical by name within each group
const attributionOrder = { jordan: 0, campaignhelp: 1, external: 2 };
const sortedEntries = [...entries].sort((a, b) => {
  const ao = attributionOrder[a.attribution] - attributionOrder[b.attribution];
  if (ao !== 0) return ao;
  return a.name.localeCompare(b.name);
});

const entryCount = entries.length;
const entryCountLabel = entryCount === 1 ? '1 tool' : `${entryCount} tools`;
---

<section class="section-wrap">
  <div class:list={["panel", color]} id={slug}>
    <div class="cat-header">
      <h2>{name}</h2>
      <div class="cat-meta">
        {entryCountLabel}
        {github_mirror && (
          <>
            {' · '}
            <a href={github_mirror} target="_blank" rel="noopener">also on GitHub ↗</a>
          </>
        )}
      </div>
    </div>
    <p class="cat-desc">{description}</p>

    <div class="grid">
      {sortedEntries.map(entry => (
        <ToolCard {...entry} />
      ))}
    </div>
  </div>
</section>

<style>
  .section-wrap { padding: 0; }
  .cat-header { margin-bottom: var(--spacing-xs); }
  .cat-header h2 { margin-bottom: 0.2rem; }
  .cat-meta {
    font-size: 0.85rem;
    color: var(--color-text-light);
  }
  .cat-desc {
    color: var(--color-text);
    margin-top: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    max-width: 640px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
</style>
```

- [ ] **Step 2: Verify the component compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ToolCategory.astro
git commit -m "feat(tools): add ToolCategory component"
```

---

## Task 5: Build the `/tools` page

**Files:**
- Create: `src/pages/tools.astro`

- [ ] **Step 1: Write the page**

Create `src/pages/tools.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ToolCategory from '../components/ToolCategory.astro';
import { getCollection } from 'astro:content';

const categoryEntries = await getCollection('tools');

// Sort categories by declared order
const sortedCategories = categoryEntries.sort((a, b) => a.data.category.order - b.data.category.order);

// Stats
const totalTools = categoryEntries.reduce((sum, c) => sum + c.data.entries.length, 0);
const totalCategories = categoryEntries.length;
const builtByMe = categoryEntries.reduce((sum, c) =>
  sum + c.data.entries.filter(e => e.attribution === 'jordan' || e.attribution === 'campaignhelp').length,
  0
);

// Last-updated date — for now, just "today" at build time.
// Future: pull from git log for the content dir.
const lastUpdated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
---

<BaseLayout
  title="Tools for Progressive Campaigns | Jordan Krueger"
  description="A curated index of free and open tools for advocacy orgs, nonprofits, and campaign staff. Some I've built. Most I just rely on. All of them earn their keep."
>

  <!-- HERO -->
  <section class="tools-hero-wrap">
    <div class="tools-hero panel bg-white">
      <h1>Tools for progressive campaigns.</h1>
      <p class="tools-hero-intro">
        A curated index of free and open resources for advocacy orgs, nonprofits, and campaign staff.
        Some I've built. Most I just rely on. All of them earn their keep.
        Nothing here is paid &mdash; for CampaignHelp's paid work,
        <a href="https://campaign.help">head over here</a>.
      </p>

      <div class="tools-stats">
        <div class="tools-stat">
          <div class="tools-stat-number">{totalTools}</div>
          <div class="tools-stat-label">Tools</div>
        </div>
        <div class="tools-stat">
          <div class="tools-stat-number">{totalCategories}</div>
          <div class="tools-stat-label">Categories</div>
        </div>
        <div class="tools-stat">
          <div class="tools-stat-number">{builtByMe}</div>
          <div class="tools-stat-label">Built by me</div>
        </div>
        <div class="tools-stat">
          <div class="tools-stat-number">{lastUpdated}</div>
          <div class="tools-stat-label">Last updated</div>
        </div>
      </div>
    </div>
  </section>

  <main>
    {sortedCategories.map(cat => (
      <ToolCategory
        name={cat.data.category.name}
        slug={cat.data.category.slug}
        description={cat.data.category.description}
        color={cat.data.category.color}
        github_mirror={cat.data.category.github_mirror}
        entries={cat.data.entries}
      />
    ))}
  </main>

  <!-- PORTAL FOOTER ROW -->
  <section class="tools-footer-row">
    <div class="container footer-cols">
      <div>
        <h4>About this index</h4>
        <p>Curated by Jordan Krueger. Most entries aren't mine — I list them because I've used them and they work. Inclusion is not an endorsement of any vendor.</p>
        <p style="margin-top: 0.8rem;">
          Suggest a tool →
          <a href="https://github.com/jordankrueger/jordankrueger-site/issues/new?template=suggest-tool.yml">submit on GitHub</a>
        </p>
      </div>
      <div>
        <h4>Related</h4>
        <ul>
          <li><a href="https://github.com/jordankrueger/awesome-actionkit" target="_blank" rel="noopener">awesome-actionkit ↗</a></li>
          <li><a href="https://progressives.ai">Progressives for AI</a></li>
        </ul>
      </div>
      <div>
        <h4>Elsewhere on this site</h4>
        <ul>
          <li><a href="/ai">AI Showcase</a></li>
          <li><a href="https://campaign.help" target="_blank" rel="noopener">CampaignHelp</a></li>
          <li><a href="/blog">Writing</a></li>
        </ul>
      </div>
    </div>
  </section>

</BaseLayout>

<style>
  .tools-hero-wrap { padding-top: var(--spacing-md); }
  .tools-hero h1 {
    margin-bottom: var(--spacing-sm);
    max-width: 820px;
  }
  .tools-hero-intro {
    font-size: 1.05rem;
    color: var(--color-text);
    max-width: 720px;
    margin-bottom: var(--spacing-md);
  }
  .tools-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }
  .tools-stat { text-align: center; }
  .tools-stat-number {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1.1;
  }
  .tools-stat-label {
    font-size: 0.85rem;
    color: var(--color-text-light);
    margin-top: 0.2rem;
  }

  .tools-footer-row {
    margin-top: var(--spacing-2xl);
    padding: var(--spacing-xl) 0;
    border-top: 2px solid var(--color-border);
  }
  .tools-footer-row .footer-cols {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--spacing-xl);
  }
  .tools-footer-row h4 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-light);
    margin-bottom: var(--spacing-sm);
    font-weight: 700;
  }
  .tools-footer-row p, .tools-footer-row li {
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
  }
  .tools-footer-row ul { list-style: none; padding: 0; }

  @media (max-width: 900px) {
    .tools-stats { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .tools-footer-row .footer-cols { grid-template-columns: 1fr; gap: var(--spacing-lg); }
  }
</style>
```

- [ ] **Step 2: Start the dev server and visit the page**

Run (in a separate terminal or background): `npm run dev`
Then visit: http://jordans-mac-mini:4321/tools

Expected:
- Page renders with hero panel + stats row showing `1 Tools · 1 Categories · 1 Built by me · <today>`
- Below the hero, one green panel for Advocacy & Campaigns with one card (petition-delivery-formatter)
- Site header and footer render correctly
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/tools.astro
git commit -m "feat(tools): add /tools page with hero, categories, and portal footer"
```

---

## Task 6: Add `Tools` to site navigation

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Edit the navLinks array**

Open `src/components/Header.astro`. Find the `navLinks` array near the top of the frontmatter:

```ts
const navLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/ai', label: 'AI' },
  { href: '/about', label: 'About' },
  { href: 'https://campaign.help', label: 'CampaignHelp', external: true },
];
```

Insert a new entry for Tools between `AI` and `About`:

```ts
const navLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/ai', label: 'AI' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
  { href: 'https://campaign.help', label: 'CampaignHelp', external: true },
];
```

- [ ] **Step 2: Verify the nav renders correctly**

With `npm run dev` still running, refresh the homepage and `/tools`. Expected:
- Header shows `Blog · Projects · AI · Tools · About · CampaignHelp`
- When on `/tools`, the `Tools` link has the terracotta underline (`active` class)
- Clicking `Tools` from any other page navigates to `/tools`

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat(nav): add Tools link to site header"
```

---

## Task 7: Seed Email & Deliverability category

**Files:**
- Create: `src/content/tools/deliverability.yaml`

- [ ] **Step 1: Write the YAML**

Create `src/content/tools/deliverability.yaml`:

```yaml
category:
  name: Email & Deliverability
  slug: deliverability
  description: Blocklists, warm-up guides, and deliverability diagnostics for progressive email programs.
  color: bg-peach
  order: 2

entries:
  - name: progressive-email-suppression
    slug: progressive-email-suppression
    description: >
      ~66k-domain email suppression list consolidating CREDO Action, Avaaz, and community upstream
      lists. CC0 license, nightly rebuild. Drop into Mailgun/SendGrid/Amazon SES/Listmonk.
    url: https://github.com/jordankrueger/progressive-email-suppression
    attribution: jordan
    free: true
    license: CC0
    status: live

  - name: AK typo-domain blocklist
    slug: ak-typo-domain-blocklist
    description: >
      Catch common email-typo domains (gmial.com, yahooo.com, hotmial.com) before they tank your
      ActionKit sender reputation. Regex patterns + AK email-check hook template.
    url: https://github.com/CampaignHelp/ak-typo-blocklist
    attribution: campaignhelp
    free: true
    license: MIT
    status: live
```

Note: if the CampaignHelp repo URL doesn't exist yet, use `https://github.com/CampaignHelp` as a placeholder or mark `status: coming-soon`. To check whether the repo exists without asking Jordan, run:

```bash
gh repo view CampaignHelp/ak-typo-blocklist 2>&1 | head -1
```

If the output is a `Could not resolve to a Repository` error, the repo doesn't exist yet — mark the entry `status: coming-soon`. If the output is the repo name, use the URL as-is.

- [ ] **Step 2: Verify the build and the page**

Run: `npm run build`
Expected: build succeeds.

With dev server running, refresh `/tools`. Expected: second panel appears with peach background, 2 cards. Hero stats now show `3 Tools · 2 Categories · 2 Built by me`.

- [ ] **Step 3: Commit**

```bash
git add src/content/tools/deliverability.yaml
git commit -m "feat(tools): seed email & deliverability category"
```

---

## Task 8: Seed Language & Style category (coming-soon entry)

**Files:**
- Create: `src/content/tools/language-style.yaml`

- [ ] **Step 1: Write the YAML**

Create `src/content/tools/language-style.yaml`:

```yaml
category:
  name: Language & Style
  slug: language-style
  description: Progressive-movement style guides, messaging frameworks, and language resources.
  color: bg-blue
  order: 3

entries:
  - name: progressive-style-guides
    slug: progressive-style-guides
    description: >
      Searchable aggregator of progressive style guides and language resources — messaging
      frameworks, terminology standards, voice guides. Pulls from union, climate, racial justice,
      and repro rights communities.
    url: https://github.com/jordankrueger/progressive-style-guides
    attribution: jordan
    free: true
    status: coming-soon
```

- [ ] **Step 2: Verify the page**

Refresh `/tools`. Expected: third panel appears with blue background, one dashed "coming soon" card. Hero stats now `4 Tools · 3 Categories · 3 Built by me`.

- [ ] **Step 3: Commit**

```bash
git add src/content/tools/language-style.yaml
git commit -m "feat(tools): seed language & style category"
```

---

## Task 9: Seed ActionKit category

**Files:**
- Create: `src/content/tools/actionkit.yaml`
- Reference: `~/ClaudeCode/business/campaignhelp/ak-resources/ROADMAP.md` (your own planning doc — the authoritative list of confirmed awesome-actionkit entries lives here and must be read before authoring the YAML)

- [ ] **Step 1: Read the ROADMAP to get the confirmed entry list**

Run: `cat ~/ClaudeCode/business/campaignhelp/ak-resources/ROADMAP.md`

Look for the section describing confirmed awesome-actionkit entries (should be ~26 as of 2026-04-23). Each entry should have name, description, URL, and attribution context.

- [ ] **Step 2: Author the YAML from the ROADMAP**

Create `src/content/tools/actionkit.yaml` with this structure:

```yaml
category:
  name: ActionKit
  slug: actionkit
  description: Snippets, recipes, calculators, and integrations for the ActionKit platform used by most progressive nonprofits.
  color: bg-warm
  github_mirror: https://github.com/jordankrueger/awesome-actionkit
  order: 1

entries:
  # CampaignHelp-built (tier: paste-and-go, MIT)
  - name: ak-redirect-blocks
    slug: ak-redirect-blocks
    description: Django snippet recipes for after-action redirects — new-user vs. returning, donation ladders, UTM-aware routing.
    url: https://github.com/CampaignHelp/ak-redirect-blocks
    attribution: campaignhelp
    free: true
    license: MIT
    status: live

  - name: ak-mailing-blocks
    slug: ak-mailing-blocks
    description: Copy-paste HTML blocks for ActionKit mailings. Three-tier model — hard-coded, custom-field-wired, or dynamic per-recipient.
    url: https://github.com/CampaignHelp/ak-mailing-blocks
    attribution: campaignhelp
    free: true
    license: MIT
    status: live

  - name: ak-health-check
    slug: ak-health-check
    description: Config and deliverability health check for your ActionKit instance. Flags common misconfigurations before they bite.
    url: https://github.com/CampaignHelp/ak-health-check
    attribution: campaignhelp
    free: true
    status: live

  - name: ak-sql-recipes
    slug: ak-sql-recipes
    description: Tested ActionKit SQL queries and Query Builder patterns for the questions clients keep asking — list health, donor cohorts, engagement ladders.
    url: https://github.com/CampaignHelp/ak-sql-recipes
    attribution: campaignhelp
    free: true
    status: live

  # External curated tools — fill from ROADMAP
  # ...continue with the rest of the confirmed entries...
```

Continue authoring entries for each confirmed tool in the ROADMAP. For each external tool:
- `attribution: external`
- Link to the upstream author's repo/page
- Keep descriptions to one sentence (copy the spirit from the ROADMAP, don't over-embellish)

If any ROADMAP entry is ambiguous on attribution or URL, flag it in a comment and ask Jordan before committing.

- [ ] **Step 3: Verify the build accepts the full file**

Run: `npm run build`
Expected: build succeeds. Any Zod validation error names the field — fix and retry.

- [ ] **Step 4: Visual check**

Refresh `/tools`. Expected: ActionKit is now the first panel (order 1), warm background, with all ~25 cards. CampaignHelp-attributed cards appear first (sort-order 1), then external cards alphabetically. Hero stats reflect new counts.

- [ ] **Step 5: Commit**

```bash
git add src/content/tools/actionkit.yaml
git commit -m "feat(tools): seed actionkit category from awesome-actionkit roadmap"
```

---

## Task 10: Add GitHub issue template for tool suggestions

**Files:**
- Create: `.github/ISSUE_TEMPLATE/suggest-tool.yml`

- [ ] **Step 1: Write the template**

Create `.github/ISSUE_TEMPLATE/suggest-tool.yml`:

```yaml
name: Suggest a tool
description: Suggest a free or open-source tool for the /tools index
title: "[Tool] <name>"
labels: ["tool-suggestion"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a tool! A few notes:
        - Tools must be free to use (open source or free-tier; paid products are out of scope).
        - Jordan reviews suggestions and adds them manually — not every suggestion lands.
        - If you built the tool yourself, say so — that helps with attribution.

  - type: input
    id: name
    attributes:
      label: Tool name
      placeholder: ak-awesome-thing
    validations:
      required: true

  - type: input
    id: url
    attributes:
      label: URL (repo or homepage)
      placeholder: https://github.com/...
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: One-sentence description
      description: What does it do? Keep it tight — 1–2 sentences max.
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Best category
      options:
        - ActionKit
        - Email & Deliverability
        - Language & Style
        - Advocacy & Campaigns
        - Other / not sure
    validations:
      required: true

  - type: dropdown
    id: attribution
    attributes:
      label: Relationship to the tool
      options:
        - I built it
        - I rely on it but didn't build it
        - Someone I know built it
        - Other
    validations:
      required: true

  - type: textarea
    id: notes
    attributes:
      label: Anything else?
      description: Optional — context, a use case, why it deserves a spot.
```

- [ ] **Step 2: Verify on GitHub**

Commit, push, then visit `https://github.com/jordankrueger/jordankrueger-site/issues/new/choose`. Expected: the "Suggest a tool" template appears as an option.

- [ ] **Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/suggest-tool.yml
git commit -m "feat(tools): add github issue template for tool suggestions"
```

---

## Task 11: Update site CLAUDE.md to document the new page and collection

**Files:**
- Modify: `CLAUDE.md` (site root, i.e. `personal/jordankrueger-site/CLAUDE.md`)

- [ ] **Step 1: Read the current CLAUDE.md**

Run: `cat CLAUDE.md | head -60`

Find the `## Pages` section. It currently lists `/`, `/blog`, `/projects`, `/ai`, `/building`, `/about`.

- [ ] **Step 2: Add `/tools` entry and a content-collection note**

Under `## Pages`, add:

```md
- `/tools` — Progressives Projects Portal. A curated catalog of free/open tools for advocacy orgs. Data lives in the `tools` Astro content collection (`src/content/tools/*.yaml`). One YAML file per category; each file contains `category:` metadata and an `entries:` array. Adding a tool = editing the relevant YAML + push. Zod schema lives in `src/content.config.ts`. Uses `ToolCard` and `ToolCategory` components.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(tools): document /tools page and content collection in CLAUDE.md"
```

---

## Task 12: Final verification pass before pushing

- [ ] **Step 1: Clean build and full page check**

Run: `npm run build`
Expected: builds without warnings or errors.

Run: `npm run dev` and visit `http://jordans-mac-mini:4321/tools`.

Visually verify:
- [ ] Site header shows all nav links, `Tools` has terracotta underline when on `/tools`
- [ ] Hero panel: H1, intro paragraph with inline `campaign.help` link, stats row with correct counts
- [ ] Category panels appear in order: ActionKit (warm) → Email & Deliverability (peach) → Language & Style (blue) → Advocacy & Campaigns (green)
- [ ] Within each category, Jordan-attributed cards appear before CampaignHelp-attributed before external (if that mix exists in the category)
- [ ] Each card: name in Lora bold, description, chips for attribution + free + license (+ coming-soon where applicable)
- [ ] Coming-soon card has dashed border, transparent background, no shadow
- [ ] Portal footer row shows 3 columns: About / Related / Elsewhere
- [ ] Site footer renders below portal footer row
- [ ] Mobile width (<640px): nav collapses to hamburger, stats row goes 2x2, footer cols stack
- [ ] Check console — no JS errors, no 404s on fonts/assets

- [ ] **Step 2: Check outbound links actually resolve**

Spot-check 4 entries — click through and confirm the URL returns a real page (or a "coming soon" repo if it's a placeholder). If any URL 404s, fix it in the YAML and recommit.

- [ ] **Step 3: Push to `main`**

Before pushing, invoke the `github-ops` skill to confirm the `jordankrueger` GitHub account is the active one (not `buckfoster` / `ufopsb118` — the site repo belongs to `jordankrueger`).

Confirm with Jordan before pushing. Then:

```bash
git push origin main
```

Cloudflare Pages auto-deploys. Verify by visiting `https://jordankrueger.com/tools` a few minutes after push.

- [ ] **Step 4: Verify in production**

Check production URL. Confirm:
- Page renders with all categories
- `Tools` appears in site nav
- No broken links

---

## Post-launch (out of scope for this plan)

- Write the follow-up plan for the `awesome-actionkit` README generator (YAML→README sync + GitHub Action + repository_dispatch trigger)
- Write the launch blog post (goes through `publish-blog` skill)
- Consider GA4 outbound-link event tracking for tools

---

## Skills to reference during implementation

- `dev-standards` — quality gate checks at feature completion
- `simplify` — review for reuse, quality, efficiency after the plan completes
- `github-ops` — ensure `jordankrueger` GitHub account is active before push (not `buckfoster` or `ufopsb118`)
