import { defineField, defineType } from "sanity";

export const workProject = defineType({
  name: "workProject",
  title: "Work Project",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "summary", type: "text", title: "Summary", rows: 3 }),
    defineField({ name: "publishedAt", type: "date", title: "Published At" }),
    defineField({ name: "coverImage", type: "image", title: "Cover Image", options: { hotspot: true } }),
    defineField({ name: "images", type: "array", title: "Additional Images", of: [{ type: "image", options: { hotspot: true } }] }),
    defineField({ name: "link", type: "url", title: "External Link" }),
    defineField({ name: "body", type: "array", title: "Body", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] }),
  ],
  preview: { select: { title: "title", media: "coverImage" } },
});
