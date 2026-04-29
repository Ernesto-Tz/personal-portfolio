import { defineField, defineType } from "sanity";

export const sportsPost = defineType({
  name: "sportsPost",
  title: "Sports Post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "summary", type: "text", title: "Summary", rows: 3 }),
    defineField({ name: "publishedAt", type: "date", title: "Published At" }),
    defineField({ name: "tag", type: "string", title: "Tag" }),
    defineField({ name: "coverImage", type: "image", title: "Cover Image", options: { hotspot: true } }),
    defineField({ name: "body", type: "array", title: "Body", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] }),
  ],
  preview: { select: { title: "title", media: "coverImage" } },
});
