# jordankrueger.com design refresh

**Date:** 2026-04-09
**Status:** Draft
**Stack:** Astro (static), Cloudflare Pages, self-hosted fonts

## Goals

Elevate the visual quality of jordankrueger.com while keeping the warm, personal, image-rich character. The site currently uses the same 2-column bordered-panel layout for nearly every section, creating visual monotony. This refresh introduces layout variety, scroll animations, atmospheric texture, and fixes stale content — without changing the site's identity or rewriting its copy.

## Non-goals

- No framework migration (stays Astro)
- No CMS integration
- No dark mode
- No content rewrites (all existing text stays as-is)
- Should not resemble the CampaignHelp site (campaign.help)

## Design decisions

### Typography

**Change:** Replace Poppins (body font) with DM Sans.

- Poppins is one of the most overused Google Fonts. DM Sans is a warmer geometric sans-serif with slightly more character.
- Self-host DM Sans woff2 files in `public/fonts/` (weights: 400, 500, 600, 700 + italics for 400 and 600).
- Remove Poppins font files and `@font-face` declarations.
- Lora (headings) stays unchanged.
- Rock Salt (logo) stays unchanged.
- Update `--font-body` CSS variable from `'Poppins'` to `'DM Sans'`.
- Update font preload in `BaseLayout.astro` to preload `dm-sans-400.woff2` instead of `poppins-400.woff2`.

### Colors

`--color-accent` is already `#AF4C2A` and `--color-accent-hover` is already `#9A4224`. No token changes needed.

- Update hardcoded accent colors in components to use the CSS variable instead. Specifically, `AiStoryCard.astro` has hardcoded hex values (`'#d97656'`, etc.) in a `colors` array (line 14) — replace these with CSS variable references or update them to match the current accent palette.

### Atmosphere

**Change:** Add a subtle grain/noise texture overlay to the page background.

- Add a `body::after` pseudo-element with a fixed-position SVG noise texture at ~3% opacity.
- This is a CSS-only change in `global.css`, no new assets needed.
- The SVG noise is inlined as a data URI in the `background-image` property.

**Change:** Add gradient backgrounds where currently flat.

- Hero section: change from flat `--color-bg-white` to `linear-gradient(170deg, var(--color-bg-white) 60%, var(--color-bg-warm) 100%)`.
- Hero photo: add `box-shadow: 0 8px 32px rgba(217,178,169,0.3)` for depth.
- Button primary hover: add slight `translateY(-1px)` and enhanced shadow for a more satisfying interaction.

### Scroll animations

**Change:** Add scroll-triggered fade-up animations globally.

- Add `.fade-up` CSS class with `opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease`.
- Add `.fade-up.visible` with `opacity: 1; transform: translateY(0)`.
- Add delay utility classes: `.delay-1` through `.delay-4` with staggered `transition-delay` values (0.1s increments).
- Add a small inline script using `IntersectionObserver` (threshold: 0.15) that adds `.visible` when elements enter the viewport.
- Place this script in `BaseLayout.astro` so it's available on all pages.
- Apply `.fade-up` to: card grids (staggered), section headings, panels, timeline items.
- Keep animations subtle — no bouncing, no scaling, just a clean upward fade.

### Responsive breakpoints

**Change:** Add a tablet breakpoint at 900px.

- Currently the site has a single breakpoint at 640px.
- Add `@media (max-width: 900px)` rules for layouts that are too cramped between 640-900px:
  - Services grid: collapse from 2x2 to 1-column.
  - Blog posts grid: collapse from 3-column to 2-column.
  - Footer grid: collapse from 4-column to 2-column.
  - Timeline: collapse from alternating 2-column to single-column stacked.

---

## Page-by-page changes

### Homepage (`src/pages/index.astro`)

#### Hero section
- Keep the existing 2-column layout with photo on the right. No structural change.
- Add gradient background to `.hero` (see Atmosphere section above).
- Add `box-shadow` to `.hero-image img`.
- Add `.fade-up` classes with staggered delays to hero elements (greeting, intro, sub, actions, social icons, image).

#### Newsletter signup (`NewsletterSignup.astro`)
- **Default variant:** Change from a bordered panel/box to a full-width band.
  - Remove the border, border-radius, and max-width constraint.
  - Use `border-top` and `border-bottom` instead of a full border.
  - Change inner layout from 2-column grid (left heading / right form) to a single-row flex layout: text on left, form on right, vertically centered.
  - Background stays `--color-bg-warm`.
- **Compact variant:** Keep as a bordered panel (used at bottom of pages, the current look is fine there).
- The homepage currently has three email signups: (1) `<NewsletterSignup />` after the hero, (2) the AK Template section with its own inline email form, and (3) `<NewsletterSignup variant="compact" />` before the contact form. Keep all three — they serve different purposes (general newsletter, AK template download, bottom-of-page catch). Only the default variant's visual treatment changes (to a band); the AK Template section and compact variant stay as bordered panels.

#### Services section
- Change from 4-column vertical card grid to 2x2 horizontal card layout.
- Each card becomes a horizontal flex row: logo/icon on the left (64px square), text on the right.
- This gives more room for descriptions and looks less cramped.
- Update `ServiceCard.astro` to use horizontal layout with flex instead of vertical column.
- Add `.fade-up` with staggered delays to each card.

#### Blog posts section
- Change from 2-column grid to 3-column grid.
- The homepage currently uses inline card markup that only shows title + image. Replace with the `BlogPostCard.astro` component, which already renders date, title, and description.
- Add `.fade-up` with staggered delays.

#### About preview section
- Change from 2-column grid (heading left, text right) to centered single-column layout.
- Center the heading and divider rule.
- Constrain the body text to `max-width: 640px` centered within the panel.
- Keeps the bordered panel with `--color-bg-warm` background.

#### Contact form
- No structural change. Keep the 2-column panel (heading left, form right) — this layout is correct for a form.
- Add `.fade-up` to the panel.

### About page (`src/pages/about.astro`)

#### Intro section
- No structural change. Keep the 2-column layout with photo.
- Add `.fade-up` animations.

#### Bio + Stats section
- No structural change to the bio text.
- **StatsStack component (`StatsStack.astro`):** Render the `icon` property that's already defined in the data. Use emoji icons mapped from the icon names:
  - `location` → 📍
  - `laptop` → 💻
  - `phone` → 📱
  - `email` → 📧
  - `browser` → 🌐
  - `gaming` → 🎮
- Add the emoji as a `<span>` before the label text in each `.stat-item`.

#### Timeline section
- **Replace the stacked identical `DecadeSection` panels with an alternating timeline layout.**
- New layout: a vertical connecting line runs down the center. Each decade alternates sides — odd decades have text on the left and image on the right, even decades have image on the left and text on the right. Colored dots mark each decade on the connecting line.
- The decade title uses the accent color and `--font-heading`.
- **All existing timeline text stays exactly as-is.** No content is removed, shortened, or paraphrased.
- Images stay with their respective decades, displayed beside the text on the alternating side.
- The last decade (2020s) has no image, which is fine — the text fills the content side, the image side is empty.
- On mobile (below 640px), the timeline collapses to a single column with the connecting line on the left edge, all content stacked.
- On tablet (below 900px), same single-column collapse.
- Add `.fade-up` to each timeline item so they animate in on scroll.
- The `DecadeSection.astro` component can be replaced with a new `TimelineItem.astro` component, or the timeline can be built directly in `about.astro` with the connecting line as a CSS pseudo-element.
- The `bgClass` alternating background colors on the current decade panels are removed — the timeline items sit on the default page background with the connecting line providing visual structure.

#### Podcast embed
- No change.

### Projects page (`src/pages/projects.astro`)

#### Stale content fix
- Update the "Favorite Tools" sidebar:
  - Change `{ label: 'Sites: Carrd.co' }` to `{ label: 'Sites: Astro' }`.
  - Review other entries for accuracy.

#### Project cards
- Keep full-width panel layout (the long-form descriptions need the space).
- Alternate the grid column order: odd cards have header/image on left and body on right (current), even cards flip to body on left and header/image on right.
- This can be done with an `index` prop passed to `ProjectCard.astro` and a CSS class that reverses the grid column order.
- Add `.fade-up` to each card.

### AI page (`src/pages/ai.astro`)

- No layout changes. The card grid and overall structure are already strong.
- Add `.fade-up` with staggered delays to each `AiProjectCard` and `AiStoryCard` in every grid.
- Add `.fade-up` to section headers.
- The stats section in the hero could benefit from a subtle entrance animation (staggered counters), but a simple fade-up is fine.

### Blog listing (`src/pages/blog/index.astro`)

- Change from 2-column grid to 3-column grid (matching the homepage blog section).
- Add tablet breakpoint: 3-column at desktop, 2-column at 900px, 1-column at 640px.

### Blog post layout (`src/layouts/BlogPost.astro`)

- No structural changes. The reading layout is solid.

### BlogPostCard component (`src/components/BlogPostCard.astro`)

- Fix duplicate `border` declaration (lines 41 and 43 both declare `border: 1px solid var(--color-border)`). Remove one.

### 404 page (`src/pages/404.astro`)

- Move inline styles to a `<style>` block. No design change.

---

## Files changed

| File | Change type |
|------|-------------|
| `src/styles/global.css` | Edit: grain texture, fade-up classes, tablet breakpoint, button hover |
| `src/styles/fonts.css` | Edit: remove Poppins faces, add DM Sans faces |
| `public/fonts/` | Add DM Sans woff2 files, remove Poppins woff2 files |
| `src/layouts/BaseLayout.astro` | Edit: font preload, add IntersectionObserver script |
| `src/pages/index.astro` | Edit: hero gradient/shadow, newsletter layout, services grid, about centered, blog 3-col |
| `src/components/Hero.astro` | Edit: gradient bg, photo shadow, fade-up classes |
| `src/components/NewsletterSignup.astro` | Edit: default variant becomes full-width band |
| `src/components/ServiceCard.astro` | Edit: horizontal layout |
| `src/components/StatsStack.astro` | Edit: render emoji icons |
| `src/pages/about.astro` | Edit: replace DecadeSection usage with timeline layout, fade-up |
| `src/components/DecadeSection.astro` | Delete or replace with TimelineItem.astro |
| `src/pages/projects.astro` | Edit: fix Carrd.co reference, alternating card order |
| `src/components/ProjectCard.astro` | Edit: support reversed column order via prop |
| `src/pages/ai.astro` | Edit: add fade-up classes to grids and headers |
| `src/components/AiProjectCard.astro` | Edit: add fade-up class |
| `src/components/AiStoryCard.astro` | Edit: add fade-up class, fix hardcoded accent color |
| `src/pages/blog/index.astro` | Edit: 3-column grid, tablet breakpoint |
| `src/components/BlogPostCard.astro` | Edit: remove duplicate border declaration |
| `src/pages/404.astro` | Edit: move inline styles to style block |

## What stays the same

- All page content and copy (every word)
- Site structure and routing
- Rock Salt logo font
- Lora heading font
- All images and their placement (hero photo, timeline photos, project logos)
- Header and footer structure
- Contact form functionality
- Newsletter form endpoints
- SEO (structured data, meta tags, canonical URLs)
- RSS feed
- Mobile menu behavior

## Mockups

Visual mockups from the brainstorming session are saved in:
- `.superpowers/brainstorm/17602-1775744475/homepage-scroll.html` — full homepage redesign
- `.superpowers/brainstorm/17602-1775744475/about-timeline.html` — timeline comparison + full-size preview
