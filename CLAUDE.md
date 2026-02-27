# jordankrueger.com — Personal Site

## Stack
- **Astro** static site generator with MDX for blog posts
- **Cloudflare Pages** — auto-deploys on push to `main`
- **GitHub:** `jordankrueger/jordankrueger-site` (use `jordankrueger` account)

## Dev Server
```bash
npm run dev
# Access at http://192.168.50.229:4321
```

## Key Directories
- `src/pages/` — All routes (Astro file-based routing)
- `src/layouts/` — BaseLayout (HTML shell), BlogPost (post wrapper)
- `src/components/` — Reusable UI components
- `src/content/posts/` — MDX blog posts (content collection)
- `src/styles/` — global.css (design tokens), fonts.css (@font-face)
- `public/fonts/` — Self-hosted woff2 fonts (Poppins, Lora, Rock Salt)
- `public/images/` — All site images with descriptive names
- `carrd-export/` — Original Carrd site for content reference

## Design System
- **Colors:** `--color-accent: #E87A5D`, `--color-text: #5C5248`, `--color-bg: #EDEDED`
- **Fonts:** Poppins (body), Lora (headings), Rock Salt (logo only)
- **Breakpoint:** 640px for mobile

## Blog Posts
Posts are MDX files in `src/content/posts/` with frontmatter:
```yaml
title: "Post Title"
description: "Short description"
pubDate: 2026-01-15
tags: ["tag1", "tag2"]
coverImage: "/images/gallery/cover.jpg"
draft: false
```

Tag `claude-code` to include in the Building in Public series at `/building`.

## External Services
- **Newsletter signup:** POST to `https://progressives-signup.restless-salad-a31e.workers.dev`
- **Contact form:** Needs a Cloudflare Worker (not yet built)
- **Analytics:** Google Analytics `G-QJQ0PD6XHD`

## Deployment
Push to `main` branch → Cloudflare Pages auto-deploys.
Build command: `npm run build`
Output directory: `dist`
