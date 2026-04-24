# Site redesign implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh jordankrueger.com's visual design with layout variety, scroll animations, better typography, and atmospheric polish — without changing content or site identity.

**Architecture:** CSS-first changes to an existing Astro static site. No new dependencies beyond font files. Scroll animations use a vanilla IntersectionObserver script. All changes are to `.astro` components/pages and CSS files.

**Tech Stack:** Astro (static), CSS custom properties, self-hosted woff2 fonts, vanilla JS (IntersectionObserver)

**Spec:** `docs/superpowers/specs/2026-04-09-site-redesign-design.md`

**Dev server:** `npm run dev` from project root, accessible at `http://jordans-mac-mini:4321`

---

### Task 1: Typography swap — replace Poppins with DM Sans

**Files:**
- Create: `public/fonts/dm-sans-400.woff2`, `dm-sans-400-italic.woff2`, `dm-sans-500.woff2`, `dm-sans-600.woff2`, `dm-sans-600-italic.woff2`, `dm-sans-700.woff2`
- Modify: `src/styles/fonts.css`
- Modify: `src/styles/global.css:18` (the `--font-body` variable)
- Modify: `src/layouts/BaseLayout.astro:54` (font preload)
- Delete: all `public/fonts/poppins-*.woff2` files (10 files)

- [ ] **Step 1: Download DM Sans woff2 files**

Use fontsource to get the exact files:

```bash
cd /Users/jordankrueger/ClaudeCode/personal/jordankrueger-site
npm install --save-dev @fontsource/dm-sans
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2 public/fonts/dm-sans-400.woff2
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-italic.woff2 public/fonts/dm-sans-400-italic.woff2
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2 public/fonts/dm-sans-500.woff2
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2 public/fonts/dm-sans-600.woff2
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-italic.woff2 public/fonts/dm-sans-600-italic.woff2
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2 public/fonts/dm-sans-700.woff2
npm uninstall @fontsource/dm-sans
```

If fontsource file paths differ, check with: `ls node_modules/@fontsource/dm-sans/files/ | grep latin | grep woff2`

- [ ] **Step 2: Update fonts.css — replace Poppins @font-face blocks with DM Sans**

Replace the entire Poppins section (lines 1-80) with:

```css
/* DM Sans - Body/UI font */
@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-400-italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-600-italic.woff2') format('woff2');
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: 'DM Sans';
  src: url('/fonts/dm-sans-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Keep the Lora and Rock Salt sections unchanged.

- [ ] **Step 3: Update global.css — change font-body variable**

In `src/styles/global.css` line 18, change:
```css
--font-body: 'Poppins', sans-serif;
```
to:
```css
--font-body: 'DM Sans', sans-serif;
```

- [ ] **Step 4: Update BaseLayout.astro — change font preload**

In `src/layouts/BaseLayout.astro` line 54, change:
```html
<link rel="preload" href="/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin />
```
to:
```html
<link rel="preload" href="/fonts/dm-sans-400.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 5: Delete old Poppins font files**

```bash
rm public/fonts/poppins-*.woff2
```

This removes all 10 Poppins woff2 files (200, 200-italic, 400, 400-italic, 500, 500-italic, 600, 600-italic, 700, 700-italic).

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`
Open: `http://jordans-mac-mini:4321`
Expected: All body text renders in DM Sans. Headings still Lora. Logo still Rock Salt. No FOUT or missing glyphs. Check homepage, about, projects, AI, and blog pages.

- [ ] **Step 7: Commit**

```bash
git add public/fonts/ src/styles/fonts.css src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "swap body font from Poppins to DM Sans"
```

---

### Task 2: Global CSS — grain texture, fade-up classes, button hover, tablet breakpoint

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add grain texture overlay**

Append after the `body` rule block (after line 58) in `global.css`:

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
}
```

- [ ] **Step 2: Add fade-up animation classes**

Append before the `/* Responsive */` section in `global.css`:

```css
/* Scroll-triggered fade-up */
.fade-up {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

.fade-up.delay-1 { transition-delay: 0.1s; }
.fade-up.delay-2 { transition-delay: 0.2s; }
.fade-up.delay-3 { transition-delay: 0.3s; }
.fade-up.delay-4 { transition-delay: 0.35s; }
```

- [ ] **Step 3: Enhance button hover**

Update the existing `.btn-primary:hover` rule (around line 139-142) to:

```css
.btn-primary:hover {
  background: var(--color-accent-hover);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 5px 16px rgba(175,76,42,0.35);
}
```

- [ ] **Step 4: Add tablet breakpoint**

Add a new media query block before the existing `@media (max-width: 640px)` section:

```css
/* Tablet */
@media (max-width: 900px) {
  .panel {
    padding: var(--spacing-md) var(--spacing-md);
  }
}
```

(Page-specific 900px rules will be added in their respective component tasks.)

- [ ] **Step 5: Verify in browser**

Open: `http://jordans-mac-mini:4321`
Expected: Very subtle grain overlay visible (look closely at solid color backgrounds). Buttons have a slight lift on hover. No fade-up effects visible yet (classes not applied to elements yet).

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "add grain texture, fade-up animation classes, enhanced button hover, tablet breakpoint"
```

---

### Task 3: IntersectionObserver script in BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro:72-79` (before closing `</body>`)

- [ ] **Step 1: Add IntersectionObserver script**

In `src/layouts/BaseLayout.astro`, add this script block just before the closing `</body>` tag (before line 79):

```html
<script is:inline>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
</script>
```

Using `is:inline` so Astro doesn't bundle/deduplicate it — this must run on every page.

- [ ] **Step 2: Verify**

Open: `http://jordans-mac-mini:4321`
Open browser console. Run: `document.querySelectorAll('.fade-up').length`
Expected: `0` (no elements have the class yet — that's fine, this is just the observer setup).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "add IntersectionObserver script for scroll-triggered animations"
```

---

### Task 4: Hero polish

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Add gradient background and photo shadow**

In `src/components/Hero.astro`, update the `.hero` CSS rule (line 24-27):

Change:
```css
.hero {
  background-color: var(--color-bg-white);
  padding: var(--spacing-xl) 0;
}
```
To:
```css
.hero {
  background: linear-gradient(170deg, var(--color-bg-white) 60%, var(--color-bg-warm) 100%);
  padding: var(--spacing-xl) 0;
}
```

Add to the `.hero-image img` rule (line 62-67):
```css
box-shadow: 0 8px 32px rgba(217,178,169,0.3);
```

- [ ] **Step 2: Add fade-up classes to hero elements**

In the HTML template section, add `class="fade-up"` attributes:

```html
<h1 class="hero-greeting fade-up">Hiya & welcome! 👋</h1>
<p class="hero-intro fade-up delay-1">I'm Jordan: Operations nerd, tech translator.</p>
<p class="hero-sub fade-up delay-2">...</p>
<div class="hero-actions fade-up delay-3">
```

Add `class="fade-up delay-4"` to the `<SocialIcons />` wrapper (wrap it in a div if needed).

Add `class="fade-up delay-2"` to the `.hero-image` div.

- [ ] **Step 3: Verify in browser**

Open: `http://jordans-mac-mini:4321`
Expected: Hero has a subtle warm gradient fading in at the bottom. Photo has a soft shadow. Elements fade in with staggered delays on page load.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro
git commit -m "add gradient background, photo shadow, and scroll animations to hero"
```

---

### Task 5: Newsletter default variant — full-width band

**Files:**
- Modify: `src/components/NewsletterSignup.astro`

- [ ] **Step 1: Update default variant CSS**

In `src/components/NewsletterSignup.astro`, update the CSS:

Replace `.newsletter-wrap` (line 29-31):
```css
.newsletter-wrap {
  padding: var(--spacing-md) var(--spacing-md);
}
```
With:
```css
.newsletter-wrap {
  padding: 0;
}

.newsletter-wrap.compact {
  padding: var(--spacing-md) var(--spacing-md);
}
```

Replace `.newsletter-panel` (line 33-38):
```css
.newsletter-panel {
  max-width: var(--max-width);
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-lg);
}
```
With:
```css
.newsletter-panel {
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-lg) var(--spacing-lg);
}

.newsletter-panel.compact {
  max-width: var(--max-width);
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
```

- [ ] **Step 2: Update default variant inner layout to flex**

Replace `.newsletter-inner` (line 49-54):
```css
.newsletter-inner {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-lg);
  align-items: center;
}
```
With:
```css
.newsletter-inner {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  max-width: var(--max-width);
  margin: 0 auto;
  flex-wrap: wrap;
}

.newsletter-form-wrap {
  flex: 1;
  min-width: 280px;
}
```

Add `class="newsletter-form-wrap"` to the form-containing div in the HTML template (the div wrapping `.newsletter-desc` and `.newsletter-form`).

- [ ] **Step 3: Update mobile styles**

In the `@media (max-width: 640px)` block, update:
```css
.newsletter-wrap.compact {
  padding: var(--spacing-md) var(--spacing-sm);
}

.newsletter-panel.compact {
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-md);
}
```

- [ ] **Step 4: Verify in browser**

Open: `http://jordans-mac-mini:4321`
Expected: The newsletter section after the hero spans the full width as a band with top/bottom borders. The compact variant at the bottom of the page still appears as a bordered panel. Check mobile layout too.

- [ ] **Step 5: Commit**

```bash
git add src/components/NewsletterSignup.astro
git commit -m "change default newsletter variant to full-width band layout"
```

---

### Task 6: Services horizontal cards + about centered + blog 3-col + contact fade-up

**Files:**
- Modify: `src/components/ServiceCard.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Update ServiceCard to horizontal layout**

In `src/components/ServiceCard.astro`, replace the entire component:

```astro
---
interface Props {
  title: string;
  description: string;
  image: string;
  href: string;
}
const { title, description, image, href } = Astro.props;
---

<a href={href} class="service-card" target="_blank" rel="noopener">
  <div class="service-image">
    <img src={image} alt={title} loading="lazy" />
  </div>
  <div class="service-text">
    <h3>{title}</h3>
    <p class="service-desc">{description}</p>
  </div>
</a>

<style>
  .service-card {
    display: flex;
    gap: 1.25rem;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: var(--color-bg-white);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    text-decoration: none;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .service-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(217,178,169,0.25);
  }

  .service-image {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }

  .service-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-sm);
  }

  .service-text h3 {
    font-size: 1rem;
    margin-bottom: 0.2rem;
  }

  .service-desc {
    font-size: 0.85rem;
    color: var(--color-text);
    line-height: 1.5;
  }
</style>
```

- [ ] **Step 2: Update homepage — services grid to 2x2, add fade-up**

In `src/pages/index.astro`, update the services grid CSS (around line 159-162):

Change:
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}
```
To:
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}
```

Update the services section HTML to add fade-up classes:
```html
<section class="services-section">
  <h2 class="section-heading fade-up">What can I do for you?</h2>
  <div class="container services-grid">
    {services.map((service, i) => (
      <div class={`fade-up delay-${Math.min(i + 1, 4)}`}>
        <ServiceCard {...service} />
      </div>
    ))}
  </div>
</section>
```

Update the mobile breakpoint — change the services-grid rule inside `@media (max-width: 640px)`:
```css
.services-grid {
  grid-template-columns: 1fr;
}
```

Add tablet breakpoint for services inside the `<style>` block:
```css
@media (max-width: 900px) {
  .services-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Update homepage — about preview to centered single-column**

In `src/pages/index.astro`, replace the about-preview HTML (around line 100-115):

```html
<div class="panel-wrap">
  <section class="about-panel fade-up">
    <h2 style="text-align: center;">About me 🤔</h2>
    <hr class="section-rule" style="margin: 0 auto var(--spacing-md);" />
    <div class="about-body">
      <p>Hi, I'm Jordan. I run <a href="https://campaign.help">CampaignHelp</a>, where I help progressive nonprofits and advocacy organizations stop wrestling with their technology — ActionKit, Google Workspace, tool migrations, workflow automation, and everything in between.</p>
      <p>I've worked with Win Without War, 350.org, Color Of Change, MomsRising, and others. Nearly two decades in the progressive movement means I already know your tools, your campaign cycle, and your budget constraints.</p>
      <a href="/about" class="read-more">Read my full story →</a>
    </div>
  </section>
</div>
```

Replace the `.about-preview` CSS rules with:
```css
.about-body {
  max-width: 640px;
  margin: 0 auto;
  text-align: left;
}

.read-more {
  display: inline-block;
  margin-top: var(--spacing-sm);
  font-weight: 500;
}
```

Remove the old `.about-preview` and `.about-preview-text` CSS rules and the mobile override for `.about-preview`.

- [ ] **Step 4: Update homepage — blog posts to 3-col with BlogPostCard**

In `src/pages/index.astro`, add `BlogPostCard` to the imports at the top:
```js
import BlogPostCard from '../components/BlogPostCard.astro';
```

Replace the blog posts HTML section (around line 118-139):
```html
<section class="section">
  <div class="container">
    <h2 class="section-heading fade-up">My recent blog posts</h2>
    {posts.length > 0 ? (
      <div class="posts-grid">
        {posts.map((post, i) => (
          <div class={`fade-up delay-${Math.min(i + 1, 4)}`}>
            <BlogPostCard
              title={post.data.title}
              description={post.data.description}
              pubDate={post.data.pubDate}
              slug={post.id}
              coverImage={post.data.coverImage}
              tags={post.data.tags}
            />
          </div>
        ))}
      </div>
    ) : (
      <p class="placeholder-text">Blog posts coming soon. Stay tuned!</p>
    )}
    <div class="center-link fade-up">
      <a href="/blog" class="btn btn-outline">Read more</a>
    </div>
  </div>
</section>
```

Update the `.posts-grid` CSS:
```css
.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
```

Remove the old `.post-card`, `.post-card:hover`, `.post-card-image`, `.post-card-title` CSS rules (the BlogPostCard component brings its own styles).

Add tablet and mobile breakpoints for posts-grid:
```css
@media (max-width: 900px) {
  /* ...existing 900px rules... */
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  /* ...existing 640px rules... */
  .posts-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Add fade-up to AK panel and contact panel**

In `src/pages/index.astro`, add `class="fade-up"` to the `.ak-panel` section element and the contact form wrapper. Wrap the contact form include: find the `<ContactForm />` and wrap its parent panel-wrap div with `fade-up`.

- [ ] **Step 6: Verify in browser**

Open: `http://jordans-mac-mini:4321`
Check:
- Services section: 2x2 grid with horizontal cards showing logo + text side by side
- About preview: centered heading and text, no 2-column split
- Blog posts: 3 columns with date, title, description, and tags
- All sections fade in on scroll
- Resize to tablet (900px) and mobile (640px) — grids collapse properly

- [ ] **Step 7: Commit**

```bash
git add src/components/ServiceCard.astro src/pages/index.astro
git commit -m "redesign homepage: horizontal service cards, centered about, 3-col blog grid, fade-up animations"
```

---

### Task 7: About page — StatsStack icons + timeline redesign

**Files:**
- Modify: `src/components/StatsStack.astro`
- Modify: `src/pages/about.astro`
- Delete: `src/components/DecadeSection.astro`

- [ ] **Step 1: Update StatsStack to render emoji icons**

Replace the entire `src/components/StatsStack.astro`:

```astro
---
const iconMap: Record<string, string> = {
  location: '📍',
  laptop: '💻',
  phone: '📱',
  email: '📧',
  browser: '🌐',
  gaming: '🎮',
};

const stats = [
  { icon: 'location', label: 'Pittsburgh-based' },
  { icon: 'laptop', label: 'MacBook Pro' },
  { icon: 'phone', label: 'iPhone Air' },
  { icon: 'email', label: 'Google Workspace' },
  { icon: 'browser', label: 'Safari & Brave Browser' },
  { icon: 'gaming', label: 'Switch, Steamdeck, Mac' },
];
---

<div class="stats-stack">
  <h3 class="stats-title">Stats & Stack</h3>
  <ul class="stats-list">
    {stats.map(stat => (
      <li class="stat-item">
        <span class="stat-icon">{iconMap[stat.icon]}</span>
        <span class="stat-label">{stat.label}</span>
      </li>
    ))}
  </ul>
</div>

<style>
  .stats-stack {
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
  }

  .stats-title {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    margin-bottom: var(--spacing-sm);
  }

  .stats-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-white);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
  }

  .stat-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    width: 1.5rem;
    text-align: center;
  }
</style>
```

- [ ] **Step 2: Rewrite about.astro timeline section**

In `src/pages/about.astro`, remove the `DecadeSection` import and all `<DecadeSection>` usages (lines 58-95).

Replace with the timeline markup. The timeline is built directly in `about.astro` using a CSS `::before` pseudo-element for the connecting line. Each item is a `<div class="timeline-item">` that alternates sides via CSS `:nth-child(odd/even)`.

Replace lines 52-95 (from `<!-- Timeline -->` to the closing `</section>`) with:

```html
<!-- Timeline -->
<section class="section">
  <div class="container">
    <h2 class="timeline-heading fade-up">How I got here</h2>
  </div>

  <div class="timeline">
    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">The 80s</h3>
        <p>I was born in Miami, Florida but also lived in New Jersey near Philadelphia during pre-school and first grade before moving back to Miami for elementary school.</p>
      </div>
      <div class="timeline-image">
        <img src="/images/timeline-80s.jpg" alt="The 80s" loading="lazy" width="1080" height="1080" />
      </div>
    </div>

    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">The 90s</h3>
        <p>I really found technology when I was introduced to computers by my dad, and fell in love with all they could do. A few years later, when we got a subscription to America Online (AOL), at an awkward time for myself as a new kid at school and discovering that I might be gay, I began role playing in the "Red Dragon Inn" online, and later formed a Star Trek roleplaying organization, StarBase 118 PBEM RPG, that still exists today — over 30 years later.</p>
        <p>That group taught me a great deal about communication, leadership, and the technology of building a community, which served me very well in the future.</p>
        <p>I've also been an activist since I was young. Even back in high school, I was elected president of the "Respect Club," the closest we could get to a "Gay-Straight Alliance" at our school.</p>
        <p>I got my first taste of the oppressive power of the institution when we were denied the ability to hang up pictures of LGBTQ+ (or, in those days, "GLBT") icons for LGBTQ History Month, which started in 1994.</p>
      </div>
      <div class="timeline-image">
        <img src="/images/timeline-90s.jpg" alt="The 90s" loading="lazy" width="2000" height="1600" />
      </div>
    </div>

    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">Early 2000s</h3>
        <p>I started college at Loyola University of Chicago in late 1999, where I met an incredible group of friends and even participated in protests against the college administration, which were slashing staff and programs due to a budget shortfall.</p>
        <p>Come the next fall, I attended the Disney College program and got to not only study Disney's legendary hospitality, but also work in the parks — a dream since I was a kid living in Florida and going to Disney World on a regular basis!</p>
        <p>Considering Loyola's financial troubles, I decided to continue my education at Hendrix College — a "liberal bastion in the heart of Arkansas," where I earned my Bachelor's Degree in English Literature and ran the college's Gay-Straight Alliance for a year.</p>
      </div>
      <div class="timeline-image">
        <img src="/images/timeline-2000s.jpg" alt="Early 2000s" loading="lazy" width="1080" height="1080" />
      </div>
    </div>

    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">Late 2000s</h3>
        <p>I co-organized the 2007 Little Rock Capital Pride celebration, with the largest attendance recorded and headlined by gay folk rocker Eric Himan.</p>
        <p>My path really crystallized soon after, in 2008, when Prop 8 (the ballot proposition that overturned marriage equality in California) passed the night President Obama was elected.</p>
        <p>Just months before, I had volunteered at the Los Angeles Gay & Lesbian Center — after my experience organizing Capital Pride — and had been assigned to work the door at comedy shows, instead of organizing! When Prop. 8 passed, I promised I'd never let anyone define my activism that way again.</p>
        <p>After live-tweeting (a very new thing at that time!) one of the first marches against Prop. 8's passage, I met one of the march's organizers, David Comfort, and we co-founded Equality Network in the fight to restore marriage equality to California.</p>
        <p>What followed was more than two years of intense activism, civil disobedience, and even co-signing a ballot proposition for marriage equality in California as part of the interim administrative committee of a campaign.</p>
      </div>
      <div class="timeline-image">
        <img src="/images/timeline-late2000s.jpg" alt="Late 2000s" loading="lazy" width="1333" height="2000" />
      </div>
    </div>

    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">The 2010s</h3>
        <p>My experience with Prop. 8 led me to the New Organizing Institute's "New Media Bootcamp," the primary training for people looking to get into digital campaigning. It was an incredibly valuable institution that no longer exists, much to the detriment of the progressive movement.</p>
        <p>I was then hired by the Progressive Change Campaign Committee to lobby the Progressive Caucus in Congress, and spent many days in Capitol Office Buildings sitting with stubborn legislative directors and chiefs of staff!</p>
        <p>Fed up with Congress' unwillingness to use its power, I found a new home back in California with CREDO Action, where I served as a Campaigner and later Director of Operations for over seven years and learned more about the power of organizing from the outside with an email list of 5 million members.</p>
      </div>
      <div class="timeline-image">
        <img src="/images/timeline-2010s.jpg" alt="The 2010s" loading="lazy" width="1333" height="2000" />
      </div>
    </div>

    <div class="timeline-item fade-up">
      <div class="timeline-content">
        <h3 class="timeline-decade">The 2020s</h3>
        <p>CREDO Action was my home, my dream job, and where I thought I'd stay for many more years. I was devastated when we were told that CREDO was laying off its advocacy team in January of 2020. But as they say, <em>when one door closes, another opens</em>, and wow was that true for me!</p>
        <p>When the job hunt didn't go anywhere fast, I started taking on projects with organizations that I had worked in alliance with at CREDO Action. Soon, that transformed into a full-time consulting practice with <a href="https://campaign.help">CampaignHelp</a>.</p>
        <p>Since then, I've worked with Win Without War, 350.org, Color Of Change, MomsRising, Mothers Out Front, UltraViolet, Caring Across Generations, and others — handling ActionKit administration, tool migrations, workflow automation, and digital security. I've also been building AI-powered tools for the advocacy space, including an <a href="https://akhelp.campaign.help">AI assistant for ActionKit</a> that helps campaign teams get answers without waiting on a support ticket.</p>
        <p>Although, at times, it can be a bit scary running my own business, I wouldn't trade it for anything!</p>
      </div>
      <div class="timeline-image"></div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add timeline CSS to about.astro**

Add these styles to the `<style>` block in `about.astro`. Remove the old `.timeline-heading` rule and add:

```css
.timeline-heading {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.timeline {
  max-width: 900px;
  margin: 0 auto var(--spacing-xl);
  padding: 0 var(--spacing-md);
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
  transform: translateX(-50%);
}

.timeline-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 1.5rem;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 3px solid var(--color-bg);
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 0 0 3px var(--color-border);
}

.timeline-item:nth-child(odd) .timeline-content {
  text-align: right;
  padding-right: var(--spacing-lg);
}

.timeline-item:nth-child(odd) .timeline-image {
  padding-left: var(--spacing-lg);
}

.timeline-item:nth-child(even) .timeline-content {
  grid-column: 2;
  grid-row: 1;
  padding-left: var(--spacing-lg);
}

.timeline-item:nth-child(even) .timeline-image {
  grid-column: 1;
  grid-row: 1;
  text-align: right;
  padding-right: var(--spacing-lg);
}

.timeline-decade {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: var(--spacing-xs);
}

.timeline-content p {
  color: var(--color-text-light);
  line-height: 1.65;
  margin-bottom: 0.75rem;
}

.timeline-image img {
  width: 100%;
  max-width: 300px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(217,178,169,0.25);
}

.timeline-item:nth-child(even) .timeline-image img {
  margin-left: auto;
}

@media (max-width: 900px) {
  .timeline::before {
    left: 1rem;
  }

  .timeline-item {
    grid-template-columns: 1fr;
    padding-left: 2.5rem;
  }

  .timeline-item::before {
    left: 1rem;
  }

  .timeline-item:nth-child(odd) .timeline-content,
  .timeline-item:nth-child(even) .timeline-content {
    text-align: left;
    padding: 0;
    grid-column: 1;
    grid-row: 1;
  }

  .timeline-item:nth-child(odd) .timeline-image,
  .timeline-item:nth-child(even) .timeline-image {
    padding: 0;
    text-align: left;
    grid-column: 1;
    grid-row: 2;
  }

  .timeline-item:nth-child(even) .timeline-image img {
    margin-left: 0;
  }

  .timeline-image img {
    max-width: 250px;
  }
}
```

- [ ] **Step 4: Add fade-up to intro and bio sections**

In the intro section HTML, add `class="fade-up"` to `.about-intro-text` children and the image div.

In the bio section, add `class="fade-up"` to `.about-bio-text` and `.about-bio-sidebar`.

- [ ] **Step 5: Delete DecadeSection.astro**

```bash
rm src/components/DecadeSection.astro
```

Remove the `DecadeSection` import from `about.astro`.

- [ ] **Step 6: Verify in browser**

Open: `http://jordans-mac-mini:4321/about`
Check:
- Stats sidebar shows emoji icons before each label
- Timeline has a vertical connecting line with colored dots
- Decades alternate sides (odd: text left/image right, even: image left/text right)
- ALL timeline text is present (every paragraph from every decade)
- The 2020s entry has no image (just text)
- Resize to 900px — timeline collapses to single column with line on the left
- Resize to 640px — still single column, proper spacing
- Elements fade in on scroll

- [ ] **Step 7: Commit**

```bash
git add src/components/StatsStack.astro src/pages/about.astro
git rm src/components/DecadeSection.astro
git commit -m "redesign about page: emoji icons in stats, alternating timeline with connecting line"
```

---

### Task 8: Projects page — fix stale content + alternating card order

**Files:**
- Modify: `src/pages/projects.astro:58` (tools data)
- Modify: `src/components/ProjectCard.astro`

- [ ] **Step 1: Fix stale "Carrd.co" reference**

In `src/pages/projects.astro`, change line 58:
```js
{ label: 'Sites: Carrd.co' },
```
To:
```js
{ label: 'Sites: Astro' },
```

- [ ] **Step 2: Add index prop to ProjectCard for alternating layout**

In `src/components/ProjectCard.astro`, add `index` to the interface and props:

```astro
---
interface Props {
  title: string;
  description: string;
  image?: string;
  href: string;
  secondaryLink?: { href: string; label: string };
  bgClass?: string;
  index?: number;
}
const { title, description, image, href, secondaryLink, bgClass = '', index = 0 } = Astro.props;
const reversed = index % 2 === 1;
---
```

Add a conditional class to `.project-card-inner`:
```html
<div class:list={["project-card-inner", { reversed }]}>
```

Add CSS for the reversed layout:
```css
.project-card-inner.reversed {
  direction: rtl;
}

.project-card-inner.reversed > * {
  direction: ltr;
}
```

Add `class="fade-up"` to `.project-card-panel`.

- [ ] **Step 3: Pass index to ProjectCard in projects.astro**

In `src/pages/projects.astro`, update the render loop (around line 99):
```html
{projects.map((project, i) => (
  <ProjectCard {...project} index={i} />
))}
```

- [ ] **Step 4: Verify in browser**

Open: `http://jordans-mac-mini:4321/projects`
Check:
- "Favorite Tools" shows "Sites: Astro" instead of "Sites: Carrd.co"
- Odd project cards (1st, 3rd, 5th, 7th): header/image on left, body on right
- Even project cards (2nd, 4th, 6th): body on left, header/image on right
- Cards fade in on scroll

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects.astro src/components/ProjectCard.astro
git commit -m "fix stale Carrd.co reference, add alternating card layout to projects page"
```

---

### Task 9: AI page + blog listing + cleanup

**Files:**
- Modify: `src/pages/ai.astro`
- Modify: `src/components/AiProjectCard.astro`
- Modify: `src/components/AiStoryCard.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/components/BlogPostCard.astro`
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Add fade-up to AI page grids**

In `src/pages/ai.astro`, wrap each card in the `.ai-grid` sections with fade-up divs. For each of the four grid sections (advocacyProjects, communityProjects, personalProjects, stories), update the map:

```html
{advocacyProjects.map((project, i) => (
  <div class={`fade-up delay-${Math.min((i % 3) + 1, 3)}`}>
    <AiProjectCard {...project} />
  </div>
))}
```

Use `i % 3` so the stagger resets every row (3-column grid), keeping animation timing consistent.

Add `class="fade-up"` to each `.ai-section-header` div and the `.ai-hero` panel.

Add `class="fade-up"` to each `.ai-stat` div in the stats section.

- [ ] **Step 2: Fix hardcoded colors in AiStoryCard**

In `src/components/AiStoryCard.astro`, update the `colors` array (line 12-16) to use the accent palette:

```js
const colors = [
  'var(--color-accent)',
  '#5a8a4e',
  'var(--color-accent-hover)',
  '#5a7a94',
];
```

Note: `var(--color-accent)` and `var(--color-accent-hover)` replace the old hardcoded values. The green and blue are kept as-is since they aren't accent colors.

Since these are used in an inline `style` attribute via `--border-color`, CSS variables will work here because the custom property is resolved at render time.

- [ ] **Step 3: Update blog listing to 3-column grid**

In `src/pages/blog/index.astro`, update the `.blog-grid` CSS (around line 90-94):

```css
.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}
```

Add tablet breakpoint inside the `<style>` block:
```css
@media (max-width: 900px) {
  .blog-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

The existing 640px breakpoint already collapses to `1fr`.

- [ ] **Step 4: Fix duplicate border in BlogPostCard**

In `src/components/BlogPostCard.astro`, remove the duplicate `border` declaration. Lines 40-44 currently read:
```css
.blog-card {
  display: block;
  text-decoration: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
```

Remove line 43 (`border: 1px solid var(--color-border);` — the second occurrence).

- [ ] **Step 5: Fix 404 page inline styles**

In `src/pages/404.astro`, move the inline styles to a `<style>` block:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Page Not Found — Jordan Krueger" description="This page doesn't exist." noindex={true}>
  <main class="container section not-found">
    <h1>404</h1>
    <p>This page doesn't exist. Maybe it moved, or maybe you typo'd. Either way, let's get you home.</p>
    <a href="/" class="btn btn-primary not-found-btn">Back to Home</a>
  </main>
</BaseLayout>

<style>
  .not-found {
    text-align: center;
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .not-found-btn {
    margin-top: 1.5rem;
  }
</style>
```

- [ ] **Step 6: Verify in browser**

Check:
- `http://jordans-mac-mini:4321/ai` — cards stagger-fade in per row, story card top borders use correct accent colors
- `http://jordans-mac-mini:4321/blog` — 3-column grid at desktop, 2 at tablet, 1 at mobile
- `http://jordans-mac-mini:4321/404-test` (trigger 404) — page looks the same, no inline styles in source

- [ ] **Step 7: Commit**

```bash
git add src/pages/ai.astro src/components/AiStoryCard.astro src/pages/blog/index.astro src/components/BlogPostCard.astro src/pages/404.astro
git commit -m "add animations to AI page, 3-col blog grid, fix BlogPostCard border, clean up 404 page"
```

---

### Task 10: Final verification pass

- [ ] **Step 1: Full-site visual check**

Run the dev server and check every page:
- `/` — homepage (hero gradient, band newsletter, 2x2 services, centered about, 3-col blog)
- `/about` — (emoji stats, alternating timeline with full text, connecting line)
- `/projects` — (Astro in tools, alternating card sides)
- `/ai` — (staggered card animations)
- `/blog` — (3-col grid)
- `/building` — (should inherit blog listing styles)
- Any blog post — (reading layout unchanged)

- [ ] **Step 2: Responsive check**

Resize browser to test three breakpoints:
- Desktop (>900px)
- Tablet (640-900px)
- Mobile (<640px)

Key things to verify at tablet:
- Services grid: 1 column
- Blog grid: 2 columns
- Timeline: single column with line on left
- Footer: 2 columns

- [ ] **Step 3: Check for regressions**

- No broken images
- No FOUT (flash of unstyled text)
- No layout shift (CLS)
- Newsletter forms still work (test a submission to your own email)
- Contact form still works
- Mobile menu still opens/closes
- All links work
- Grain texture visible but very subtle

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: Clean build with no errors. Check the `dist/` output size hasn't ballooned.
