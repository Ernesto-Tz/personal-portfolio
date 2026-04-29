# Sanity CMS Migration — Design Spec

**Date:** 2026-04-13  
**Project:** magic-portfolio  
**Status:** Approved

---

## Overview

Migrate the portfolio from filesystem-based content (MDX files + static JS objects) to Sanity as the CMS. The Sanity Studio is embedded in the same Next.js app at `/studio`. Content changes publish from Studio to the live site in ~5 seconds via webhook-triggered on-demand revalidation — no git commits or redeploys needed.

The blog section is renamed to "Sports" as part of this migration.

---

## Goals

- Add a GUI for editing content without touching code
- Learn Sanity (schemas, GROQ, Portable Text, webhooks)
- Eliminate the git-commit-per-content-change workflow
- Keep all visual design, components, and low-level config unchanged

---

## Architecture

```
GitHub repo
├── /src/app/studio/[[...tool]]/page.tsx   ← Sanity Studio UI at /studio
├── /src/sanity/
│   ├── schemaTypes/                        ← All content schemas
│   ├── lib/client.ts                       ← Sanity client configuration
│   └── lib/queries.ts                      ← Reusable GROQ queries
├── /src/app/resources/config.js            ← KEPT (fonts, colors, routes, effects)
└── /src/app/resources/content.js           ← DELETED (replaced by Sanity)
```

**Data flow:**
1. Edit content in `/studio` → click Publish
2. Sanity fires a webhook to `/api/revalidate`
3. Next.js calls `revalidateTag()` for the affected content type
4. Cached pages are invalidated; visitors see updated content within ~5 seconds

---

## Content Schemas

All schemas live in `src/sanity/schemaTypes/`. Two singletons (one record each), six list types.

### Singletons
| Schema | Purpose | Key Fields |
|---|---|---|
| `person` | Bio and identity | firstName, lastName, role, avatar (Sanity image), email, location, languages[] |
| `pageSettings` | Homepage dynamic content | featuredProject (→ workProject ref), featuredLabel, projectsSectionTitle, sportsSectionTitle |

### List Types
| Schema | Purpose | Key Fields |
|---|---|---|
| `sportsPost` | Sports section posts (replaces blog) | title, slug, summary, publishedAt, tag, coverImage (Sanity image), body (Portable Text) |
| `workProject` | Work/portfolio projects | title, slug, summary, publishedAt, coverImage (Sanity image), images[] (Sanity image), link (URL), body (Portable Text) |
| `skill` | Skills marquee and about page | title, icon (URL string), href, projects[] (→ workProject refs) |
| `workExperience` | About page timeline | company, timeframe, role, achievements[] (Portable Text) |
| `socialLink` | Footer/contact links | name, icon (string key), url |
| `galleryImage` | Gallery page | image (Sanity image), alt, orientation (horizontal \| vertical) |

### Design Notes
- `skill.projects[]` uses references to `workProject` documents — preserves the existing relationship between skills and the projects they appear on
- `pageSettings` is a singleton document; queried once and used across the home and sports pages
- `person` is a singleton; never queried as a list
- Post bodies and project bodies use Sanity's Portable Text (block content) — replaces MDX

---

## Data Fetching & Revalidation

### Query Layer
Replace `getPosts()` (fs + gray-matter) and all `content.js` imports with async GROQ queries:

```ts
// src/sanity/lib/queries.ts
export const SPORTS_POSTS_QUERY = groq`*[_type == "sportsPost"] | order(publishedAt desc)`
export const WORK_PROJECTS_QUERY = groq`*[_type == "workProject"] | order(publishedAt desc)`
export const PAGE_SETTINGS_QUERY = groq`*[_type == "pageSettings"][0]`
// etc.
```

Each page fetches data using `sanityFetch()` with a cache tag:

```ts
const posts = await sanityFetch({ query: SPORTS_POSTS_QUERY, tags: ['sportsPost'] })
```

### Revalidation Endpoint
`/api/revalidate` — authenticated with `SANITY_REVALIDATE_SECRET`, receives Sanity webhook payloads and calls `revalidateTag()` for the changed document type.

### Environment Variables
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=           # read-only token
SANITY_REVALIDATE_SECRET=   # shared webhook secret
```

Set in Vercel dashboard for production; add to `.env.local` for development.

---

## Route Rename: `/blog` → `/sports`

- Rename `src/app/blog/` → `src/app/sports/` (folder, page files, slug route)
- Update navigation to use "Sports" label (driven by `pageSettings.sportsSectionTitle`)
- Add permanent redirect in `next.config.js`:
  ```js
  { source: '/blog', destination: '/sports', permanent: true },
  { source: '/blog/:slug', destination: '/sports/:slug', permanent: true },
  ```
- Update `routes` in `config.js`: replace `"/blog": true` with `"/sports": true`

---

## Migration Order

To avoid breaking the live site, content is seeded before old code is removed:

1. **Sanity project setup** — init project, install `next-sanity` + `@sanity/image-url`, configure Studio route at `/studio`
2. **Define all schemas** — write all 8 schema files; verify Studio loads correctly
3. **Seed content** — enter all existing content into Studio manually (3 sports posts, 2 work projects, bio, 15 skills, 3 work experience entries, social links, gallery images)
4. **Build query layer** — write GROQ queries in `queries.ts`, set up `sanityFetch` client
5. **Migrate pages** — swap `content.js` imports and `getPosts()` calls page by page; verify each route before moving to the next
6. **Rename blog → sports** — rename route folder, add redirects, update nav and config
7. **Wire up revalidation** — add `/api/revalidate` handler, create Sanity webhook in dashboard
8. **Clean up** — delete `content.js`, `utils.ts`, all `.mdx` files, remove `gray-matter` dependency
9. **Deploy** — push to GitHub, set env vars in Vercel dashboard, verify webhook fires correctly

---

## What Does NOT Change

- Vercel deployment setup and GitHub integration
- Visual design, Tailwind styles, all components
- `config.js` (fonts, colors, theme, effects, baseURL)
- Password-protected routes logic (`/api/authenticate`, `/api/check-auth`)
- OG image generation (`/app/og/route.tsx`)

---

## Deployment Workflow Comparison

| Before | After |
|---|---|
| Edit MDX/JS → git commit → push → Vercel rebuild (~1-2 min) → live | Open `/studio` → edit → Publish → webhook → revalidate (~5 sec) → live |
| Typo fix requires a git commit | Typo fix is a Studio save |
| No content UI | Full Sanity Studio at `/studio` |

---

## Dependencies to Add

```
next-sanity
@sanity/image-url
```

## Dependencies to Remove

```
gray-matter        # no longer reading MDX frontmatter
next-mdx-remote    # no longer rendering MDX content
@mdx-js/loader
@next/mdx
```
