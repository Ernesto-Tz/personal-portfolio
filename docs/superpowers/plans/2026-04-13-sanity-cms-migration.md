# Sanity CMS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the portfolio from filesystem MDX + static JS content to Sanity CMS with an embedded Studio at `/studio`, on-demand revalidation via webhook, and the blog section renamed to "Sports."

**Architecture:** Sanity is added as a data source alongside the existing Next.js 15 App Router project. All dynamic content (sports posts, work projects, bio, skills, work experience, social links, gallery images, page settings) moves to Sanity. Low-level config (fonts, colors, routes, effects) stays in `config.js`. Sanity webhooks trigger `revalidateTag()` so the live site updates within seconds of publishing — no git push needed.

**Tech Stack:** Next.js 15 App Router, next-sanity v9, Sanity Studio v3, GROQ, @portabletext/react, @sanity/image-url, @sanity/vision, pnpm

---

## File Map

### Created
| File | Purpose |
|---|---|
| `sanity.config.ts` | Root-level Sanity Studio configuration |
| `src/sanity/env.ts` | Env var exports with validation |
| `src/sanity/lib/client.ts` | Sanity client + `sanityFetch` helper |
| `src/sanity/lib/image.ts` | `urlFor()` image URL builder |
| `src/sanity/lib/queries.ts` | All GROQ query strings |
| `src/sanity/schemaTypes/index.ts` | Schema registry |
| `src/sanity/schemaTypes/sportsPost.ts` | Sports post document |
| `src/sanity/schemaTypes/workProject.ts` | Work project document |
| `src/sanity/schemaTypes/person.ts` | Person singleton |
| `src/sanity/schemaTypes/pageSettings.ts` | Page settings singleton |
| `src/sanity/schemaTypes/skill.ts` | Skill document |
| `src/sanity/schemaTypes/workExperience.ts` | Work experience document |
| `src/sanity/schemaTypes/socialLink.ts` | Social link document |
| `src/sanity/schemaTypes/galleryImage.ts` | Gallery image document |
| `src/app/studio/[[...tool]]/page.tsx` | Studio route at /studio |
| `src/app/api/revalidate/route.ts` | Webhook revalidation handler |
| `src/app/sports/page.tsx` | Sports listing page (replaces /blog) |
| `src/app/sports/[slug]/page.tsx` | Sports post page |

### Modified
| File | Change |
|---|---|
| `package.json` | Add next-sanity, sanity, @sanity/image-url, @portabletext/react, @sanity/vision |
| `next.config.mjs` | Remove MDX config, add Sanity CDN image domain, add /blog→/sports redirects |
| `src/app/resources/config.js` | Replace `/blog` route with `/sports`, add `nav` and `site` config objects |
| `src/app/resources/index.ts` | Export `nav` and `site` from config; remove content.js exports |
| `src/app/layout.tsx` | Use `site` from config instead of `home` from content |
| `src/app/sitemap.ts` | Replace getPosts() with Sanity queries, rename blog→sports |
| `src/app/page.tsx` | Fetch from Sanity (person, skills, pageSettings) |
| `src/app/about/page.tsx` | Fetch from Sanity (person, social, workExperience) |
| `src/app/work/page.tsx` | Fetch from Sanity (workProjects) |
| `src/app/work/[slug]/page.tsx` | Fetch from Sanity, render Portable Text |
| `src/app/gallery/page.tsx` | Fetch from Sanity (galleryImages) |
| `src/components/work/Projects.tsx` | Accept projects as props instead of calling getPosts() |
| `src/components/gallery/MasonryGrid.tsx` | Accept images as props instead of importing from content |
| `src/components/blog/Posts.tsx` | Accept posts as props, update href to /sports/ |
| `src/components/blog/Post.tsx` | Update href from /blog/ to /sports/ |
| `src/components/Footer.tsx` | Fetch person + socialLinks from Sanity |
| `src/components/Header.tsx` | Use nav config instead of content imports |
| `src/components/RouteGuard.tsx` | Change hardcoded "/blog" to "/sports" |

### Deleted (Task 16)
- `src/app/resources/content.js`
- `src/app/utils/utils.ts`
- `src/app/blog/` (entire folder: page.tsx, [slug]/page.tsx, posts/*.mdx)
- `src/app/work/projects/` (*.mdx files)

---

## Task 1: Install dependencies and initialize Sanity project

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Sanity packages**

```bash
pnpm add next-sanity sanity @sanity/image-url @portabletext/react @sanity/vision
```

Expected: packages install successfully, no peer dependency errors.

- [ ] **Step 2: Create Sanity project via CLI**

```bash
pnpm sanity init --env .env.local
```

When prompted:
- Select "Create new project"
- Name: `magic-portfolio`
- Dataset: `production` (default)
- Skip adding configuration files (we'll create them manually)

This writes `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` into `.env.local`.

- [ ] **Step 3: Add remaining env vars to .env.local**

Open `.env.local` and append:

```
SANITY_API_TOKEN=<create a read-only token at sanity.io/manage → API → Tokens>
SANITY_REVALIDATE_SECRET=<generate a random string, e.g. openssl rand -hex 32>
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install next-sanity and supporting packages"
```

---

## Task 2: Sanity environment config, client, and image helper

**Files:**
- Create: `src/sanity/env.ts`
- Create: `src/sanity/lib/client.ts`
- Create: `src/sanity/lib/image.ts`

- [ ] **Step 1: Create env.ts**

Create `src/sanity/env.ts`:

```ts
function assertValue<T>(v: T | undefined, message: string): T {
  if (v === undefined) throw new Error(message);
  return v;
}

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing env var: NEXT_PUBLIC_SANITY_DATASET"
);

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing env var: NEXT_PUBLIC_SANITY_PROJECT_ID"
);
```

- [ ] **Step 2: Create client.ts**

Create `src/sanity/lib/client.ts`:

```ts
import { createClient } from "next-sanity";
import { cache } from "react";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

export const sanityFetch = cache(
  async <T>({
    query,
    params = {},
    tags,
  }: {
    query: string;
    params?: Record<string, unknown>;
    tags?: string[];
  }): Promise<T> => {
    return client.fetch<T>(query, params, {
      next: { tags },
    });
  }
);
```

- [ ] **Step 3: Create image.ts**

Create `src/sanity/lib/image.ts`:

```ts
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/sanity/
git commit -m "feat: add Sanity client, env config, and image helper"
```

---

## Task 3: Set up embedded Studio at /studio

**Files:**
- Create: `sanity.config.ts`
- Create: `src/app/studio/[[...tool]]/page.tsx`

- [ ] **Step 1: Create sanity.config.ts at repo root**

Create `sanity.config.ts`:

```ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  apiVersion,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
```

- [ ] **Step 2: Create the Studio route**

Create `src/app/studio/[[...tool]]/page.tsx`:

```tsx
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 3: Create placeholder schema registry (required for Studio to load)**

Create `src/sanity/schemaTypes/index.ts`:

```ts
export const schemaTypes: never[] = [];
```

- [ ] **Step 4: Start dev server and verify Studio loads**

```bash
pnpm dev
```

Visit `http://localhost:3000/studio`. Expected: Sanity Studio loads with an empty schema list. If you see "Missing project ID" — double-check `.env.local` has `NEXT_PUBLIC_SANITY_PROJECT_ID`.

- [ ] **Step 5: Commit**

```bash
git add sanity.config.ts src/app/studio/
git commit -m "feat: add embedded Sanity Studio at /studio"
```

---

## Task 4: Define sportsPost and workProject schemas

**Files:**
- Create: `src/sanity/schemaTypes/sportsPost.ts`
- Create: `src/sanity/schemaTypes/workProject.ts`

- [ ] **Step 1: Create sportsPost schema**

Create `src/sanity/schemaTypes/sportsPost.ts`:

```ts
import { defineField, defineType } from "sanity";

export const sportsPost = defineType({
  name: "sportsPost",
  title: "Sports Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      type: "text",
      title: "Summary",
      rows: 3,
    }),
    defineField({
      name: "publishedAt",
      type: "date",
      title: "Published At",
    }),
    defineField({
      name: "tag",
      type: "string",
      title: "Tag",
    }),
    defineField({
      name: "coverImage",
      type: "image",
      title: "Cover Image",
      options: { hotspot: true },
    }),
    defineField({
      name: "body",
      type: "array",
      title: "Body",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage" },
  },
});
```

- [ ] **Step 2: Create workProject schema**

Create `src/sanity/schemaTypes/workProject.ts`:

```ts
import { defineField, defineType } from "sanity";

export const workProject = defineType({
  name: "workProject",
  title: "Work Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "summary",
      type: "text",
      title: "Summary",
      rows: 3,
    }),
    defineField({
      name: "publishedAt",
      type: "date",
      title: "Published At",
    }),
    defineField({
      name: "coverImage",
      type: "image",
      title: "Cover Image",
      options: { hotspot: true },
    }),
    defineField({
      name: "images",
      type: "array",
      title: "Additional Images",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "link",
      type: "url",
      title: "External Link",
    }),
    defineField({
      name: "body",
      type: "array",
      title: "Body",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage" },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/
git commit -m "feat: add sportsPost and workProject Sanity schemas"
```

---

## Task 5: Define person and pageSettings singleton schemas

**Files:**
- Create: `src/sanity/schemaTypes/person.ts`
- Create: `src/sanity/schemaTypes/pageSettings.ts`

- [ ] **Step 1: Create person schema**

Create `src/sanity/schemaTypes/person.ts`:

```ts
import { defineField, defineType } from "sanity";

export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    defineField({ name: "firstName", type: "string", title: "First Name" }),
    defineField({ name: "lastName", type: "string", title: "Last Name" }),
    defineField({ name: "role", type: "string", title: "Role" }),
    defineField({
      name: "avatar",
      type: "image",
      title: "Avatar",
      options: { hotspot: true },
    }),
    defineField({ name: "email", type: "string", title: "Email" }),
    defineField({
      name: "location",
      type: "string",
      title: "Location (IANA timezone)",
      description: "e.g. Europe/Budapest",
    }),
    defineField({
      name: "languages",
      type: "array",
      title: "Languages",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "introText",
      type: "array",
      title: "Intro Text (About page)",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: { title: "firstName", subtitle: "role", media: "avatar" },
  },
});
```

- [ ] **Step 2: Create pageSettings schema**

Create `src/sanity/schemaTypes/pageSettings.ts`:

```ts
import { defineField, defineType } from "sanity";

export const pageSettings = defineType({
  name: "pageSettings",
  title: "Page Settings",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      type: "string",
      title: "Hero Headline",
      description: "e.g. Welcome to my website!",
    }),
    defineField({
      name: "subline",
      type: "text",
      title: "Hero Subline",
      rows: 3,
    }),
    defineField({
      name: "contactCtaTitle",
      type: "string",
      title: "Contact CTA Label",
      description: "e.g. Let's connect",
    }),
    defineField({
      name: "featuredLabel",
      type: "string",
      title: "Featured Banner Label",
      description: "e.g. Currently working on:",
    }),
    defineField({
      name: "featuredProject",
      type: "reference",
      title: "Featured Project",
      to: [{ type: "workProject" }],
    }),
    defineField({
      name: "projectsSectionTitle",
      type: "string",
      title: "Projects Section Title",
      description: "e.g. Latest Projects",
    }),
    defineField({
      name: "sportsSectionTitle",
      type: "string",
      title: "Sports Section Title",
      description: "e.g. Recent from Sports",
    }),
  ],
  preview: {
    select: { title: "headline" },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/
git commit -m "feat: add person and pageSettings singleton schemas"
```

---

## Task 6: Define supporting schemas and register all

**Files:**
- Create: `src/sanity/schemaTypes/skill.ts`
- Create: `src/sanity/schemaTypes/workExperience.ts`
- Create: `src/sanity/schemaTypes/socialLink.ts`
- Create: `src/sanity/schemaTypes/galleryImage.ts`
- Modify: `src/sanity/schemaTypes/index.ts`

- [ ] **Step 1: Create skill schema**

Create `src/sanity/schemaTypes/skill.ts`:

```ts
import { defineField, defineType } from "sanity";

export const skill = defineType({
  name: "skill",
  title: "Skill",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "icon",
      type: "string",
      title: "Icon path",
      description: "e.g. /trademark/typescript.svg",
    }),
    defineField({
      name: "href",
      type: "url",
      title: "Link",
    }),
    defineField({
      name: "projects",
      type: "array",
      title: "Related Projects",
      of: [{ type: "reference", to: [{ type: "workProject" }] }],
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});
```

- [ ] **Step 2: Create workExperience schema**

Create `src/sanity/schemaTypes/workExperience.ts`:

```ts
import { defineField, defineType } from "sanity";

export const workExperience = defineType({
  name: "workExperience",
  title: "Work Experience",
  type: "document",
  fields: [
    defineField({ name: "company", type: "string", title: "Company" }),
    defineField({ name: "timeframe", type: "string", title: "Timeframe" }),
    defineField({ name: "role", type: "string", title: "Role" }),
    defineField({
      name: "order",
      type: "number",
      title: "Display Order",
      description: "Lower number appears first (1 = most recent)",
    }),
    defineField({
      name: "achievements",
      type: "array",
      title: "Achievements",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: { title: "company", subtitle: "role" },
  },
});
```

- [ ] **Step 3: Create socialLink schema**

Create `src/sanity/schemaTypes/socialLink.ts`:

```ts
import { defineField, defineType } from "sanity";

export const socialLink = defineType({
  name: "socialLink",
  title: "Social Link",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", title: "Name" }),
    defineField({
      name: "icon",
      type: "string",
      title: "Icon key",
      description: "One of: github, linkedin, email, x",
    }),
    defineField({ name: "url", type: "url", title: "URL" }),
    defineField({
      name: "order",
      type: "number",
      title: "Display Order",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "url" },
  },
});
```

- [ ] **Step 4: Create galleryImage schema**

Create `src/sanity/schemaTypes/galleryImage.ts`:

```ts
import { defineField, defineType } from "sanity";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Image",
  type: "document",
  fields: [
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({ name: "alt", type: "string", title: "Alt Text" }),
    defineField({
      name: "orientation",
      type: "string",
      title: "Orientation",
      options: {
        list: [
          { title: "Horizontal", value: "horizontal" },
          { title: "Vertical", value: "vertical" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "order",
      type: "number",
      title: "Display Order",
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
});
```

- [ ] **Step 5: Register all schemas**

Replace `src/sanity/schemaTypes/index.ts`:

```ts
import { sportsPost } from "./sportsPost";
import { workProject } from "./workProject";
import { person } from "./person";
import { pageSettings } from "./pageSettings";
import { skill } from "./skill";
import { workExperience } from "./workExperience";
import { socialLink } from "./socialLink";
import { galleryImage } from "./galleryImage";

export const schemaTypes = [
  sportsPost,
  workProject,
  person,
  pageSettings,
  skill,
  workExperience,
  socialLink,
  galleryImage,
];
```

- [ ] **Step 6: Verify Studio shows all schemas**

```bash
pnpm dev
```

Visit `http://localhost:3000/studio`. Expected: all 8 document types appear in the Studio sidebar (Sports Post, Work Project, Person, Page Settings, Skill, Work Experience, Social Link, Gallery Image).

- [ ] **Step 7: Commit**

```bash
git add src/sanity/schemaTypes/
git commit -m "feat: add all Sanity schemas and register them"
```

---

## Task 7: Write GROQ queries

**Files:**
- Create: `src/sanity/lib/queries.ts`

- [ ] **Step 1: Create queries.ts**

Create `src/sanity/lib/queries.ts`:

```ts
import { groq } from "next-sanity";

// Sports posts
export const ALL_SPORTS_POSTS_QUERY = groq`
  *[_type == "sportsPost"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    tag,
    coverImage
  }
`;

export const SPORTS_POST_BY_SLUG_QUERY = groq`
  *[_type == "sportsPost" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    tag,
    coverImage,
    body
  }
`;

export const ALL_SPORTS_POST_SLUGS_QUERY = groq`
  *[_type == "sportsPost"] { "slug": slug.current }
`;

// Work projects
export const ALL_WORK_PROJECTS_QUERY = groq`
  *[_type == "workProject"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    coverImage,
    images,
    link
  }
`;

export const WORK_PROJECT_BY_SLUG_QUERY = groq`
  *[_type == "workProject" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    coverImage,
    images,
    link,
    body
  }
`;

export const ALL_WORK_PROJECT_SLUGS_QUERY = groq`
  *[_type == "workProject"] { "slug": slug.current }
`;

// Person (singleton)
export const PERSON_QUERY = groq`
  *[_type == "person"][0] {
    firstName,
    lastName,
    "name": firstName + " " + lastName,
    role,
    avatar,
    email,
    location,
    languages,
    introText
  }
`;

// Skills — projects projected as slug strings to match existing Skill interface
export const ALL_SKILLS_QUERY = groq`
  *[_type == "skill"] | order(_createdAt asc) {
    _id,
    title,
    "src": icon,
    href,
    "projects": projects[]->slug.current
  }
`;

// Work experience
export const WORK_EXPERIENCE_QUERY = groq`
  *[_type == "workExperience"] | order(order asc) {
    _id,
    company,
    timeframe,
    role,
    achievements
  }
`;

// Social links
export const SOCIAL_LINKS_QUERY = groq`
  *[_type == "socialLink"] | order(order asc) {
    _id,
    name,
    icon,
    "link": url
  }
`;

// Gallery images
export const GALLERY_IMAGES_QUERY = groq`
  *[_type == "galleryImage"] | order(order asc) {
    _id,
    image,
    alt,
    orientation
  }
`;

// Page settings (singleton)
export const PAGE_SETTINGS_QUERY = groq`
  *[_type == "pageSettings"][0] {
    headline,
    subline,
    contactCtaTitle,
    featuredLabel,
    "featuredProject": featuredProject-> {
      title,
      "slug": slug.current
    },
    projectsSectionTitle,
    sportsSectionTitle
  }
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/sanity/lib/queries.ts
git commit -m "feat: add GROQ query library"
```

---

## Task 8: Seed content in Sanity Studio

No code changes. This task enters all existing content into Studio before touching any page code.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

Go to `http://localhost:3000/studio`.

- [ ] **Step 2: Create Person document (singleton)**

Click "Person" → "Create". Fill in:
- First Name: Ernesto
- Last Name: Tzompantzi
- Role: Frontend Developer
- Avatar: upload `public/images/portfolio-avatar-bw.jpg`
- Email: ivan.tzompantzi96@gmail.com
- Location: Europe/Budapest
- Languages: add "English", add "Spanish"
- Intro Text: enter the two paragraphs from `content.js` `about.intro.description` as separate blocks

Click Publish.

- [ ] **Step 3: Create Work Project documents**

Create two Work Project documents from `src/app/work/projects/`:

**german-oneshop.mdx** → Work Project:
- Title: (from MDX frontmatter title)
- Slug: german-oneshop (generate from title)
- Summary: (from MDX summary)
- Published At: (from MDX publishedAt)
- Cover Image: (from MDX image field if present)
- Link: (from MDX link field if present)
- Body: copy the MDX content, re-enter as blocks in the Studio editor

**czech-mobile-app.mdx** → Work Project: same process.

Click Publish on each.

- [ ] **Step 4: Create Skill documents**

Create one Skill document per entry in `content.js` `person.skills` array (15 skills). For each:
- Title: e.g. TypeScript
- Icon path: e.g. /trademark/typescript.svg
- Link: e.g. https://www.typescriptlang.org/
- Related Projects: select the referenced work projects

Click Publish on each.

- [ ] **Step 5: Create Work Experience documents**

Create three Work Experience documents from `content.js` `about.work.experiences`:
- Company, Timeframe, Role, Order (1=most recent, 2, 3)
- Achievements: enter each achievement paragraph as a separate block

Click Publish on each.

- [ ] **Step 6: Create Social Link documents**

Create four Social Link documents from `content.js` `social`:
- GitHub: icon=github, url=https://github.com/Ernesto-Tz, order=1
- LinkedIn: icon=linkedin, url=https://www.linkedin.com/..., order=2
- X: icon=x, url=(empty — leave blank), order=3
- Email: icon=email, url=mailto:ivan.tzompantzi96@gmail.com, order=4

Note: the social link for X has no URL — skip creating it or leave URL blank (the Footer already filters out items with no link).

Click Publish on each.

- [ ] **Step 7: Create Gallery Image documents**

Create one Gallery Image document for each image in `content.js` `gallery.images`. Upload each image from `public/images/gallery/`. Set orientation (horizontal/vertical) and display order.

Click Publish on each.

- [ ] **Step 8: Create Sports Post documents**

Create three Sports Post documents from `src/app/blog/posts/`:
- ai-and-running.mdx → title, slug, summary, publishedAt, tag, coverImage (upload from public), body
- frontend-future-with-ai.mdx → same
- merge-or-rebase.mdx → same

Click Publish on each.

- [ ] **Step 9: Create Page Settings document (singleton)**

Click "Page Settings" → "Create". Fill in:
- Headline: Welcome to my website! My name is Ernesto,
- Subline: I am a frontend developer passionate about crafting projects, tackling challenges and blending my creativity with technical skills.
- Contact CTA Label: Let's connect 🤙
- Featured Banner Label: Currently working on:
- Featured Project: select "Vodafone Germany Webshop" (german-oneshop)
- Projects Section Title: Latest Projects
- Sports Section Title: Recent from Sports

Click Publish.

- [ ] **Step 10: Verify content in Vision tab**

In Studio, open the Vision tab. Run this query to confirm data is there:

```groq
*[_type in ["person", "pageSettings", "workProject", "sportsPost"]] {
  _type,
  _id
}
```

Expected: documents for all four types.

---

## Task 9: Migrate home page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update page.tsx to fetch from Sanity**

Replace the entire file `src/app/page.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Reveal } from "@/components/Reveal";
import { Projects } from "@/components/work/Projects";
import { Posts } from "@/components/blog/Posts";
import { SkillsMarquee } from "@/components/SkillsMarquee";
import { JsonLd } from "@/components/JsonLd";
import { baseURL, routes } from "@/app/resources";
import { Metadata } from "next";
import { Mail } from "lucide-react";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  PERSON_QUERY,
  ALL_SKILLS_QUERY,
  PAGE_SETTINGS_QUERY,
  ALL_WORK_PROJECTS_QUERY,
  ALL_SPORTS_POSTS_QUERY,
} from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Ernesto Tzompantzi's Portfolio",
  description: "Portfolio website showcasing my work as a Frontend Developer",
  openGraph: {
    title: "Ernesto Tzompantzi's Portfolio",
    description: "Portfolio website showcasing my work as a Frontend Developer",
    url: baseURL,
    images: ["/images/og/home.jpg"],
  },
};

function SectionMarker({ number, label }: { number: string; label?: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="font-code text-[0.65rem] tracking-[0.25em] text-primary whitespace-nowrap">
        {number}
      </span>
      {label && (
        <span className="font-code text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/40 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default async function Home() {
  const [person, skills, pageSettings, workProjects, sportsPosts] = await Promise.all([
    sanityFetch<{
      firstName: string;
      name: string;
      role: string;
      avatar: unknown;
      email: string;
    }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; title: string; src: string; href: string }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{
      headline: string;
      subline: string;
      contactCtaTitle: string;
      featuredLabel: string;
      featuredProject: { title: string; slug: string } | null;
      projectsSectionTitle: string;
      sportsSectionTitle: string;
    }>({ query: PAGE_SETTINGS_QUERY, tags: ["pageSettings"] }),
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      coverImage: unknown;
      images: unknown[];
      link?: string;
    }[]>({ query: ALL_WORK_PROJECTS_QUERY, tags: ["workProject"] }),
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      tag?: string;
      coverImage: unknown;
    }[]>({ query: ALL_SPORTS_POSTS_QUERY, tags: ["sportsPost"] }),
  ]);

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(200).url() : "";

  return (
    <div className="w-full max-w-screen-md flex flex-col gap-20 items-center pb-20">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/"
        title="Ernesto Tzompantzi's Portfolio"
        description="Portfolio website showcasing my work as a Frontend Developer"
        image={`${baseURL}/og?title=${encodeURIComponent("Ernesto Tzompantzi's Portfolio")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: avatarUrl,
        }}
      />

      {/* 01 · HERO */}
      <div className="w-full flex flex-col gap-6 pt-8">
        <SectionMarker number="01" label="Introduction" />

        <Reveal translateY={4}>
          <p className="font-code text-[0.58rem] tracking-[0.22em] uppercase text-accent mb-3">
            {person.role}
          </p>
          <h1
            className="text-5xl sm:text-6xl tracking-[-0.025em] text-balance font-primary"
            style={{ lineHeight: "1.0" }}
          >
            <span style={{ fontWeight: 700 }}>Hello, I&apos;m </span>
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "hsl(var(--primary))" }}>
              {person.firstName}
            </em>
          </h1>
        </Reveal>

        <Reveal translateY={8} delay={0.2}>
          <p className="text-base text-muted-foreground max-w-[48ch] leading-relaxed text-balance">
            {pageSettings.subline}
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              className="rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href={`mailto:${person.email}`}>
                <Mail className="h-4 w-4" />
                {pageSettings.contactCtaTitle}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full gap-2">
              <Link href="/about">
                <Avatar className="w-5 h-5 -ml-1">
                  <AvatarImage src={avatarUrl} alt={person.name} />
                  <AvatarFallback>{person.firstName[0]}</AvatarFallback>
                </Avatar>
                More about me
              </Link>
            </Button>
          </div>
        </Reveal>

        {pageSettings.featuredProject && (
          <Reveal delay={0.5}>
            <Link
              href={`/work/${pageSettings.featuredProject.slug}`}
              className="flex items-center gap-3 w-full bg-card border border-border rounded-md px-4 py-3 hover:bg-secondary transition-colors group"
              style={{ borderLeftWidth: "2px", borderLeftColor: "hsl(var(--accent))" }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: "hsl(var(--accent))",
                  boxShadow: "0 0 6px hsl(var(--accent) / 0.6)",
                }}
              />
              <span className="font-code text-[0.55rem] tracking-[0.08em] text-muted-foreground">
                {pageSettings.featuredLabel}{" "}
                <strong className="ml-4">{pageSettings.featuredProject.title}</strong>
              </span>
              <span className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors text-xs">
                →
              </span>
            </Link>
          </Reveal>
        )}
      </div>

      {/* 02 · SKILLS */}
      <div className="w-full flex flex-col gap-6">
        <SectionMarker number="02" label="Skills & Tools" />
        <Reveal translateY={8} delay={0.1}>
          <SkillsMarquee skills={skills} />
        </Reveal>
      </div>

      {/* 03 · SELECTED WORK */}
      <div className="w-full flex flex-col gap-6">
        <SectionMarker number="03" label={pageSettings.projectsSectionTitle} />
        <Reveal translateY={16} delay={0.15}>
          <Projects projects={workProjects} range={[1, 2]} />
        </Reveal>
      </div>

      {/* 04 · FROM SPORTS */}
      {routes["/sports"] && (
        <div className="w-full flex flex-col gap-6">
          <SectionMarker number="04" label={pageSettings.sportsSectionTitle} />
          <Posts posts={sportsPosts} range={[1, 2]} columns="2" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify home page loads**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: hero shows Sanity data (name, role, subline, featured project, skills marquee). The Projects and Posts sections will not render yet (components need updating in Tasks 11–12) — that is expected at this step.

---

## Task 10: Migrate about page

**Files:**
- Modify: `src/app/about/page.tsx`

- [ ] **Step 1: Update about/page.tsx**

Replace the entire file `src/app/about/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TableOfContents from "@/components/about/TableOfContents";
import { JsonLd } from "@/components/JsonLd";
import { baseURL } from "@/app/resources";
import { Metadata } from "next";
import React from "react";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  PERSON_QUERY,
  ALL_SKILLS_QUERY,
  WORK_EXPERIENCE_QUERY,
  SOCIAL_LINKS_QUERY,
} from "@/sanity/lib/queries";

const iconMap: Record<string, React.ElementType> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: Mail,
  x: FaXTwitter,
};

export const metadata: Metadata = {
  title: "More about me 😎",
  description: "Meet Ernesto Tzompantzi, Frontend Developer",
  openGraph: {
    title: "More about me 😎",
    description: "Meet Ernesto Tzompantzi, Frontend Developer",
    url: `${baseURL}/about`,
    images: [`${baseURL}/og?title=${encodeURIComponent("More about me 😎")}`],
  },
};

function SectionDivider({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-code text-[0.65rem] tracking-[0.25em] text-primary/70 whitespace-nowrap">
        {number}
      </span>
      <span className="font-code text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground/50 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default async function About() {
  const [person, skills, workExperiences, socialLinks] = await Promise.all([
    sanityFetch<{
      firstName: string;
      name: string;
      role: string;
      avatar: unknown;
      location: string;
      languages: string[];
      introText: unknown[];
    }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; title: string; src: string; href: string }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{
      _id: string;
      company: string;
      timeframe: string;
      role: string;
      achievements: unknown[];
    }[]>({ query: WORK_EXPERIENCE_QUERY, tags: ["workExperience"] }),
    sanityFetch<{ _id: string; name: string; icon: string; link: string }[]>({
      query: SOCIAL_LINKS_QUERY,
      tags: ["socialLink"],
    }),
  ]);

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(400).url() : "";

  const structure = [
    { title: "Introduction", display: true, items: [] },
    { title: "Work Experience", display: true, items: workExperiences.map((e) => e.company) },
    { title: "Studies", display: true, items: ["Obuda University, Hungary"] },
    { title: "Technical skills", display: true, items: skills.map((s) => s.title) },
  ];

  return (
    <div className="w-full max-w-screen-md">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/about"
        title="More about me 😎"
        description="Meet Ernesto Tzompantzi, Frontend Developer"
        image={`${baseURL}/og?title=${encodeURIComponent("More about me 😎")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: avatarUrl,
        }}
      />

      {/* Fixed ToC sidebar */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 pl-6 gap-8 hidden lg:flex flex-col">
        <TableOfContents
          structure={structure}
          about={{
            tableOfContent: { display: true, subItems: false },
            intro: { display: true, title: "Introduction" },
            work: { display: true, title: "Work Experience" },
            studies: { display: true, title: "Studies" },
            technical: { display: true, title: "Technical skills" },
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-8">
        {/* Sticky avatar column */}
        <div className="sm:sticky sm:top-20 flex flex-col items-center gap-3 min-w-[160px] px-4 pb-8 self-start">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl} alt={person.name} />
            <AvatarFallback>{person.firstName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {person.location}
          </div>
          {person.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {person.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-[9] max-w-[640px] flex flex-col">
          {/* Hero */}
          <div id="Introduction" className="min-h-[160px] flex flex-col justify-center mb-8">
            <h1 className="text-4xl font-bold font-primary">{person.name}</h1>
            <p className="text-lg text-primary/70 mt-1">{person.role}</p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {socialLinks.map((item) => {
                  if (!item.link) return null;
                  const Icon = iconMap[item.icon] ?? Mail;
                  return (
                    <React.Fragment key={item.name}>
                      <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-xs">
                        <Link href={item.link} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-3.5 w-3.5" />
                          {item.name}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="icon" className="sm:hidden w-8 h-8">
                        <Link href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Intro */}
          <>
            <SectionDivider number="01" label="Introduction" />
            <div className="text-base leading-relaxed mb-10 flex flex-col gap-4">
              <PortableText value={person.introText} />
            </div>
          </>

          {/* Work Experience */}
          <>
            <SectionDivider number="02" label="Work Experience" />
            <h2 id="Work Experience" className="text-2xl font-bold font-primary mb-4">
              Work Experience
            </h2>
            <div className="flex flex-col gap-8 mb-10">
              {workExperiences.map((exp, i) => (
                <div key={exp._id} className="flex flex-col">
                  <div className="flex justify-between items-end mb-1 flex-wrap gap-1">
                    <span id={exp.company} className="text-base font-semibold">
                      {exp.role}
                    </span>
                    <span className="text-xs text-muted-foreground">{exp.timeframe}</span>
                  </div>
                  <span className="text-sm text-primary/70 mb-3">{exp.company}</span>
                  <div className="text-sm text-foreground/80 leading-relaxed flex flex-col gap-3">
                    <PortableText value={exp.achievements} />
                  </div>
                </div>
              ))}
            </div>
          </>

          {/* Studies */}
          <>
            <SectionDivider number="03" label="Studies" />
            <h2 id="Studies" className="text-2xl font-bold font-primary mb-4">
              Studies
            </h2>
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end flex-wrap gap-1">
                  <span id="Obuda University, Hungary" className="text-base font-semibold">
                    Bachelor of Computer Science Engineering
                  </span>
                  <span className="text-xs text-muted-foreground">SEP 2017 - DIC 2021</span>
                </div>
                <span className="text-sm text-primary/70">Obuda University, Hungary</span>
              </div>
            </div>
          </>

          {/* Technical skills */}
          <>
            <SectionDivider number="04" label="Technical skills" />
            <h2 id="Technical skills" className="text-2xl font-bold font-primary mb-8">
              Technical skills
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-10">
              {skills.map((skill, i) => (
                <Link
                  key={skill._id}
                  href={skill.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-secondary transition-colors"
                  title={skill.title}
                >
                  <Image
                    src={skill.src}
                    alt={skill.title}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-xs text-muted-foreground text-center">{skill.title}</span>
                </Link>
              ))}
            </div>
          </>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify about page**

```bash
pnpm dev
```

Visit `http://localhost:3000/about`. Expected: name, role, avatar, intro text, social links, work experience, skills grid all render from Sanity data.

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: migrate about page to Sanity"
```

---

## Task 11: Migrate work pages and Projects component

**Files:**
- Modify: `src/components/work/Projects.tsx`
- Modify: `src/app/work/page.tsx`
- Modify: `src/app/work/[slug]/page.tsx`

- [ ] **Step 1: Update Projects component to accept props**

Replace `src/components/work/Projects.tsx`:

```tsx
import { ProjectCard } from "@/components";
import { urlFor } from "@/sanity/lib/image";

interface Project {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  coverImage: unknown;
  images?: unknown[];
  link?: string;
}

interface ProjectsProps {
  projects: Project[];
  range?: [number, number?];
}

export function Projects({ projects, range }: ProjectsProps) {
  const sorted = [...projects].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const displayed = range
    ? sorted.slice(range[0] - 1, range[1] ?? sorted.length)
    : sorted;

  return (
    <div className="w-full flex flex-col gap-12 mb-10 px-4">
      {displayed.map((project, index) => {
        const imageUrl = project.coverImage
          ? urlFor(project.coverImage).width(960).url()
          : "";

        return (
          <ProjectCard
            priority={index < 2}
            key={project._id}
            href={`work/${project.slug}`}
            images={imageUrl ? [imageUrl] : []}
            title={project.title}
            description={project.summary}
            content="has_body"
            avatars={[]}
            link={project.link || ""}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update work/page.tsx**

Replace `src/app/work/page.tsx`:

```tsx
import { baseURL } from "@/app/resources";
import { Projects } from "@/components/work/Projects";
import { JsonLd } from "@/components/JsonLd";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { ALL_WORK_PROJECTS_QUERY, PERSON_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Projects — Ernesto Tzompantzi",
  description: "Collaborations & projects by Ernesto Tzompantzi",
  openGraph: {
    title: "Projects — Ernesto Tzompantzi",
    description: "Collaborations & projects by Ernesto Tzompantzi",
    url: `${baseURL}/work`,
    images: [`${baseURL}/og?title=${encodeURIComponent("Projects — Ernesto Tzompantzi")}`],
  },
};

export default async function Work() {
  const [projects, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      coverImage: unknown;
      images?: unknown[];
      link?: string;
    }[]>({ query: ALL_WORK_PROJECTS_QUERY, tags: ["workProject"] }),
    sanityFetch<{ name: string; avatar: unknown }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  return (
    <div className="w-full max-w-screen-md">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/work"
        title="Projects — Ernesto Tzompantzi"
        description="Collaborations & projects by Ernesto Tzompantzi"
        image={`${baseURL}/og?title=${encodeURIComponent("Projects — Ernesto Tzompantzi")}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: "",
        }}
      />
      <Projects projects={projects} />
    </div>
  );
}
```

- [ ] **Step 3: Update work/[slug]/page.tsx**

Replace `src/app/work/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { about, baseURL } from "@/app/resources";
import { formatDate } from "@/app/utils/formatDate";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  WORK_PROJECT_BY_SLUG_QUERY,
  ALL_WORK_PROJECT_SLUGS_QUERY,
  ALL_SKILLS_QUERY,
  PERSON_QUERY,
} from "@/sanity/lib/queries";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const projects = await sanityFetch<{ slug: string }[]>({
    query: ALL_WORK_PROJECT_SLUGS_QUERY,
    tags: ["workProject"],
  });
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await sanityFetch<{
    title: string;
    summary: string;
    coverImage: unknown;
  } | null>({
    query: WORK_PROJECT_BY_SLUG_QUERY,
    params: { slug },
    tags: ["workProject"],
  });
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: [
        project.coverImage
          ? urlFor(project.coverImage).width(1200).url()
          : `${baseURL}/og?title=${project.title}`,
      ],
    },
  };
}

export default async function WorkPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [project, skills, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      body: unknown[];
    } | null>({
      query: WORK_PROJECT_BY_SLUG_QUERY,
      params: { slug },
      tags: ["workProject"],
    }),
    sanityFetch<{ _id: string; title: string; src: string; projects?: string[] }[]>({
      query: ALL_SKILLS_QUERY,
      tags: ["skill"],
    }),
    sanityFetch<{ name: string; avatar: unknown }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  if (!project) notFound();

  const techSkills = skills.filter(
    (s) => Array.isArray(s.projects) && s.projects.includes(slug)
  );

  return (
    <div className="w-full max-w-screen-sm flex flex-col gap-6">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path={`/work/${project.slug}`}
        title={project.title}
        description={project.summary}
        image={`${baseURL}/og?title=${encodeURIComponent(project.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}/about`,
          image: "",
        }}
      />
      <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 gap-1 text-muted-foreground">
        <Link href="/work">
          <ChevronLeft className="h-4 w-4" />
          Work
        </Link>
      </Button>
      <h1 className="text-3xl font-bold font-primary">{project.title}</h1>
      <p className="text-sm text-muted-foreground">
        {project.publishedAt && formatDate(project.publishedAt)}
      </p>
      <article className="w-full prose prose-invert max-w-none">
        <PortableText value={project.body} />
      </article>
      {techSkills.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-bold font-primary">Technologies Used</h2>
          <div className="flex flex-wrap gap-2">
            {techSkills.map((skill) => (
              <Badge key={skill._id} variant="secondary">
                {skill.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify work pages**

```bash
pnpm dev
```

Visit `http://localhost:3000/work` — expected: project cards render from Sanity.
Visit `http://localhost:3000/work/german-oneshop` — expected: project detail page with Portable Text body.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/Projects.tsx src/app/work/
git commit -m "feat: migrate work pages to Sanity"
```

---

## Task 12: Create sports route and update Posts/Post components

**Files:**
- Create: `src/app/sports/page.tsx`
- Create: `src/app/sports/[slug]/page.tsx`
- Modify: `src/components/blog/Posts.tsx`
- Modify: `src/components/blog/Post.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/RouteGuard.tsx`

- [ ] **Step 1: Update Posts component to accept props**

Replace `src/components/blog/Posts.tsx`:

```tsx
import Post from "./Post";
import { cn } from "@/lib/utils";

interface SportsPost {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string;
  tag?: string;
  coverImage?: unknown;
}

interface PostsProps {
  posts: SportsPost[];
  range?: [number, number?];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
}

export function Posts({
  posts,
  range,
  columns = "1",
  thumbnail = false,
  direction,
}: PostsProps) {
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const displayed = range
    ? sorted.slice(range[0] - 1, range[1] ?? sorted.length)
    : sorted;

  const gridCols =
    columns === "2"
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === "3"
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1";

  if (displayed.length === 0) return null;

  return (
    <div className={cn("grid gap-3 w-full mb-10", gridCols)}>
      {displayed.map((post) => (
        <Post key={post._id} post={post} thumbnail={thumbnail} direction={direction} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update Post component to use /sports/ route**

Replace `src/components/blog/Post.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/app/utils/formatDate";
import { cn } from "@/lib/utils";

interface SportsPost {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  tag?: string;
  coverImage?: unknown;
}

interface PostProps {
  post: SportsPost;
  thumbnail: boolean;
  direction?: "row" | "column";
}

export default function Post({ post, thumbnail, direction }: PostProps) {
  return (
    <Link
      href={`/sports/${post.slug}`}
      className="group block w-full rounded-xl border border-border hover:border-border/80 hover:bg-secondary/40 transition-all duration-200"
    >
      <div className={cn("relative flex", direction === "row" ? "flex-row" : "flex-col")}>
        <div className="flex flex-col gap-1 p-5">
          <h2 className="text-base font-semibold text-balance leading-snug group-hover:text-primary transition-colors font-primary">
            {post.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatDate(post.publishedAt, false)}
          </p>
          {post.tag && (
            <Badge variant="secondary" className="w-fit mt-2 text-xs">
              {post.tag}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create sports/page.tsx**

Create `src/app/sports/page.tsx`:

```tsx
import { baseURL } from "@/app/resources";
import { Posts } from "@/components/blog/Posts";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { ALL_SPORTS_POSTS_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Sports — Ernesto Tzompantzi",
  description: "My thoughts on sports, running, and more",
  openGraph: {
    title: "Sports — Ernesto Tzompantzi",
    description: "My thoughts on sports, running, and more",
    url: `${baseURL}/sports`,
  },
};

export default async function Sports() {
  const posts = await sanityFetch<{
    _id: string;
    title: string;
    slug: string;
    summary: string;
    publishedAt: string;
    tag?: string;
    coverImage?: unknown;
  }[]>({ query: ALL_SPORTS_POSTS_QUERY, tags: ["sportsPost"] });

  return (
    <div className="w-full max-w-screen-md flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-primary">Sports</h1>
      <Posts posts={posts} thumbnail columns="1" />
    </div>
  );
}
```

- [ ] **Step 4: Create sports/[slug]/page.tsx**

Create `src/app/sports/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { baseURL } from "@/app/resources";
import { formatDate } from "@/app/utils/formatDate";
import { JsonLd } from "@/components/JsonLd";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  SPORTS_POST_BY_SLUG_QUERY,
  ALL_SPORTS_POST_SLUGS_QUERY,
  PERSON_QUERY,
} from "@/sanity/lib/queries";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await sanityFetch<{ slug: string }[]>({
    query: ALL_SPORTS_POST_SLUGS_QUERY,
    tags: ["sportsPost"],
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<{
    title: string;
    summary: string;
    coverImage?: unknown;
  } | null>({
    query: SPORTS_POST_BY_SLUG_QUERY,
    params: { slug },
    tags: ["sportsPost"],
  });
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [
        post.coverImage
          ? urlFor(post.coverImage).width(1200).url()
          : `${baseURL}/og?title=${post.title}`,
      ],
    },
  };
}

export default async function SportsPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      title: string;
      slug: string;
      summary: string;
      publishedAt: string;
      body: unknown[];
    } | null>({
      query: SPORTS_POST_BY_SLUG_QUERY,
      params: { slug },
      tags: ["sportsPost"],
    }),
    sanityFetch<{ name: string; avatar: unknown }>({
      query: PERSON_QUERY,
      tags: ["person"],
    }),
  ]);

  if (!post) notFound();

  const avatarUrl = person.avatar ? urlFor(person.avatar).width(200).url() : "";

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-screen-sm flex flex-col gap-6">
        <JsonLd
          type="BlogPosting"
          baseURL={baseURL}
          path={`/sports/${post.slug}`}
          title={post.title}
          description={post.summary}
          datePublished={post.publishedAt}
          dateModified={post.publishedAt}
          image={`${baseURL}/og?title=${encodeURIComponent(post.title)}`}
          author={{
            name: person.name,
            url: `${baseURL}/about`,
            image: avatarUrl,
          }}
        />
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 gap-1 text-muted-foreground">
          <Link href="/sports">
            <ChevronLeft className="h-4 w-4" />
            Sports
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-primary">{post.title}</h1>
        <div className="flex items-center gap-3">
          <Avatar className="w-6 h-6 border-2 border-background">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{person.name[0]}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            {post.publishedAt && formatDate(post.publishedAt)}
          </p>
        </div>
        <article className="w-full prose prose-invert max-w-none">
          <PortableText value={post.body} />
        </article>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update Header to use config nav labels**

In a later task (Task 14) we add `nav` to config.js. For now, update `src/components/Header.tsx` to replace content.js imports with inline strings temporarily, and change the route check:

Replace the import line:
```tsx
import { person, about, blog, work } from "@/app/resources/content";
```
With:
```tsx
import { nav, routes, display } from "@/app/resources";
```

Replace usages in the JSX:
- `person.location` → `nav.timezone`
- `about.label` → `nav.aboutLabel`
- `work.label` → `nav.workLabel`
- `blog.label` → `nav.sportsLabel`
- `routes["/blog"]` → `routes["/sports"]`
- `pathname.startsWith("/blog")` → `pathname.startsWith("/sports")`
- `href="/blog"` → `href="/sports"`

The full updated Header is:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, User, LayoutGrid, Dumbbell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { routes, display, nav } from "@/app/resources";
import { ThemeToggle } from "./ThemeToggle";

type TimeDisplayProps = { timeZone: string; locale?: string };

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeZone, locale = "en-GB" }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setCurrentTime(new Intl.DateTimeFormat(locale, options).format(now));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [timeZone, locale]);

  return <>{currentTime}</>;
};

function NavButton({
  href,
  selected,
  icon: Icon,
  label,
}: {
  href: string;
  selected: boolean;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "hidden sm:flex gap-1.5 text-xs font-normal h-8 px-3",
          selected
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Link href={href}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className={cn(
          "sm:hidden w-8 h-8",
          selected
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Link href={href}>
          <Icon className="h-4 w-4" />
        </Link>
      </Button>
    </>
  );
}

export const Header = () => {
  const pathname = usePathname() ?? "";

  return (
    <>
      <div className="hidden sm:block fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-[9] pointer-events-none" />
      <div className="sm:hidden fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-[9] pointer-events-none" />

      <header className="sticky top-0 sm:relative z-[9] w-full flex items-center justify-center px-2 py-2">
        <div className="flex-1 hidden sm:flex pl-3 text-xs text-muted-foreground">
          {display.location && nav.timezone}
        </div>

        <div className="flex items-center bg-card border border-border rounded-[10px] shadow-lg px-1 py-1 gap-1">
          {routes["/"] && (
            <NavButton href="/" selected={pathname === "/"} icon={Home} label="Home" />
          )}
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          {routes["/about"] && (
            <NavButton href="/about" selected={pathname === "/about"} icon={User} label={nav.aboutLabel} />
          )}
          {routes["/work"] && (
            <NavButton href="/work" selected={pathname.startsWith("/work")} icon={LayoutGrid} label={nav.workLabel} />
          )}
          {routes["/sports"] && (
            <NavButton href="/sports" selected={pathname.startsWith("/sports")} icon={Dumbbell} label={nav.sportsLabel} />
          )}
          {display.themeSwitcher && (
            <>
              <Separator orientation="vertical" className="h-5 mx-0.5" />
              <ThemeToggle />
            </>
          )}
        </div>

        <div className="flex-1 hidden sm:flex justify-end pr-3 text-xs text-muted-foreground">
          {display.time && <TimeDisplay timeZone={nav.timezone} />}
        </div>
      </header>
    </>
  );
};

export default TimeDisplay;
```

- [ ] **Step 6: Update RouteGuard dynamic route check**

In `src/components/RouteGuard.tsx`, on line 34, change:

```tsx
const dynamicRoutes = ["/blog", "/work"] as const;
```

to:

```tsx
const dynamicRoutes = ["/sports", "/work"] as const;
```

- [ ] **Step 7: Verify sports route**

```bash
pnpm dev
```

Visit `http://localhost:3000/sports` — expected: posts list from Sanity.
Visit `http://localhost:3000/sports/<slug>` — expected: post detail with Portable Text body.
Check Header — expected: "Sports" nav item with Dumbbell icon.

- [ ] **Step 8: Commit**

```bash
git add src/app/sports/ src/components/blog/ src/components/Header.tsx src/components/RouteGuard.tsx
git commit -m "feat: create sports route and migrate Posts/Post components"
```

---

## Task 13: Migrate gallery page and Footer

**Files:**
- Modify: `src/components/gallery/MasonryGrid.tsx`
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Update MasonryGrid to accept images as props**

Replace `src/components/gallery/MasonryGrid.tsx`:

```tsx
"use client";

import Masonry from "react-masonry-css";
import Image from "next/image";

interface GalleryImage {
  _id: string;
  imageUrl: string;
  alt: string;
  orientation: string;
}

interface MasonryGridProps {
  images: GalleryImage[];
}

export default function MasonryGrid({ images }: MasonryGridProps) {
  const breakpointColumnsObj = {
    default: 2,
    720: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {images.map((image, index) => (
        <div
          key={image._id}
          className="relative mb-4 rounded-xl overflow-hidden border border-border"
          style={{ aspectRatio: image.orientation === "horizontal" ? "16 / 9" : "3 / 4" }}
        >
          <Image
            priority={index < 10}
            src={image.imageUrl}
            alt={image.alt}
            fill
            sizes="(max-width: 560px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      ))}
    </Masonry>
  );
}
```

- [ ] **Step 2: Update gallery/page.tsx**

Replace `src/app/gallery/page.tsx`:

```tsx
import MasonryGrid from "@/components/gallery/MasonryGrid";
import { baseURL } from "@/app/resources";
import { JsonLd } from "@/components/JsonLd";
import { Metadata } from "next";
import { sanityFetch } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { GALLERY_IMAGES_QUERY, PERSON_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Photo gallery — Ernesto Tzompantzi",
  description: "A photo collection by Ernesto Tzompantzi",
  openGraph: {
    title: "Photo gallery — Ernesto Tzompantzi",
    description: "A photo collection by Ernesto Tzompantzi",
    url: `${baseURL}/gallery`,
    images: [`${baseURL}/og?title=${encodeURIComponent("Photo gallery — Ernesto Tzompantzi")}`],
  },
};

export default async function Gallery() {
  const [rawImages, person] = await Promise.all([
    sanityFetch<{
      _id: string;
      image: unknown;
      alt: string;
      orientation: string;
    }[]>({ query: GALLERY_IMAGES_QUERY, tags: ["galleryImage"] }),
    sanityFetch<{ name: string }>({ query: PERSON_QUERY, tags: ["person"] }),
  ]);

  const images = rawImages.map((img) => ({
    _id: img._id,
    imageUrl: urlFor(img.image).width(1200).url(),
    alt: img.alt,
    orientation: img.orientation,
  }));

  return (
    <div className="w-full max-w-screen-lg">
      <JsonLd
        type="WebPage"
        baseURL={baseURL}
        path="/gallery"
        title="Photo gallery — Ernesto Tzompantzi"
        description="A photo collection by Ernesto Tzompantzi"
        image={`${baseURL}/og?title=${encodeURIComponent("Photo gallery — Ernesto Tzompantzi")}`}
        author={{
          name: person.name,
          url: `${baseURL}/gallery`,
          image: "",
        }}
      />
      <MasonryGrid images={images} />
    </div>
  );
}
```

- [ ] **Step 3: Update Footer to fetch from Sanity**

Replace `src/components/Footer.tsx`:

```tsx
import Link from "next/link";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanityFetch } from "@/sanity/lib/client";
import { PERSON_QUERY, SOCIAL_LINKS_QUERY } from "@/sanity/lib/queries";

const iconMap: Record<string, React.ElementType> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: Mail,
  x: FaXTwitter,
};

export const Footer = async () => {
  const [person, socialLinks] = await Promise.all([
    sanityFetch<{ name: string }>({ query: PERSON_QUERY, tags: ["person"] }),
    sanityFetch<{ _id: string; name: string; icon: string; link: string }[]>({
      query: SOCIAL_LINKS_QUERY,
      tags: ["socialLink"],
    }),
  ]);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <div className="h-20 sm:hidden" />
      <footer className="w-full flex justify-center px-2 py-2">
        <div className="w-full max-w-screen-md flex items-center justify-between px-4 py-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} /{" "}
            <span className="text-foreground">{person.name}</span>
            {" "}/ Build your portfolio with{" "}
            <Link
              href="https://once-ui.com/templates/magic-portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Once UI
            </Link>
          </p>
          <div className="flex gap-1">
            {socialLinks.map((item) => {
              if (!item.link) return null;
              const Icon = iconMap[item.icon] ?? Mail;
              return (
                <Button
                  key={item._id}
                  asChild
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-foreground"
                >
                  <Link href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
                    <Icon className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </footer>
    </>
  );
};
```

- [ ] **Step 4: Verify gallery and footer**

```bash
pnpm dev
```

Visit `http://localhost:3000/gallery` — expected: gallery images from Sanity.
Check footer — expected: name and social links from Sanity.

- [ ] **Step 5: Commit**

```bash
git add src/components/gallery/MasonryGrid.tsx src/app/gallery/page.tsx src/components/Footer.tsx
git commit -m "feat: migrate gallery page and Footer to Sanity"
```

---

## Task 14: Update config.js, next.config.mjs, layout, and sitemap

**Files:**
- Modify: `src/app/resources/config.js`
- Modify: `src/app/resources/index.ts`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.mjs`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Update config.js**

Add `nav` and `site` objects and update the routes at the bottom of `src/app/resources/config.js`. Find and replace the routes block:

```js
const routes = {
  "/": true,
  "/about": true,
  "/work": true,
  "/sports": true,
  "/gallery": true,
};
```

Add `nav` and `site` objects before the final export:

```js
const nav = {
  aboutLabel: "About",
  workLabel: "Work",
  sportsLabel: "Sports",
  timezone: "Europe/Budapest",
};

const site = {
  title: "Ernesto Tzompantzi's Portfolio",
  description: "Portfolio website showcasing my work as a Frontend Developer",
  image: "/images/og/home.jpg",
};
```

Update the export at the bottom:

```js
export { routes, protectedRoutes, effects, style, display, mailchimp, baseURL, font, nav, site };
```

- [ ] **Step 2: Update resources/index.ts**

Replace `src/app/resources/index.ts` entirely:

```ts
export {
  routes,
  protectedRoutes,
  effects,
  style,
  display,
  mailchimp,
  baseURL,
  font,
  nav,
  site,
} from "@/app/resources/config";
```

- [ ] **Step 3: Update layout.tsx to use site config**

Replace `src/app/layout.tsx`:

```tsx
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { Footer, Header, RouteGuard } from "@/components";
import { baseURL, font, site } from "@/app/resources";
import { Background } from "@/components/Background";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  metadataBase: new URL(baseURL),
  openGraph: {
    title: site.title,
    description: site.description,
    url: baseURL,
    images: [site.image],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        font.primary.variable,
        font.secondary.variable,
        font.tertiary.variable,
        font.code.variable,
      ].join(" ")}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(isDark ? 'dark' : 'light');
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="theme"
        >
          <Background />
          <div className="h-4 hidden sm:block" />
          <Header />
          <main className="flex-1 flex flex-col items-center px-6 py-8 z-0">
            <div className="w-full flex justify-center">
              <RouteGuard>{children}</RouteGuard>
              <Analytics />
            </div>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Update next.config.mjs**

Replace `next.config.mjs` entirely:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/blog", destination: "/sports", permanent: true },
      { source: "/blog/:slug", destination: "/sports/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 5: Update sitemap.ts**

Replace `src/app/sitemap.ts`:

```ts
import { baseURL, routes as routesConfig } from "@/app/resources";
import { sanityFetch } from "@/sanity/lib/client";
import {
  ALL_SPORTS_POST_SLUGS_QUERY,
  ALL_WORK_PROJECT_SLUGS_QUERY,
} from "@/sanity/lib/queries";

export default async function sitemap() {
  const [sportsPosts, workProjects] = await Promise.all([
    sanityFetch<{ slug: string }[]>({
      query: ALL_SPORTS_POST_SLUGS_QUERY,
      tags: ["sportsPost"],
    }),
    sanityFetch<{ slug: string }[]>({
      query: ALL_WORK_PROJECT_SLUGS_QUERY,
      tags: ["workProject"],
    }),
  ]);

  const sports = sportsPosts.map((post) => ({
    url: `${baseURL}/sports/${post.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const works = workProjects.map((project) => ({
    url: `${baseURL}/work/${project.slug}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  const activeRoutes = Object.keys(routesConfig).filter(
    (route) => routesConfig[route as keyof typeof routesConfig]
  );

  const routes = activeRoutes.map((route) => ({
    url: `${baseURL}${route !== "/" ? route : ""}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...sports, ...works];
}
```

- [ ] **Step 6: Verify full app**

```bash
pnpm dev
```

Check each route:
- `/` — home page with Sanity data
- `/about` — about with Sanity data
- `/work` — work list
- `/work/<slug>` — project detail
- `/sports` — sports list
- `/sports/<slug>` — post detail
- `/gallery` — gallery
- `/blog` — should redirect to `/sports`

- [ ] **Step 7: Commit**

```bash
git add src/app/resources/ src/app/layout.tsx next.config.mjs src/app/sitemap.ts
git commit -m "feat: update config, routing, layout, and sitemap for Sanity migration"
```

---

## Task 15: Add revalidation webhook handler

**Files:**
- Create: `src/app/api/revalidate/route.ts`

- [ ] **Step 1: Create the revalidation endpoint**

Create `src/app/api/revalidate/route.ts`:

```ts
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const VALID_TYPES = [
  "sportsPost",
  "workProject",
  "person",
  "pageSettings",
  "skill",
  "workExperience",
  "socialLink",
  "galleryImage",
] as const;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET not set" },
      { status: 500 }
    );
  }

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  let body: { _type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const type = body._type;

  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json(
      { message: `Unknown document type: ${type}` },
      { status: 400 }
    );
  }

  revalidateTag(type);

  return NextResponse.json({ revalidated: true, type });
}
```

- [ ] **Step 2: Test the endpoint locally**

```bash
pnpm dev
```

In a new terminal:

```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=<your-SANITY_REVALIDATE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"_type": "sportsPost"}'
```

Expected response: `{"revalidated":true,"type":"sportsPost"}`

- [ ] **Step 3: Configure Sanity webhook**

Go to [sanity.io/manage](https://sanity.io/manage) → your project → API → Webhooks → Add webhook:

- **Name:** Next.js revalidation
- **URL:** `https://ernesto-tzompantzi.com/api/revalidate?secret=<your-SANITY_REVALIDATE_SECRET>`
- **Dataset:** production
- **Trigger on:** Create, Update, Delete
- **Filter:** leave empty (all document types)
- **HTTP method:** POST
- **HTTP headers:** Content-Type: application/json
- **Projection:** `{_type}`

Note: The webhook URL must be your production URL, not localhost. Set it up after deploying in Task 17.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/revalidate/
git commit -m "feat: add Sanity webhook revalidation endpoint"
```

---

## Task 16: Clean up old files and dependencies

**Files:**
- Delete: `src/app/resources/content.js`
- Delete: `src/app/utils/utils.ts`
- Delete: `src/app/blog/` (entire folder)
- Delete: `src/app/work/projects/` (MDX files only)
- Modify: `package.json`

- [ ] **Step 1: Run a build first to confirm everything compiles**

```bash
pnpm build
```

Expected: build completes with no TypeScript errors. Fix any errors before proceeding with deletions.

- [ ] **Step 2: Delete old content and MDX files**

```bash
rm src/app/resources/content.js
rm src/app/utils/utils.ts
rm -rf src/app/blog/
rm src/app/work/projects/czech-mobile-app.mdx
rm src/app/work/projects/german-oneshop.mdx
rmdir src/app/work/projects/
```

- [ ] **Step 3: Remove unused dependencies**

```bash
pnpm remove gray-matter next-mdx-remote @mdx-js/loader @next/mdx
```

- [ ] **Step 4: Run build again to confirm no broken imports**

```bash
pnpm build
```

Expected: build completes successfully. If any file still imports from `content.js` or `utils.ts`, the build will fail with a clear module-not-found error — fix those imports.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old MDX content files and unused dependencies"
```

---

## Task 17: Deploy and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push origin prod
```

Vercel auto-deploys on push. Monitor the deployment at vercel.com/dashboard.

- [ ] **Step 2: Set environment variables in Vercel**

Go to Vercel dashboard → your project → Settings → Environment Variables. Add:

```
NEXT_PUBLIC_SANITY_PROJECT_ID   = <value from .env.local>
NEXT_PUBLIC_SANITY_DATASET      = production
SANITY_API_TOKEN                = <your read-only token>
SANITY_REVALIDATE_SECRET        = <your secret>
```

Trigger a redeploy after setting the vars (Vercel → Deployments → Redeploy).

- [ ] **Step 3: Verify production routes**

Visit each route on the live domain:
- `https://ernesto-tzompantzi.com/` — home loads with Sanity data
- `https://ernesto-tzompantzi.com/about` — about loads
- `https://ernesto-tzompantzi.com/work` — work loads
- `https://ernesto-tzompantzi.com/work/german-oneshop` — project detail loads
- `https://ernesto-tzompantzi.com/sports` — sports list loads
- `https://ernesto-tzompantzi.com/sports/<slug>` — post detail loads
- `https://ernesto-tzompantzi.com/gallery` — gallery loads
- `https://ernesto-tzompantzi.com/blog` — redirects to `/sports` ✓
- `https://ernesto-tzompantzi.com/studio` — Studio loads and is usable

- [ ] **Step 4: Configure production Sanity webhook**

Go to [sanity.io/manage](https://sanity.io/manage) → your project → API → Webhooks → Add webhook with your production URL:

```
https://ernesto-tzompantzi.com/api/revalidate?secret=<your-SANITY_REVALIDATE_SECRET>
```

Settings: POST, all document types, projection `{_type}`.

- [ ] **Step 5: Test the end-to-end revalidation workflow**

In Sanity Studio (production at `https://ernesto-tzompantzi.com/studio`):
1. Open a Sports Post → edit the title → Publish
2. Wait 5–10 seconds
3. Reload `https://ernesto-tzompantzi.com/sports`
4. Expected: the updated title appears without a redeploy

Migration complete.
