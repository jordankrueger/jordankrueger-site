# jordankrueger.com Simplification + Coordinated Cross-Site Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `jordankrueger.com` to its new role as a personal hub, migrate AI content to Grounded AI (Plan A destinations) and the `/tools` portal to CampaignHelp (Plan B destinations), set up redirects, send the Mission Control transparency email, turn off the coaching Carrd, and execute the coordinated cross-site launch sequence.

**Architecture:** This plan is mostly subtractive (removals + redirects) on jordankrueger.com plus a launch-sequencing harness across all three sites. It is the ONLY plan that depends on both Plan A and Plan B — it cannot start the launch sequence until both are deploy-ready. Earlier audit decisions (per-post, per-project — done in Plan A Phase 2) determine what content moves where.

**Tech Stack:**
- **jordankrueger.com:** Astro 5.x + Cloudflare Pages (existing — personal CF account)
- **Cloudflare redirects:** Pages `_redirects` file or rules config
- **Coaching Carrd:** at coaching.jordankrueger.com (separate Carrd account — turn off via Carrd UI)
- **Mission Control transparency email:** Listmonk on CH VPS (newsletter.campaign.help, list id 4, template id 6)
- **Skills referenced during execution:**
  - `superpowers:test-driven-development` (where redirects need verification)
  - `superpowers:verification-before-completion`
  - `writing-voice` + `humanizer` (transparency email + about-page copy update)
  - Marketing skill: `launch-strategy` at `business/campaignhelp/marketingskills/skills/launch-strategy/SKILL.md` (cross-site launch orchestration)
  - Marketing skill: `social-content` (post-launch announcement on LinkedIn/BlueSky)

**Spec:** `business/groundedai/docs/superpowers/specs/2026-04-27-grounded-ai-launch-design.md`

**Dependencies (must be deploy-ready before this plan starts):**
- **Plan A:** GAH site live at `groundedai.help` with all 6 main pages. Conditional pages (`/work`, `/blog`, `/building`) shipped per audit decisions.
- **Plan B:** CH refactor live at `campaign.help` with `/resources/ak-template` and `/resources/progressive-tools` reachable.

If either is not ready, **DO NOT START Plan C**. The redirect setup, jordankrueger.com simplifications, and transparency email all assume destinations exist.

---

## File Structure

### Files modified

```
personal/jordankrueger-site/
├── src/
│   ├── pages/
│   │   ├── index.astro                  MODIFIED — service grid 4→2 cards; remove AK Template panel; replace MC signup with pointer
│   │   ├── about.astro                  MODIFIED (Phase 4) — copy update + Schema.org JSON-LD
│   │   ├── ai.astro                     DELETED — content curated to GAH /work in Plan A
│   │   ├── building.astro               DELETED — content moved to GAH in Plan A
│   │   └── tools.astro                  DELETED — content moved to CH /resources/progressive-tools in Plan B
│   ├── content/
│   │   ├── posts/                       MODIFIED — MOVE-bucket posts deleted (already copied to GAH in Plan A)
│   │   └── tools/                       DELETED ENTIRELY — content moved to CH in Plan B
│   └── components/
│       └── (no component changes — all changes are at the page/content level)
├── public/
│   └── _redirects                       CREATED — Cloudflare Pages redirect rules
└── docs/superpowers/plans/
    └── 2026-04-27-jordankrueger-simplify.md   (this plan)
```

### External actions

- **Coaching Carrd at coaching.jordankrueger.com:** turn off entirely (manual via Carrd UI)
- **Listmonk on CH VPS:** send Mission Control transparency email (one-time campaign); update Listmonk default per-campaign From address
- **Cloudflare DNS for coaching.jordankrueger.com subdomain:** delete the DNS record OR redirect entire subdomain after Carrd is off

---

## Phase 0: Pre-flight checks

**Critical:** verify Plan A and Plan B are both deploy-ready before starting any work in this plan.

### Task 0.1: Verify Plan A is live and functional

- [ ] **Step 1: Confirm groundedai.help is responding**

```bash
curl -sI https://groundedai.help | head -3
# Expected: HTTP/2 200, valid Let's Encrypt cert
```

- [ ] **Step 2: Confirm GAH 6 main pages render**

```bash
for path in / /speaking /workshops /advisory /about /contact; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://groundedai.help${path}")
  echo "${path}: ${code}"
done
# Expected: all 200
```

- [ ] **Step 3: Confirm GAH conditional pages match audit outcome**

Read `business/groundedai/docs/migration/post-audit.md` and `project-audit.md`. For pages that audit said should ship at launch (`/blog`, `/work`, `/building`), confirm they're live:

```bash
# Example — only if audit said /work ships:
curl -s -o /dev/null -w "%{http_code}\n" https://groundedai.help/work
```

If audit said a conditional page does NOT ship, the corresponding redirect from jordankrueger.com defers (Phase 5).

- [ ] **Step 4: Confirm GAH newsletter signup form is live and functional**

Submit a test signup with `jordan+gahtest@campaign.help`. Verify it lands in Listmonk Mission Control list.

### Task 0.2: Verify Plan B is live and functional

- [ ] **Step 1: Confirm campaign.help/resources/* pages render**

```bash
for path in /resources/ /resources/ak-template/ /resources/progressive-tools/ /resources/progressive-tools/actionkit/; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://campaign.help${path}")
  echo "${path}: ${code}"
done
# Expected: all 200
```

- [ ] **Step 2: Confirm AK Template form on CH is functional**

Submit a test signup with `jordan+chaktest@campaign.help`. Verify it lands in Listmonk with `attribs.cohort = "ak-template"`.

- [ ] **Step 3: Confirm CH header has Resources link**

```bash
curl -s https://campaign.help/ | grep -o 'href="/resources[^"]*"' | head -3
# Expected: at least one /resources/ link present
```

### Task 0.3: Capture audit decisions in this plan

The post-audit and project-audit decisions from Plan A determine which redirects fire. Read those files now and record decisions for this plan's reference:

- [ ] **Step 1: Read audit files**

```bash
cat ~/ClaudeCode/business/groundedai/docs/migration/post-audit.md
cat ~/ClaudeCode/business/groundedai/docs/migration/project-audit.md
```

- [ ] **Step 2: Build the redirect-fire matrix**

Make a quick reference document listing which redirects will be set in Phase 5:

```markdown
# Plan C Redirect Matrix (created at Phase 0.3)

| Source | Destination | Will fire? | Why |
|---|---|---|---|
| /blog/<slug> (per slug — list all MOVE-bucket slugs) | groundedai.help/blog/<slug> | YES if GAH /blog shipped | per audit |
| /ai | groundedai.help/work | YES if GAH /work shipped | per audit |
| /building | groundedai.help/building | YES if GAH /building shipped | per audit |
| /tools | campaign.help/resources/progressive-tools | YES (CH always live) | Plan B confirmed |
| /tools/<category> | campaign.help/resources/progressive-tools/<category> | YES (CH always live) | Plan B confirmed |
```

Save this to `personal/jordankrueger-site/docs/redirects-matrix-plan-c.md`. The Phase 5 redirect step uses this directly.

- [ ] **Step 3: Commit the matrix doc**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
git add docs/redirects-matrix-plan-c.md
git commit -m "docs: redirect matrix for Plan C launch"
```

---

## Phase 1: Pre-launch transparency email

**Send time:** AFTER Plan A and Plan B are confirmed live, BEFORE any subscriber-visible jordankrueger.com changes deploy. Wait 48–72 hours after this email before doing Phase 5+ to let unsubscribes settle.

### Task 1.1: Draft the transparency email

**Files:** Create `personal/jordankrueger-site/email-templates/mission-control-launch-001-body.html` (matches existing pattern at `email-templates/mission-control-001-body.html`)

- [ ] **Step 1: Read existing Mission Control template structure**

```bash
ls ~/ClaudeCode/personal/jordankrueger-site/email-templates/
cat ~/ClaudeCode/personal/jordankrueger-site/email-templates/mission-control-001-body.html | head -40
```

- [ ] **Step 2: Draft body HTML**

3 short paragraphs:

1. **What's changing:** "I'm launching a new brand, Grounded AI, focused on practical AI for mid-sized nonprofits and associations. Mission Control is moving there as the field-notes newsletter — same cadence, content shifting toward AI-for-orgs implementation stories."

2. **Why this matters to you:** "If that's the kind of thing you signed up for, no action needed — keep reading. If you signed up for something different (the AK Template, my personal blog, etc.) and don't want AI-focused notes, the unsubscribe link below is the right move."

3. **What's not changing:** "Mission Control still comes from me, written in my voice, with no AI hype, no spam, and no schedule pressure. I send it when I have something genuinely useful to share."

Plus standard Listmonk footer with unsubscribe link (already in template id 6).

- [ ] **Step 3: Run draft through `writing-voice` skill**

Iterate to match Jordan's voice — direct, no marketing-speak, ADHD-honest. The "I'd rather show you how something works than tell you what's possible" energy.

- [ ] **Step 4: Run through `humanizer` skill**

Remove any AI-generated patterns — em-dash overuse, rule of three, vague attributions, etc.

- [ ] **Step 5: Have Jordan personally review the final draft**

This is a customer-visible email. Jordan reads and approves before sending. Per Mission Control sending policy, NEVER send without explicit go-ahead.

- [ ] **Step 6: Commit draft**

```bash
git add email-templates/mission-control-launch-001-body.html
git commit -m "feat(mc): transparency email for GAH launch"
```

### Task 1.2: Test send to jordan@campaign.help only

Per CLAUDE.md Mission Control sending policy: NEVER send to the real list without explicit go-ahead. Test sends to jordan@campaign.help only.

- [ ] **Step 1: Create campaign in Listmonk admin (newsletter.campaign.help)**

Use template id 6 ("Mission Control"), body from `mission-control-launch-001-body.html`, subject something like "Mission Control is moving — read me before the next one lands", from "Jordan Krueger <jordan@jordankrueger.com>" (existing identity, NOT yet changed to GAH).

Set the campaign's recipient to a one-off "test" segment containing only `jordan@campaign.help`.

- [ ] **Step 2: Send test, verify delivery + rendering**

Verify:
- Email arrives at jordan@campaign.help
- Subject line renders correctly
- Body HTML renders correctly in Apple Mail / Gmail
- Unsubscribe link works
- All hyperlinks resolve (especially groundedai.help if mentioned)

- [ ] **Step 3: Commit campaign config (export from Listmonk if useful)**

Optional — can save the Listmonk campaign export as `email-templates/mc-launch-001-campaign-config.json` for reproducibility.

### Task 1.3: Send to real list (Jordan-approved, one-time)

**REQUIRES JORDAN'S EXPLICIT APPROVAL.** Do not auto-execute.

- [ ] **Step 1: Get Jordan's explicit go-ahead**

Confirm via direct message in session: "Ready to send the transparency email to the real Mission Control list (5 subscribers)?"

- [ ] **Step 2: Re-target the campaign to the real list (id 4)**

In Listmonk admin, change the recipient from the test segment back to "Mission Control" (id 4).

- [ ] **Step 3: Send**

- [ ] **Step 4: Monitor for unsubscribes over the next 48–72 hours**

Check Listmonk admin daily for the next ~3 days. Note any unsubscribes (you can see them but don't act on them).

- [ ] **Step 5: Hold for 48–72 hours before Phase 5+**

This gives subscribers time to read and decide. Do not deploy any subscriber-visible jordankrueger.com changes during this hold.

---

## Phase 2: jordankrueger.com homepage simplification (deploy held until launch window)

This phase prepares the changes but DOES NOT DEPLOY them until Phase 5 (coordinated launch). Work happens on a feature branch.

### Task 2.1: Create feature branch + start service grid update

**Files:** Modify `src/pages/index.astro`

- [ ] **Step 1: Create launch branch**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
git checkout -b gah-launch-simplify
```

- [ ] **Step 2: Modify service grid: 4 cards → 2 cards**

Edit `src/pages/index.astro` to:

- REMOVE: PasswordSetupHelp card
- REMOVE: Technology Coaching card
- REPLACE: "Learn AI" card → "Grounded AI" card pointing at `https://groundedai.help`
- KEEP: CampaignHelp card

```typescript
// New services array (replace existing 4-item array):
const services = [
  {
    title: 'CampaignHelp',
    description: 'IT and operations consulting for progressive nonprofits and advocacy organizations.',
    image: '/images/logo-campaignhelp.jpg',
    href: 'https://campaign.help',
  },
  {
    title: 'Grounded AI',
    description: 'Practical AI talks, workshops, and advisory for mid-sized nonprofits and associations.',
    image: '/images/logo-groundedai.jpg',  // NEW IMAGE — see step 3
    href: 'https://groundedai.help',
  },
];
```

Also update the services-grid CSS if needed (4-col grid → 2-col grid):

```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (max-width: 900px) {
  .services-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Source/create logo image for Grounded AI**

Place a logo image at `public/images/logo-groundedai.jpg` (or `.png`). Source: from Plan A's Claude Design output (the GAH wordmark/logo asset). Optimize: ≤500KB per CLAUDE.md asset hygiene rule.

```bash
# After Plan A, the GAH logo should be in business/groundedai/site/public/images/
# Copy to JK site:
cp ~/ClaudeCode/business/groundedai/site/public/images/logo-groundedai.jpg \
   ~/ClaudeCode/personal/jordankrueger-site/public/images/
# Verify size:
ls -la ~/ClaudeCode/personal/jordankrueger-site/public/images/logo-groundedai.jpg
# If >500KB, optimize with `cwebp` or imagemagick before committing
```

- [ ] **Step 4: Verify build + visual check on dev server**

```bash
npm run dev
# Visit http://jordans-mac-mini:4321
# Service grid now shows 2 cards: CampaignHelp + Grounded AI
```

- [ ] **Step 5: Commit (branch only, not deployed yet)**

```bash
git add src/pages/index.astro public/images/logo-groundedai.jpg
git commit -m "feat: service grid 2-card layout (CH + GAH)"
```

### Task 2.2: Remove AK Template panel from homepage

**Files:** Modify `src/pages/index.astro`

- [ ] **Step 1: Delete AK Template panel section**

Remove the entire `<!-- AK Template -->` panel block (between `<div class="panel-wrap">` and its closing `</div>`). This includes the video embed, the description, the form, and the panel-wrapping div.

- [ ] **Step 2: Remove unused styles**

Delete the `.ak-panel`, `.ak-template`, `.ak-video`, `.ak-text`, `.ak-form`, `.ak-form-status`, `.ak-form-status.success`, `.ak-form-status.error` CSS blocks (assuming no other components use them — verify with grep first).

```bash
grep -r "ak-panel\|ak-template\|ak-form" ~/ClaudeCode/personal/jordankrueger-site/src/ \
  | grep -v node_modules | grep -v "\.git"
# Expected after deletion: empty result
```

- [ ] **Step 3: Remove the AK form submission JavaScript**

Delete the `<script>` block that handles `form.ak-form` submissions.

- [ ] **Step 4: Visual + build check**

```bash
npm run dev
# Verify homepage no longer shows AK Template panel
npm run build
# Verify no build errors
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: remove AK Template panel from homepage (moved to campaign.help/resources/ak-template)"
```

### Task 2.3: Replace Mission Control signup forms with pointer

**Files:** Modify `src/pages/index.astro` (and `src/components/NewsletterSignup.astro` if it's used elsewhere)

- [ ] **Step 1: Decide: pointer copy vs. just remove**

Spec Section 5: "Replace with small 'Subscribe at groundedai.help' pointer (or remove entirely)." Recommended: a small pointer block is friendlier than nothing.

- [ ] **Step 2: Replace the inline NewsletterSignup component usages with pointer text**

In `src/pages/index.astro`, find:

```astro
<NewsletterSignup />
<!-- ... and the bottom variant -->
<NewsletterSignup variant="compact" id="subscribe-bottom" />
```

Replace with:

```astro
<section class="newsletter-pointer">
  <div class="container">
    <p>I send <a href="https://groundedai.help/#subscribe">Mission Control</a>, my newsletter on practical AI for nonprofits and associations. Subscribe at <a href="https://groundedai.help">groundedai.help</a>.</p>
  </div>
</section>
```

Add minimal styling that matches the rest of the page.

- [ ] **Step 3: Decide fate of NewsletterSignup.astro component**

If it's no longer used anywhere on jordankrueger.com:

```bash
grep -r "NewsletterSignup" ~/ClaudeCode/personal/jordankrueger-site/src/ | grep -v node_modules
# If empty → safe to delete
rm ~/ClaudeCode/personal/jordankrueger-site/src/components/NewsletterSignup.astro
```

- [ ] **Step 4: Visual + build check**

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/
git commit -m "feat: replace MC signup with pointer to groundedai.help"
```

---

## Phase 3: jordankrueger.com page deletions

### Task 3.1: Delete `/tools` page + content

**Files:** Delete `src/pages/tools.astro`, `src/content/tools/`

- [ ] **Step 1: Verify CH /resources/progressive-tools is live and serving the same content**

```bash
curl -s https://campaign.help/resources/progressive-tools/ | grep -i "actionkit\|advocacy\|deliverability" | head -5
# Expected: presence of category names — confirms content moved
```

- [ ] **Step 2: Delete `tools.astro` page**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
rm src/pages/tools.astro
```

- [ ] **Step 3: Delete `src/content/tools/` directory**

```bash
rm -rf src/content/tools/
```

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
# Expected: success — no references to deleted files
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete /tools page and content collection (moved to campaign.help/resources/progressive-tools)"
```

### Task 3.2: Delete `/ai` showcase page (or simplify)

**Files:** Delete `src/pages/ai.astro` IF the curated subset moved to GAH /work; otherwise simplify

- [ ] **Step 1: Re-read audit decisions**

Per `business/groundedai/docs/migration/project-audit.md`:
- If audit moved curated projects to GAH `/work` → DELETE `ai.astro`, set redirect to GAH `/work`
- If GAH `/work` did NOT ship (per spec conditional rule) → keep `ai.astro` simplified, audit content for what stays

- [ ] **Step 2: If GAH /work shipped: delete ai.astro**

```bash
rm src/pages/ai.astro
```

- [ ] **Step 3: If GAH /work did NOT ship: simplify ai.astro**

Remove projects that audit said RETIRE; keep projects that STAY on jordankrueger.com. The page may have fewer projects but should still render coherently.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete or simplify /ai showcase per audit"
```

### Task 3.3: Delete `/building` page (or simplify)

**Files:** Delete `src/pages/building.astro` IF GAH `/building` shipped; otherwise simplify

- [ ] **Step 1: Decide per audit (same as 3.2 logic)**

- [ ] **Step 2: Delete or simplify**

- [ ] **Step 3: Verify build + commit**

```bash
git add -A
git commit -m "feat: delete or simplify /building page per audit"
```

### Task 3.4: Delete moved blog posts

**Files:** Delete files from `src/content/posts/` that audit said MOVE

- [ ] **Step 1: Read post-audit.md MOVE-bucket list**

- [ ] **Step 2: Delete each MOVE post from JK site**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site/src/content/posts/
# For each MOVE-bucket post (per audit):
rm <slug>.mdx
```

- [ ] **Step 3: Verify build still passes**

The Astro content collection should re-index automatically. If any deleted post is still referenced (e.g., via the `claude-code` tag aggregation on a removed `/building` page), fix accordingly.

- [ ] **Step 4: Verify recent-posts section on homepage still works**

If after deletions there are <3 posts, the homepage section should hide gracefully (per spec: "Behavior-preserving — show 3 most recent if available; hide section if fewer than 3").

If the existing code shows the section unconditionally, modify to:

```astro
{posts.length >= 3 ? (
  <div class="posts-grid">
    {posts.map(...)}
  </div>
) : null}
<!-- Or: show fewer + a "see all" link if posts.length is 1-2 -->
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: delete blog posts moved to GAH per audit"
```

---

## Phase 4: about.astro copy + Schema.org update (deferred-deploy)

This phase prepares the about-page changes but defers deploy until after launch sequence is healthy.

### Task 4.1: Draft new About preview body for index.astro

**Files:** Modify `src/pages/index.astro` (the about preview block)

- [ ] **Step 1: Read existing about preview**

```bash
grep -A 8 "about-body" ~/ClaudeCode/personal/jordankrueger-site/src/pages/index.astro
```

Current copy:

> Hi, I'm Jordan. I run CampaignHelp, where I help progressive nonprofits and advocacy organizations stop wrestling with their technology — ActionKit, Google Workspace, tool migrations, workflow automation, and everything in between.

- [ ] **Step 2: Draft new copy mentioning both practices**

Per spec Section 5 copy guidance:

> Hi, I'm Jordan. I run **CampaignHelp** (helping progressive nonprofits and advocacy organizations stop wrestling with their technology) and **Grounded AI** (helping mid-sized nonprofits and associations turn scattered AI experiments into governed, staff-friendly workflows). 20 years in the progressive movement, 40+ shipped AI projects, and a deep belief that technology should serve missions, not the other way around.

- [ ] **Step 3: Run through `writing-voice` + `humanizer` skills**

- [ ] **Step 4: Update the preview block in index.astro**

- [ ] **Step 5: Update full /about page (`src/pages/about.astro`) similarly**

Add a section or paragraph mentioning Grounded AI alongside the existing CampaignHelp content. The Kurzweil hook stays primary on Jordan's full /about page if it's there; otherwise it's a Plan A /about page detail.

- [ ] **Step 6: Update Schema.org JSON-LD `worksFor` to include Grounded AI**

```javascript
// Updated schema:
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jordan Krueger",
  "url": "https://jordankrueger.com",
  "jobTitle": "Founder & CEO",
  "worksFor": [
    {
      "@type": "Organization",
      "name": "CampaignHelp",
      "url": "https://campaign.help"
    },
    {
      "@type": "Organization",
      "name": "Grounded AI",
      "url": "https://groundedai.help"
    }
  ],
  "sameAs": [
    "https://bsky.app/profile/jordankrueger.com",
    "https://www.linkedin.com/in/jordankrueger/"
  ]
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit (branch only)**

```bash
git add src/pages/index.astro src/pages/about.astro
git commit -m "feat: about copy + Schema.org JSON-LD mention CH + GAH"
```

---

## Phase 5: Cloudflare redirects setup

### Task 5.1: Create `_redirects` file with all gated redirects

**Files:** Create `public/_redirects`

Cloudflare Pages reads this file at deploy time and applies the rules. Each redirect uses 308 (permanent).

- [ ] **Step 1: Read redirect matrix from Phase 0.3**

```bash
cat ~/ClaudeCode/personal/jordankrueger-site/docs/redirects-matrix-plan-c.md
```

- [ ] **Step 2: Write `_redirects` file**

```
# /tools → CH /resources/progressive-tools (always-set; CH was deployed in Plan B)
/tools                                  https://campaign.help/resources/progressive-tools/  308
/tools/actionkit                        https://campaign.help/resources/progressive-tools/actionkit/  308
/tools/advocacy-campaigns               https://campaign.help/resources/progressive-tools/advocacy-campaigns/  308
/tools/deliverability                   https://campaign.help/resources/progressive-tools/deliverability/  308
/tools/language-style                   https://campaign.help/resources/progressive-tools/language-style/  308

# Conditional redirects (only set if GAH conditional pages shipped per audit):
# Uncomment/include each line ONLY IF the corresponding GAH page is live:

# /ai → GAH /work (only if GAH /work shipped)
# /ai                                   https://groundedai.help/work  308

# /building → GAH /building (only if GAH /building shipped)
# /building                             https://groundedai.help/building  308

# Per-slug blog post redirects (only if GAH /blog shipped AND post moved):
# Generate this list from post-audit.md MOVE-bucket entries:
# /blog/<slug-1>                        https://groundedai.help/blog/<slug-1>  308
# /blog/<slug-2>                        https://groundedai.help/blog/<slug-2>  308
# ... etc.
```

- [ ] **Step 3: Uncomment + populate the conditional redirects per audit decisions**

Edit `_redirects` to actually populate the conditional blocks based on what shipped.

- [ ] **Step 4: Validate the redirects file**

Cloudflare Pages will lint at deploy. For now, just visually inspect:

```bash
cat ~/ClaudeCode/personal/jordankrueger-site/public/_redirects
# Confirm no typos, all paths absolute or relative as appropriate, all 308 codes present
```

- [ ] **Step 5: Commit (branch only)**

```bash
git add public/_redirects
git commit -m "feat: Cloudflare redirects for moved content"
```

### Task 5.2: Test redirects locally before deploy

The `_redirects` file behavior depends on Cloudflare's runtime — local dev won't apply them. The right test is the CF Pages preview deploy.

- [ ] **Step 1: Push branch to trigger CF Pages preview**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
git push -u origin gah-launch-simplify
```

Cloudflare Pages will auto-create a preview URL like `gah-launch-simplify.<project>.pages.dev`.

- [ ] **Step 2: Test each redirect against the preview URL**

```bash
PREVIEW_URL="https://gah-launch-simplify.<project>.pages.dev"
for path in /tools /tools/actionkit /tools/deliverability; do
  echo -n "${path} → "
  curl -sI "${PREVIEW_URL}${path}" | grep -i "^location:"
done
# Expected: each shows Location: https://campaign.help/resources/progressive-tools[/<category>]/
```

- [ ] **Step 3: Test conditional redirects (only those shipping)**

```bash
# If /ai redirect was set:
curl -sI "${PREVIEW_URL}/ai" | grep -i "^location:"
# Expected: Location: https://groundedai.help/work
```

- [ ] **Step 4: If any redirect returns 200 instead of 308, fix `_redirects` and re-deploy**

**Rollback note:** if a redirect is wrong post-launch (wrong destination, infinite loop, etc.), recovery is a single-file revert + push. Cloudflare Pages re-applies `_redirects` on every deploy, so reverting the file and pushing main rolls the rules back in seconds. Keep a copy of the previous good `_redirects` (or git history) handy.

---

## Phase 6: Coordinated launch deploy

This is the actual launch — produces user-visible changes across all three sites.

**Pre-deploy checklist:**
- [ ] Phase 0 (verifications) complete
- [ ] Phase 1 (transparency email) sent + 48-72 hour hold complete
- [ ] Phases 2–5 changes committed on `gah-launch-simplify` branch
- [ ] Preview deploy of jordankrueger.com simplification verified
- [ ] Plan A and Plan B already in production

### Task 6.1: Merge jordankrueger.com simplification to main

- [ ] **Step 1: Confirm GitHub account is `jordankrueger`**

```bash
gh auth switch --user jordankrueger
gh auth status
```

- [ ] **Step 2: Open PR for review**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
gh pr create --title "GAH launch: simplify jordankrueger.com" --body "$(cat <<'EOF'
## Summary
- Service grid: 4 cards → 2 cards (CH + GAH only)
- Remove AK Template panel (moved to campaign.help/resources/ak-template)
- Replace Mission Control signup with pointer to groundedai.help
- Delete /tools page + content collection (moved to campaign.help/resources/progressive-tools)
- Delete /ai and /building pages per audit (curated content moved to GAH)
- Delete MOVE-bucket blog posts per audit
- Update About + Schema.org to mention both CH and GAH
- Add Cloudflare redirects for all moved paths

## Dependencies (must already be live)
- Plan A: https://groundedai.help live
- Plan B: https://campaign.help/resources/* live

## Test plan
- [ ] All redirects return 308 + correct Location header
- [ ] Homepage renders 2-card service grid
- [ ] /about copy mentions both practices
- [ ] No broken internal links
- [ ] Build succeeds without warnings

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Squash-merge after review**

```bash
gh pr merge --squash
```

- [ ] **Step 4: Verify CF Pages production deploy**

CF Pages auto-deploys on push to main. Wait for build to complete:

```bash
# Check most recent deploy:
curl -sI https://jordankrueger.com | head -3
# Expected: HTTP/2 200, fresh deployment
```

### Task 6.2: Smoke-test live jordankrueger.com

- [ ] **Step 1: Verify homepage**

```bash
curl -s https://jordankrueger.com/ | grep -E "Grounded AI|CampaignHelp" | head -5
# Expected: presence of both brands; no AK Template panel; no PasswordSetupHelp; no Coaching
```

- [ ] **Step 2: Verify all redirects fire correctly in production**

```bash
for path in /tools /tools/actionkit /tools/advocacy-campaigns /tools/deliverability /tools/language-style; do
  echo -n "${path} → "
  curl -sI "https://jordankrueger.com${path}" | grep -i "^location:"
done
# Expected: each → campaign.help/resources/progressive-tools[/<category>]/
```

- [ ] **Step 3: Verify conditional redirects (those that shipped)**

```bash
# Only the ones that actually shipped per audit:
# curl -sI https://jordankrueger.com/ai | grep -i location
# curl -sI https://jordankrueger.com/building | grep -i location
# curl -sI https://jordankrueger.com/blog/<slug> | grep -i location  (per moved post)
```

- [ ] **Step 4: Verify newsletter pointer renders correctly**

Open homepage in browser, scroll to where Mission Control signup used to be — should show a single line of text with link to groundedai.help.

### Task 6.3: Turn off coaching.jordankrueger.com Carrd

This is a manual step in the Carrd web UI (Jordan's account).

- [ ] **Step 1: Log into Carrd dashboard**

https://carrd.co — Jordan's existing account.

- [ ] **Step 2: Navigate to coaching.jordankrueger.com site**

- [ ] **Step 3: Disable / hide / unpublish the site**

Carrd's UI options vary; the goal is "no longer publicly accessible." If Carrd offers an "unpublish" option, use it. If not, change the published URL away from `coaching.jordankrueger.com`.

- [ ] **Step 4: Remove DNS record for `coaching.jordankrueger.com`**

In Cloudflare (personal CF account, since jordankrueger.com is on personal CF). Use `$PERSONAL_CLOUDFLARE_API_TOKEN`:

```bash
# Look up zone ID programmatically (no dashboard click-through needed):
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=jordankrueger.com" \
  -H "Authorization: Bearer ${PERSONAL_CLOUDFLARE_API_TOKEN}" | jq -r '.result[0].id')
echo "Zone ID: ${ZONE_ID}"

# Look up record ID for coaching subdomain:
RECORD_ID=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=coaching.jordankrueger.com" \
  -H "Authorization: Bearer ${PERSONAL_CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')
echo "Record ID: ${RECORD_ID}"

# Delete the record:
curl -X DELETE \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${PERSONAL_CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json"
```

- [ ] **Step 5: Verify subdomain no longer resolves**

```bash
dig +short coaching.jordankrueger.com
# Expected: no result OR NXDOMAIN
curl -sI https://coaching.jordankrueger.com 2>&1 | head -2
# Expected: cannot resolve / connection refused
```

### Task 6.4: Update Listmonk per-campaign From address to Grounded AI

This switches Mission Control's sender identity to Grounded AI. ALL future MC campaigns will be sent from this new identity.

- [ ] **Step 1: Verify GAH email mailbox is provisioned**

(Was done in Plan A Phase 0.) Verify:

```bash
# Send a test from Listmonk to confirm:
# In Listmonk admin, draft a tiny test campaign with from = "Jordan Krueger <jordan@groundedai.help>"
# Send to jordan@campaign.help only. Verify it arrives.
```

- [ ] **Step 2: Update Listmonk's default per-campaign From address (if any) to GAH**

In Listmonk admin → Settings → SMTP / Sender configuration. Change default From to:

```
From name: Jordan Krueger
From email: jordan@groundedai.help
```

OR if Listmonk uses per-campaign From rather than a default, just remember to set the new From on all future MC campaigns.

- [ ] **Step 3: Verify SPF/DKIM/DMARC for groundedai.help is correctly aligned**

```bash
# SPF (lives at the apex):
dig +short TXT groundedai.help | grep -i "v=spf1"

# DMARC (lives at _dmarc subdomain):
dig +short TXT _dmarc.groundedai.help | grep -i "v=DMARC1"

# DKIM (Migadu uses key1/key2/key3 selectors — verify all):
for sel in key1 key2 key3; do
  echo "--- ${sel}._domainkey ---"
  dig +short TXT ${sel}._domainkey.groundedai.help
done
```

Expected:
- SPF record includes Listmonk's send infrastructure (per existing setup at `claude-management/reference/email-infrastructure.md`)
- DMARC record present at `_dmarc.groundedai.help` (typically `v=DMARC1; p=quarantine; rua=mailto:...`)
- DKIM records present for at least one Migadu selector

This is essential to avoid deliverability problems with the new From address.

- [ ] **Step 4: Document the change in `personal/jordankrueger-site/CLAUDE.md`**

Update Mission Control section: "Sender identity: Jordan Krueger <jordan@groundedai.help> (changed during GAH launch on 2026-XX-XX)."

- [ ] **Step 5: Commit doc change**

```bash
cd ~/ClaudeCode/personal/jordankrueger-site
git checkout main
git add CLAUDE.md
git commit -m "docs: Mission Control sender identity now jordan@groundedai.help"
git push
```

---

## Phase 7: Post-launch verification

### Task 7.1: Cross-site smoke tests

- [ ] **Step 1: All three sites respond with 200**

```bash
for url in https://jordankrueger.com https://campaign.help https://groundedai.help; do
  echo -n "${url}: "
  curl -s -o /dev/null -w "%{http_code}\n" "${url}"
done
# Expected: all 200
```

- [ ] **Step 2: All redirects work from jordankrueger.com**

(Verified in Phase 6.2; re-confirm 24 hours later for cache propagation.)

- [ ] **Step 3: All forms work**

- jordankrueger.com (no forms now — newsletter pointer only)
- campaign.help/resources/ak-template form → Listmonk + transactional email
- groundedai.help newsletter signup → Listmonk
- groundedai.help contact form → Resend

- [ ] **Step 4: Coaching subdomain truly off**

```bash
dig +short coaching.jordankrueger.com
# Expected: empty / NXDOMAIN
```

### Task 7.2: Send first GAH-branded Mission Control campaign

This validates the new sender identity in production.

- [ ] **Step 1: Wait until enough new content exists**

The N8N auto-draft workflow (`7xsz8xvMCQKyiIeR`) fires Friday 7:30am ET when ≥2 new posts have accumulated. If GAH's blog is shipping new content, this will draft naturally.

If no auto-draft is generated within 2 weeks of launch, manually create a "first GAH issue" Mission Control campaign with a brief "Welcome to the new Mission Control" intro.

- [ ] **Step 2: Test send to jordan@campaign.help only**

Per Mission Control sending policy.

- [ ] **Step 3: Get Jordan's explicit go-ahead**

Confirm in session: "Ready to send the first GAH-branded MC campaign to the real list?"

- [ ] **Step 4: Send to real list**

- [ ] **Step 5: Monitor deliverability for 24 hours**

Check bounces, complaints, opens (if Listmonk tracks). New From address may have a slight reputation hit — should recover within a few sends.

### Task 7.3: 30-day post-launch review

Schedule via Drift (one-time task, due 30 days post-launch):

- [ ] All redirects still work (no link rot)
- [ ] Mission Control unsub rate is acceptable (5 subscribers is small; even 1 unsub = 20%)
- [ ] No broken inbound links from social/etc. that haven't been redirected
- [ ] GA4 analytics on all three sites is firing
- [ ] Search Console shows GAH and CH /resources pages indexed
- [ ] No Cloudflare error rate spikes

---

## Phase 8: Drift tasks for ongoing follow-ups

Created at the END of Phase 7, after launch is confirmed healthy:

| Task | Project | Due |
|---|---|---|
| 30-day post-launch review (Phase 7.3 checklist) | GAH Launch | 30 days post-launch |
| Decide: do PasswordSetupHelp sunset or keep alive | Personal | 90 days post-launch |
| 90-day review: Mission Control growth + CH /resources traffic | GAH Launch | 90 days post-launch |
| 6-month review: decide CH-specific newsletter | CH | 6 months post-launch |
| Submit ASAE Annual Meeting CFP | GAH | (next CFP open date) |
| Cut speaker reel | GAH | 90 days post-launch |
| First GAH talk on a real stage | GAH | 6 months post-launch |
| Post-launch social-content announcement on LinkedIn + BlueSky (use `social-content` skill) | GAH Launch | Day 1 post-launch |

---

## Skills Reference Summary

| When | Skill | Path |
|---|---|---|
| Transparency email + about copy | `writing-voice` + `humanizer` | (built-in) |
| Verifying live before claiming done | `superpowers:verification-before-completion` | (built-in) |
| Cross-site launch orchestration | `launch-strategy` | `business/campaignhelp/marketingskills/skills/launch-strategy/SKILL.md` |
| Post-launch announcement | `social-content` | `business/campaignhelp/marketingskills/skills/social-content/SKILL.md` |

---

## Verification Before Completion

Before declaring Plan C complete:

- [ ] Plan A is live (verified in Phase 0.1)
- [ ] Plan B is live (verified in Phase 0.2)
- [ ] Mission Control transparency email sent to real list (Phase 1.3)
- [ ] 48-72 hour hold elapsed before Phase 5+ deploys
- [ ] jordankrueger.com homepage shows 2-card service grid (CH + GAH)
- [ ] AK Template panel removed from jordankrueger.com
- [ ] /tools, /ai, /building pages deleted from jordankrueger.com (or simplified per audit)
- [ ] All MOVE-bucket blog posts deleted from jordankrueger.com
- [ ] All redirects from jordankrueger.com → CH or GAH return 308 with correct Location
- [ ] Mission Control signup pointer (not form) on jordankrueger.com homepage
- [ ] About preview body mentions both CH and GAH
- [ ] Schema.org JSON-LD includes both `worksFor` orgs
- [ ] coaching.jordankrueger.com Carrd off + DNS record removed
- [ ] Listmonk per-campaign From address updated to `jordan@groundedai.help`
- [ ] First GAH-branded Mission Control campaign sent successfully (Phase 7.2)
- [ ] Drift tasks for 30/90/180-day reviews created
- [ ] CLAUDE.md files updated (jordankrueger-site, business/groundedai, business/campaignhelp)
- [ ] No broken internal/external links across any site
- [ ] All three Cloudflare deploys are stable; no error rate spikes
