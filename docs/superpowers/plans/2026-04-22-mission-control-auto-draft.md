# Mission Control Auto-Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a weekly N8N workflow on CH that auto-drafts a Mission Control campaign in Listmonk when ≥2 new blog posts have published since the last MC send, and creates a Drift review task for Jordan with a Monday due date.

**Architecture:** Single linear N8N workflow on `n8n.campaign.help`. Cursor = most-recent finished MC campaign's `sent_at`. Source = `jordankrueger.com/rss.xml`. Output = Listmonk draft campaign (never auto-sent) + Drift task. No workflow-owned state. Mac-Mini-hosted Drift is reached from the N8N Docker container over Tailscale (`http://jordans-mac-mini:3001`); Task 0 validates reachability before the rest of the plan commits to it.

**Tech Stack:** N8N (CH), Astro RSS, Listmonk API, Drift API, Resend (failure alerts), Tailscale (private networking).

**Spec:** `personal/jordankrueger-site/docs/superpowers/specs/2026-04-22-mission-control-auto-draft-design.md`

---

## File Structure

| Path | Action | Purpose |
|---|---|---|
| `personal/jordankrueger-site/src/pages/rss.xml.js` | modify | Emit `<coverImage>` per item so the workflow can render post cards without scraping pages |
| `personal/automation-strategy/mission-control-auto-draft-workflow.json` | create | Workflow export for version control (mirrors `weekly-content-sprint-workflow.json`) |
| `personal/automation-strategy/CLAUDE.md` | modify | Add "Mission Control Auto-Draft" entry under Implemented Automations |
| `personal/jordankrueger-site/CLAUDE.md` | modify | Cross-reference the auto-draft workflow under the Mission Control Newsletter section |
| N8N CH instance | deploy | Live workflow created/updated via `mcp__n8n-ch__n8n_*` MCP tools |

---

## Phase 0 — Preflight

### Task 0: Verify Drift reachability from N8N CH

**Files:** none (connectivity check only)

The existing Drift integration (`weekly-content-sprint.py`) runs on Mac Mini and hits `http://localhost:3001`. For this workflow to call Drift from the N8N CH container, we need confirmed reachability over Tailscale.

- [ ] **Step 1: Confirm `ch-vps` is on the same tailnet as `jordans-mac-mini`**

```bash
tailscale status | grep -E 'ch-vps|jordans-mac-mini'
```

Expected: both hosts listed with 100.x addresses.

- [ ] **Step 2: From the N8N container on CH, curl the Drift healthcheck**

```bash
ssh ch-vps 'docker exec $(docker ps --filter name=n8n --format "{{.Names}}" | head -1) \
  wget -q -O- --timeout=5 http://jordans-mac-mini:3001/api/tasks 2>&1 | head -c 200'
```

Expected: JSON response (possibly empty array or auth error, but NOT a timeout/DNS failure). If this works, direct calls from the workflow will work.

- [ ] **Step 3: If the curl fails → decide fallback**

Failure modes and responses:
- **DNS resolution fails** → the N8N container has no Tailscale DNS. Fallback: use Mac Mini's Tailscale IP directly (`100.118.178.64:3001`). Retry Step 2 with the IP.
- **Timeout** → likely Docker network isolation. Fallback: run a tiny Mac Mini cron (separate mini-plan) that polls Listmonk for auto-drafted campaigns and creates Drift tasks locally. If this path is needed, STOP — surface to Jordan for a scope decision.
- **Drift API requires auth** → note the auth method (likely none for localhost but may differ over network). Capture in Step 4.

- [ ] **Step 4: Capture the working Drift base URL and auth pattern**

Record for use in Task 9:
- Drift base URL (likely `http://jordans-mac-mini:3001` or `http://100.118.178.64:3001`)
- Auth header (if any)
- Successful POST shape (ref: `personal/automation-strategy/weekly-content-sprint.py:176-196`)

No commit for Task 0 — it's reconnaissance.

---

## Phase A — RSS feed: add cover image

### Task 1: Emit `<coverImage>` in RSS

**Files:**
- Modify: `personal/jordankrueger-site/src/pages/rss.xml.js`

The current RSS config does not include cover images. Workflow needs absolute image URLs for post cards.

- [ ] **Step 1: Modify the `items.map` to include `customData`**

Replace the map callback in `src/pages/rss.xml.js` with:

```js
const items = await Promise.all(posts.map(async (post) => {
  const { Content } = await render(post);
  const coverAbs = post.data.coverImage
    ? new URL(post.data.coverImage, context.site).toString()
    : null;
  return {
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    link: `/blog/${post.id}/`,
    content: post.body,
    customData: coverAbs
      ? `<coverImage>${coverAbs}</coverImage>`
      : '',
  };
}));
```

- [ ] **Step 2: Build locally**

```bash
cd /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site
npm run build
```

Expected: build succeeds, no new warnings.

- [ ] **Step 3: Verify RSS output contains cover images**

```bash
grep -c '<coverImage>https' /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site/dist/rss.xml
```

Expected: count ≥ 5 (most recent posts have cover images). Confirm absolute URLs (start with `https://jordankrueger.com/`).

- [ ] **Step 4: Commit and push**

```bash
cd /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site
git add src/pages/rss.xml.js
git commit -m "Include coverImage in RSS items for Mission Control auto-draft workflow"
git push origin main
```

- [ ] **Step 5: Verify production RSS**

Wait ~2 min for Cloudflare Pages deploy, then:

```bash
curl -s https://jordankrueger.com/rss.xml | grep -c '<coverImage>'
```

Expected: matches local count. If 0, the deploy hasn't finished — retry after a minute.

---

## Phase B — N8N workflow

Workflow is built iteratively in the N8N CH admin UI (or via `mcp__n8n-ch__n8n_create_workflow` / `n8n_update_partial_workflow`). Each task adds a node group, then the workflow JSON is exported to `personal/automation-strategy/` and committed.

### Task 2: Create workflow shell (triggers + shared config)

**Files:**
- N8N CH: create new workflow (inactive)
- Create: `personal/automation-strategy/mission-control-auto-draft-workflow.json` (export after this task)

- [ ] **Step 1: Create empty inactive workflow**

Use `mcp__n8n-ch__n8n_create_workflow`:
- Name: `Mission Control Auto-Draft`
- Tags: `mission-control`, `auto-drafted`
- Active: `false`

- [ ] **Step 2: Add Schedule Trigger (Friday 7:30am ET)**

Check instance timezone first (`mcp__n8n-ch__n8n_health_check` or workflow settings). If UTC, cron = `30 11 * * 5` during US DST (2026-04-22 is DST). Annotate the node with a sticky note: "Friday 07:30 ET = 11:30 UTC (DST) / 12:30 UTC (standard). Review on DST changes."

- [ ] **Step 3: Add Manual Trigger "Test Run"**

Default payload:

```json
{ "dry_run": true }
```

- [ ] **Step 4: Add Set node "Config"**

Merges both triggers into a common shape:

```json
{
  "dry_run": "={{ $json.dry_run ?? false }}",
  "rss_url": "https://jordankrueger.com/rss.xml",
  "listmonk_base": "http://listmonk-app:9000",
  "listmonk_list_id": 4,
  "listmonk_template_id": 6,
  "from_email": "Jordan Krueger <jordan@jordankrueger.com>",
  "admin_url_base": "https://newsletter.campaign.help/admin/campaigns",
  "drift_base": "<value from Task 0 Step 4>",
  "alert_email": "jordan@campaign.help",
  "fallback_window_days": 14
}
```

- [ ] **Step 5: Export + commit workflow JSON**

```bash
# Use mcp__n8n-ch__n8n_get_workflow to fetch JSON, save to:
# personal/automation-strategy/mission-control-auto-draft-workflow.json
cd /Users/jordankrueger/ClaudeCode/personal/automation-strategy
git add mission-control-auto-draft-workflow.json
git commit -m "Add Mission Control auto-draft workflow shell"
```

### Task 3: Fetch + parse RSS

**Files:** N8N workflow

- [ ] **Step 1: Add HTTP Request "Fetch RSS"**

- Method: GET
- URL: `={{ $json.rss_url }}`
- Response format: String
- Timeout: 15000ms
- Retry: 2 attempts, 10s delay

- [ ] **Step 2: Add XML node "Parse RSS"**

Input: body from previous node. Option: `explicitArray: false`.

- [ ] **Step 3: Add Code node "Normalize Items"**

```js
const channel = $input.first().json.rss?.channel;
if (!channel) throw new Error('RSS parse returned no channel');
const items = Array.isArray(channel.item) ? channel.item : [channel.item];
return items.map(it => {
  const title = typeof it.title === 'string' ? it.title : it.title?._;
  const description = typeof it.description === 'string' ? it.description : it.description?._;
  return {
    json: {
      title,
      description,
      link: it.link,
      pubDateISO: new Date(it.pubDate).toISOString(),
      coverImage: it.coverImage || null,
    }
  };
});
```

- [ ] **Step 4: Test manually**

Fire the Manual Trigger. Inspect Code node output — expect 10+ items, newest first, all with `pubDateISO` parseable and most with `coverImage` set to an `https://jordankrueger.com/...` URL.

- [ ] **Step 5: Export + commit**

Commit message: `Add RSS fetch + parse to MC auto-draft workflow`.

### Task 4: Fetch last finished MC campaign (cursor)

**Files:** N8N workflow

- [ ] **Step 1: Add HTTP Request "Last MC Campaign"**

- Method: GET
- URL (wrap the whole URL in a single `=` expression — N8N dislikes mixed literal/expression syntax in URL fields):

  ```
  ={{ $('Config').first().json.listmonk_base + '/api/campaigns?list_id=' + $('Config').first().json.listmonk_list_id + '&status=finished&order_by=created_at&order=desc&per_page=1' }}
  ```

- Auth: Basic. Username `admin`, password `={{ $env.LISTMONK_ADMIN_PASSWORD }}`.
- Response format: JSON
- Continue on fail: ON (error handling in next node)

**Apply the same single-`=`-expression pattern** to all Listmonk URLs in Tasks 5 and 8.

- [ ] **Step 2: Add Code node "Resolve cursor"**

```js
const config = $('Config').first().json;
const resp = $input.first().json;
const results = resp?.data?.results ?? [];
let cursorISO;
let usedFallback = false;

if (results.length > 0 && results[0].sent_at) {
  cursorISO = new Date(results[0].sent_at).toISOString();
} else {
  // 14-day fallback
  cursorISO = new Date(Date.now() - config.fallback_window_days * 86400000).toISOString();
  usedFallback = true;
}

const nextCampaignNumber = (resp?.data?.total ?? results.length) + 1;

return [{
  json: {
    cursorISO,
    usedFallback,
    nextCampaignNumber,
  }
}];
```

- [ ] **Step 3: Export + commit**

Commit message: `Add Listmonk cursor resolution to MC auto-draft workflow`.

### Task 5: Pending-draft guard

**Files:** N8N workflow

- [ ] **Step 1: Add HTTP Request "Pending MC Drafts"**

- Method: GET
- URL: `={{ $('Config').first().json.listmonk_base }}/api/campaigns?list_id={{ $('Config').first().json.listmonk_list_id }}&status=draft&per_page=50`
- Auth: Basic (same as Task 4)

*Note:* Listmonk's `status` query param takes one value; also check `status=scheduled` in a parallel request OR use a separate call. Simpler: make one call for each, then union results in a Code node. For now, do two HTTP calls — `draft` and `scheduled`.

- [ ] **Step 2: Add second HTTP Request "Pending MC Scheduled"**

Same as Step 1 but `status=scheduled`.

- [ ] **Step 3: Add Code node "Check pending"**

```js
const draft = $('Pending MC Drafts').first().json?.data?.results ?? [];
const scheduled = $('Pending MC Scheduled').first().json?.data?.results ?? [];
const pending = [...draft, ...scheduled].filter(c => Array.isArray(c.lists) && c.lists.some(l => l.id === $('Config').first().json.listmonk_list_id));
return [{
  json: {
    pendingCount: pending.length,
    pendingIds: pending.map(c => c.id),
    shouldSkip: pending.length > 0,
  }
}];
```

- [ ] **Step 4: Add IF node "Skip on pending draft"**

- Condition: `={{ $json.shouldSkip }}` equals `true`
- True branch → "Log skip and exit" (NoOp + sticky note: "Exited: pending MC draft already exists")
- False branch → continues to Task 6

- [ ] **Step 5: Export + commit**

Commit message: `Add pending-draft guard to MC auto-draft workflow`.

### Task 6: Filter new items + count check

**Files:** N8N workflow

- [ ] **Step 1: Add Code node "Filter & Count"**

```js
const cursorISO = $('Resolve cursor').first().json.cursorISO;
const items = $('Normalize Items').all().map(n => n.json);
const newItems = items
  .filter(i => i.pubDateISO > cursorISO)
  .sort((a, b) => b.pubDateISO.localeCompare(a.pubDateISO));

return [{
  json: {
    newItems,
    count: newItems.length,
    enoughToSend: newItems.length >= 2,
  }
}];
```

- [ ] **Step 2: Add IF node "Enough posts?"**

- Condition: `={{ $json.enoughToSend }}` equals `true`
- True → continue
- False → NoOp + sticky note: "Exited: fewer than 2 new posts since last send"

- [ ] **Step 3: Export + commit**

Commit message: `Add filter and count-check to MC auto-draft workflow`.

### Task 7: Build campaign HTML body

**Files:** N8N workflow

- [ ] **Step 1: Add Code node "Build Campaign"**

```js
const { newItems, count } = $('Filter & Count').first().json;
const { nextCampaignNumber } = $('Resolve cursor').first().json;
const n = String(nextCampaignNumber).padStart(3, '0');

const intro = count === 1
  ? 'One new post since the last update.'
  : `${count} new posts since the last update.`;

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const card = item => `
  <div style="margin:0 0 28px;">
    ${item.coverImage ? `<a href="${esc(item.link)}"><img src="${esc(item.coverImage)}" alt="" style="width:100%;max-width:560px;height:auto;display:block;border-radius:8px;margin:0 0 12px;"/></a>` : ''}
    <h2 style="margin:0 0 6px;font-family:Lora,Georgia,serif;font-size:20px;line-height:1.3;">
      <a href="${esc(item.link)}" style="color:#AF4C2A;text-decoration:none;">${esc(item.title)}</a>
    </h2>
    <p style="margin:0 0 8px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;line-height:1.5;color:#5C5248;">
      ${esc(item.description)}
    </p>
    <p style="margin:0;"><a href="${esc(item.link)}" style="color:#AF4C2A;font-family:'DM Sans',Arial,sans-serif;font-size:14px;">Read the post →</a></p>
  </div>
`;

const body = `
  <p style="margin:0 0 24px;font-family:'DM Sans',Arial,sans-serif;font-size:16px;line-height:1.5;color:#5C5248;">${esc(intro)}</p>
  ${newItems.map(card).join('\n')}
`;

return [{
  json: {
    name: `Mission Control ${n}`,
    subject: `Mission Control: ${newItems[0].title}`,
    body,
    campaignNumberPadded: n,
    count,
    postTitles: newItems.map(i => i.title),
  }
}];
```

Notes:
- This produces the INNER body HTML that Listmonk template id 6 wraps. If the template expects raw HTML passed via `{{ .Body }}`, no further change needed. Verify when creating the test campaign in Task 8.
- Keep inline styles only (email clients strip `<style>`).
- **Description escaping caveat:** Astro RSS descriptions may already be HTML (from the `description` frontmatter — which is usually plain text, but verify). If the first live test (Task 8 Step 4) shows literal `&lt;p&gt;` in the rendered email, swap `${esc(item.description)}` for `${item.description}`. Title and link remain escaped.

- [ ] **Step 2: Export + commit**

Commit message: `Build HTML body node for MC auto-draft workflow`.

### Task 8: Create Listmonk draft campaign

**Files:** N8N workflow

- [ ] **Step 1: Add IF node "Dry run?"**

- Condition: `={{ $('Config').first().json.dry_run }}` equals `true`
- True → NoOp "Dry run logged" (end of flow with sticky note summarizing the built campaign for inspection)
- False → continue to Step 2

- [ ] **Step 2: Add HTTP Request "Create Draft Campaign"**

- Method: POST
- URL: `={{ $('Config').first().json.listmonk_base }}/api/campaigns`
- Auth: Basic (same as Task 4)
- Body (JSON):

```json
{
  "name": "={{ $('Build Campaign').first().json.name }}",
  "subject": "={{ $('Build Campaign').first().json.subject }}",
  "lists": [4],
  "from_email": "={{ $('Config').first().json.from_email }}",
  "template_id": 6,
  "content_type": "html",
  "type": "regular",
  "body": "={{ $('Build Campaign').first().json.body }}",
  "tags": ["mission-control", "auto-drafted"]
}
```

*Listmonk behavior:* `POST /api/campaigns` creates in `draft` status by default. Do NOT set `status` explicitly — keeps it draft.

- [ ] **Step 3: Capture campaign ID**

Add Set node "Extract ID":

```
campaignId = {{ $json.data.id }}
adminUrl = {{ $('Config').first().json.admin_url_base }}/{{ $json.data.id }}
```

- [ ] **Step 4: First live test**

Temporarily run the Manual Trigger with `dry_run: false` once. Inspect:
- New campaign appears in Listmonk admin at newsletter.campaign.help/admin/campaigns
- Status = draft (NOT scheduled, NOT sent)
- From = Jordan Krueger
- Body renders the templated intro + post cards
- Template id 6 wraps correctly

Delete the test campaign after inspection.

- [ ] **Step 5: Export + commit**

Commit message: `Add Listmonk draft creation to MC auto-draft workflow`.

### Task 9: Create Drift task

**Files:** N8N workflow

- [ ] **Step 1: Add Code node "Drift task payload"**

Computes due date (next Monday) and task body:

```js
const cfg = $('Config').first().json;
const camp = $('Build Campaign').first().json;
const ext = $('Extract ID').first().json;

function nextMonday(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri
  const delta = (1 + 7 - day) % 7 || 7; // always strictly next Monday
  d.setDate(d.getDate() + delta);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const bullets = camp.postTitles.map(t => `- ${t}`).join('\n');
const notes = `Draft campaign ready for review: ${ext.adminUrl}\n\nPosts covered:\n${bullets}\n\nReview checklist:\n- Run humanizer + writing-voice passes on body HTML\n- Verify subject and campaign name\n- Send from Listmonk admin`;

return [{
  json: {
    title: `Review + send Mission Control ${camp.campaignNumberPadded} (${camp.count} posts)`,
    notes,
    due_date: nextMonday(),
    flagged: false,
    energy: 'low',
    task_type: 'admin',
  }
}];
```

Reference payload shape from `personal/automation-strategy/weekly-content-sprint.py:176-196`. Confirm Drift's field names match by reading that file first.

- [ ] **Step 2: Add HTTP Request "Create Drift Task"**

- Method: POST
- URL: `={{ $('Config').first().json.drift_base + '/api/tasks' }}`
- Body Content Type: JSON
- Specify Body: "Using Fields Below" (map each field from the previous node) OR "Using JSON" with a literal template referencing `$('Drift task payload').first().json.<field>`. Do NOT pass `={{ $('Drift task payload').first().json }}` as the raw body — N8N serializes it oddly.
- Continue on fail: ON
- Retry: 2 attempts, 5s delay

- [ ] **Step 3: Add IF node "Drift succeeded?"**

- Condition: node output has no `error` key AND `$json.id` exists (successful Drift create returns the new task with an `id` field — see `weekly-content-sprint.py` for the expected response shape)
- False → goto Task 10's fallback-alert branch

- [ ] **Step 4: Live test**

Run Manual Trigger with `dry_run: false` again. Confirm:
- Drift task appears in the Personal project
- Due date = next Monday 9am
- Description contains the admin URL and post titles

Delete both the test Listmonk draft and the test Drift task afterwards.

- [ ] **Step 5: Export + commit**

Commit message: `Add Drift task creation to MC auto-draft workflow`.

### Task 10: Error handling + Resend alerts

**Files:** N8N workflow

- [ ] **Step 1: Add HTTP Request "Resend Alert"**

Used by multiple error paths.

- Method: POST
- URL: `https://api.resend.com/emails`
- Auth header: `Authorization: Bearer {{ $env.RESEND_API_KEY }}`
- Body:

```json
{
  "from": "MC Auto-Draft <alerts@campaign.help>",
  "to": "={{ $('Config').first().json.alert_email }}",
  "subject": "={{ '[MC auto-draft] ' + $json.status }}",
  "text": "={{ $json.detail }}"
}
```

- [ ] **Step 2: Wire failure branches**

Add Set nodes (one per failure mode) that feed into "Resend Alert":

| Source node | `status` | `detail` |
|---|---|---|
| RSS fetch fail | `rss-fetch-failed` | Error message + URL |
| Listmonk cursor fail (if `usedFallback=true`) | `cursor-fallback-used` | "14-day window applied; check Listmonk list 4 state" |
| Create campaign fail | `campaign-create-failed` | Error message + body preview |
| Drift fail | `drift-failed` | "Campaign draft {{ adminUrl }} created but Drift task did not. Review manually." |

- [ ] **Step 3: Confirm the `cursor-fallback-used` branch is advisory, not blocking**

That alert is informational — workflow continues to Task 6 filter. Do NOT return early from fallback.

- [ ] **Step 4: Export + commit**

Commit message: `Add Resend alert fallbacks to MC auto-draft workflow`.

---

## Phase C — Testing

### Task 11: Dry-run validation

**Files:** N8N workflow (no edits, execution only)

- [ ] **Step 1: Dry-run with current Listmonk state**

Run Manual Trigger with `dry_run: true`. Inspect the execution log:
- `Resolve cursor` output shows the sent_at of Campaign 001 (2026-04-21)
- `Filter & Count` output includes any posts from after 2026-04-21
- If `count < 2`, "Enough posts?" exits cleanly. This is expected — Campaign 001 just sent yesterday.
- No Listmonk create, no Drift create (dry_run blocks them).

- [ ] **Step 2: Dry-run with synthetic old cursor**

Temporarily replace the `Resolve cursor` Code node output with a fixed cursor from 2026-03-01 (paste directly via N8N's "Edit output" feature, or add a temporary override). Re-run.

Expected: `Filter & Count` returns all posts since March 1 (likely 5+). `Build Campaign` generates realistic HTML. Inspect the `body` field — confirm intro pluralization, post cards render with cover images.

Revert the override after inspection.

### Task 12: Pending-draft guard test

- [ ] **Step 1: Create a manual draft in Listmonk admin**

In the Listmonk UI, create a throwaway campaign on list 4 with status `draft`. Name it "TEST — delete me."

- [ ] **Step 2: Run Manual Trigger with `dry_run: true`**

Expected: "Skip on pending draft" IF fires. Workflow exits cleanly with `pendingCount >= 1`. No further nodes execute.

- [ ] **Step 3: Delete the test draft from Listmonk admin**

### Task 13: Live end-to-end test

- [ ] **Step 1: Temporarily lower the threshold**

Edit Task 6's Code node temporarily: change `i.pubDateISO > cursorISO` to `true` (accept all items) and `enoughToSend: true`.

- [ ] **Step 2: Run Manual Trigger with `dry_run: false`**

Expected:
- Listmonk has a new draft "Mission Control 002" (or whatever `nextCampaignNumber` resolves to).
- Drift has a new task "Review + send Mission Control 00X..." with Monday due date.
- No Resend alert email.

- [ ] **Step 3: Inspect the draft in Listmonk admin UI**

- Subject + from address correct
- Body HTML renders (use Listmonk's preview feature)
- Template id 6 wrapping is intact

- [ ] **Step 4: Cleanup**

- Delete the test Listmonk draft
- Delete the test Drift task
- Revert the Task 6 threshold edit

- [ ] **Step 5: Re-export workflow JSON + commit**

Commit message: `Finalize MC auto-draft workflow after end-to-end test`.

---

## Phase D — Activation + docs

### Task 14: Activate workflow

**Files:** N8N CH

- [ ] **Step 1: Activate the Schedule Trigger**

Use `mcp__n8n-ch__n8n_update_partial_workflow` to set `active: true` on the workflow.

- [ ] **Step 2: Confirm next execution time**

Query `mcp__n8n-ch__n8n_get_workflow` — verify `nextExecutionAt` resolves to the upcoming Friday 07:30 ET (= 11:30 UTC during DST).

### Task 15: Document in automation-strategy

**Files:** `personal/automation-strategy/CLAUDE.md`

- [ ] **Step 1: Add "Mission Control Auto-Draft" entry under Implemented Automations**

Follow the format used by "Weekly Content Sprint." Include:
- Schedule and cadence
- Workflow ID
- Data flow (RSS → Listmonk → Drift)
- Files: workflow JSON path, spec path, plan path
- Skip rules (< 2 posts, pending draft)
- Error handling (Resend alerts)
- Review gate (Jordan sends manually from Listmonk admin)

- [ ] **Step 2: Commit**

```bash
cd /Users/jordankrueger/ClaudeCode
git add personal/automation-strategy/CLAUDE.md
git commit -m "Document MC auto-draft automation"
```

### Task 16: Cross-reference in jordankrueger-site CLAUDE.md

**Files:** `personal/jordankrueger-site/CLAUDE.md`

- [ ] **Step 1: Add a line under "## Mission Control Newsletter"**

After the existing "Humanizer gate" line, add:

```markdown
- **Auto-draft workflow:** Weekly (Fri 7:30am ET) on N8N CH. Creates Listmonk draft + Drift review task when ≥2 new posts accumulated. See `personal/automation-strategy/CLAUDE.md` → Mission Control Auto-Draft.
```

- [ ] **Step 2: Commit and push**

```bash
cd /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site
git add CLAUDE.md
git commit -m "Reference MC auto-draft workflow"
git push origin main
```

---

## Rollback plan

If the workflow misbehaves after activation:

1. **Immediate stop:** `mcp__n8n-ch__n8n_update_partial_workflow` → `active: false`
2. **Clean up unwanted drafts:** delete via Listmonk admin UI (campaigns list, filter by tag `auto-drafted`)
3. **Clean up Drift tasks:** delete the review task from Drift
4. **Safety net:** because workflow never sets `status=sent` or `status=scheduled`, even a runaway execution cannot deliver email to subscribers. The subscriber-safety rule in `jordankrueger-site/CLAUDE.md` is preserved structurally.

---

## Done criteria

- [ ] RSS feed serves `<coverImage>` on production
- [ ] Workflow JSON committed to `personal/automation-strategy/`
- [ ] Workflow active on N8N CH with correct cron
- [ ] Dry-run, skip-rule, pending-draft, and live tests all pass
- [ ] CLAUDE.md entries in both repos document the automation
- [ ] First real Friday run produces either a clean "< 2 posts" skip OR a working draft + Drift task
