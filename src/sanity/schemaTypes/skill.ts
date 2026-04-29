import { defineField, defineType } from "sanity";

export const skill = defineType({
  name: "skill",
  title: "Skill",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (r) => r.required() }),
    defineField({ name: "icon", type: "string", title: "Icon path", description: "e.g. /trademark/typescript.svg" }),
    defineField({ name: "href", type: "url", title: "Link" }),
    defineField({ name: "projects", type: "array", title: "Related Projects", of: [{ type: "reference", to: [{ type: "workProject" }] }] }),
  ],
  preview: { select: { title: "title" } },
});
